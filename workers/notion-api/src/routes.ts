import type { Env } from "./env";
import { HttpError, json, readJson } from "./http";
import {
  getDatabase,
  paginate,
  plainText,
  queryDatabasePage,
  searchDatabases,
  type NotionDatabase,
  type NotionPage,
} from "./notion";
import { requireSession } from "./session";

const DATABASE_ID_PATTERN = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const STATUS_TYPES = ["status", "select"] as const;

type StatusType = (typeof STATUS_TYPES)[number];

export type TasksRequest = {
  databaseId: string;
  titleProperty: string;
  statusProperty: string;
  dueProperty: string;
  statusValues: string[];
  maxTasks?: number;
  dueWindowDays?: number;
  fillBeyondWindow?: boolean;
  /** Pages the app already has locally; skipped so they don't use up `maxTasks`. */
  excludePageIds?: string[];
};

export type NotionTask = {
  pageId: string;
  title: string;
  due: string;
};

function assertDatabaseId(id: string | undefined): string {
  if (!id || !DATABASE_ID_PATTERN.test(id)) {
    throw new HttpError(400, "Invalid database id");
  }
  return id;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Normalizes page ids so dashed and undashed forms compare equal. */
function normalizeId(id: string): string {
  return id.replace(/-/g, "").toLowerCase();
}

/** YYYY-MM-DD for `days` from now, in UTC. */
function dateFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function optionNames(property: NotionDatabase["properties"][string]): string[] | undefined {
  if (property.type === "status") return property.status?.options.map((o) => o.name);
  if (property.type === "select") return property.select?.options.map((o) => o.name);
  return undefined;
}

export async function listDatabases(request: Request, env: Env): Promise<Response> {
  const session = await requireSession(request, env);
  const databases = await searchDatabases(session, env);
  return json({
    databases: databases
      .map((db) => ({ id: db.id, title: plainText(db.title) || "Untitled" }))
      .sort((a, b) => a.title.localeCompare(b.title)),
  });
}

export async function getSchema(request: Request, env: Env, params: string[]): Promise<Response> {
  const session = await requireSession(request, env);
  const database = await getDatabase(session, env, assertDatabaseId(params[0]));
  return json({
    id: database.id,
    title: plainText(database.title) || "Untitled",
    properties: Object.values(database.properties).map((property) => ({
      name: property.name,
      type: property.type,
      options: optionNames(property),
    })),
  });
}

function propertyOfType(
  database: NotionDatabase,
  name: string,
  types: readonly string[],
  label: string,
): NotionDatabase["properties"][string] {
  const property = database.properties[name];
  if (!property) throw new HttpError(400, `${label} property "${name}" not found`);
  if (!types.includes(property.type)) {
    throw new HttpError(400, `${label} property "${name}" must be of type ${types.join(" or ")}`);
  }
  return property;
}

function toTask(page: NotionPage, titleProperty: string, dueProperty: string): NotionTask | null {
  const due = page.properties[dueProperty]?.date?.start;
  if (!due) return null;
  return {
    pageId: page.id,
    title: plainText(page.properties[titleProperty]?.title) || "Untitled",
    due,
  };
}

export async function queryTasks(request: Request, env: Env): Promise<Response> {
  const session = await requireSession(request, env);
  const body = await readJson<Partial<TasksRequest>>(request);

  const databaseId = assertDatabaseId(body.databaseId);
  const { titleProperty, statusProperty, dueProperty } = body;
  if (!isNonEmptyString(titleProperty) || !isNonEmptyString(statusProperty) || !isNonEmptyString(dueProperty)) {
    throw new HttpError(400, "titleProperty, statusProperty, and dueProperty are required");
  }
  const statusValues = Array.isArray(body.statusValues)
    ? body.statusValues.filter(isNonEmptyString)
    : [];
  if (statusValues.length === 0) {
    throw new HttpError(400, "statusValues must include at least one status");
  }
  const maxTasks = clampInt(body.maxTasks, 1, 20, 5);
  const dueWindowDays = clampInt(body.dueWindowDays, 0, 365, 7);
  const fillBeyondWindow = body.fillBeyondWindow ?? true;
  const excluded = new Set(
    (Array.isArray(body.excludePageIds) ? body.excludePageIds : [])
      .filter(isNonEmptyString)
      .map(normalizeId),
  );

  const database = await getDatabase(session, env, databaseId);
  propertyOfType(database, titleProperty, ["title"], "Title");
  propertyOfType(database, dueProperty, ["date"], "Due date");
  const statusType = propertyOfType(database, statusProperty, STATUS_TYPES, "Status")
    .type as StatusType;

  const dueFilters: Record<string, unknown>[] = [
    { property: dueProperty, date: { is_not_empty: true } },
  ];
  if (!fillBeyondWindow) {
    dueFilters.push({ property: dueProperty, date: { on_or_before: dateFromNow(dueWindowDays) } });
  }

  const pickTasks = (pages: NotionPage[]): NotionTask[] => {
    const tasks: NotionTask[] = [];
    for (const page of pages) {
      if (tasks.length >= maxTasks) break;
      if (excluded.has(normalizeId(page.id))) continue;
      const task = toTask(page, titleProperty, dueProperty);
      if (task) tasks.push(task);
    }
    return tasks;
  };

  // Sorted soonest-first, so the first `maxTasks` results already prefer the due
  // window and fall through to later due dates only when the window runs short.
  const pages = await paginate(
    (cursor) =>
      queryDatabasePage(session, env, databaseId, {
        filter: {
          and: [
            {
              or: statusValues.map((value) => ({
                property: statusProperty,
                [statusType]: { equals: value },
              })),
            },
            ...dueFilters,
          ],
        },
        sorts: [{ property: dueProperty, direction: "ascending" }],
        page_size: 100,
        start_cursor: cursor,
      }),
    (collected) => pickTasks(collected).length >= maxTasks,
  );

  return json({ tasks: pickTasks(pages) });
}
