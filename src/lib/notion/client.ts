import type {
  NotionDatabaseSchema,
  NotionDatabaseSummary,
  NotionStatus,
  NotionSyncSettings,
  NotionTask,
} from "@/types/notion";

export class NotionApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new NotionApiError(0, "Can't reach the Notion service. Is it running?");
  }

  const body = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok || body === null) {
    const message =
      body?.error ??
      (response.status >= 500
        ? "Can't reach the Notion service. Is it running?"
        : `Request failed (${response.status})`);
    throw new NotionApiError(response.status, message);
  }
  return body;
}

/** Full-page redirect into Notion's OAuth consent screen. */
export function connect(): void {
  window.location.assign("/auth/notion/start");
}

export async function logout(): Promise<void> {
  await request("/auth/notion/logout", { method: "POST" });
}

export function getStatus(): Promise<NotionStatus> {
  return request<NotionStatus>("/api/notion/me");
}

export async function listDatabases(): Promise<NotionDatabaseSummary[]> {
  const { databases } = await request<{ databases: NotionDatabaseSummary[] }>(
    "/api/notion/databases",
  );
  return databases;
}

export function getSchema(databaseId: string): Promise<NotionDatabaseSchema> {
  return request<NotionDatabaseSchema>(
    `/api/notion/databases/${encodeURIComponent(databaseId)}/schema`,
  );
}

export async function fetchTasks(
  settings: NotionSyncSettings,
  excludePageIds: string[] = [],
): Promise<NotionTask[]> {
  if (!settings.databaseId) {
    throw new NotionApiError(400, "Pick a Notion database first.");
  }
  const { tasks } = await request<{ tasks: NotionTask[] }>("/api/notion/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      databaseId: settings.databaseId,
      titleProperty: settings.titleProperty,
      statusProperty: settings.statusProperty,
      dueProperty: settings.dueProperty,
      statusValues: settings.statusValues,
      maxTasks: settings.maxTasks,
      dueWindowDays: settings.dueWindowDays,
      fillBeyondWindow: settings.fillBeyondWindow,
      excludePageIds,
    }),
  });
  return tasks;
}
