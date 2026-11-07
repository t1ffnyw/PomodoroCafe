import { requireUser } from "./auth";
import type { Env } from "./env";
import { HttpError, json, readJson } from "./http";

/**
 * Per-user app data. Every write is last-write-wins on `updated_at` (epoch ms), so a
 * stale device can never overwrite newer data. Todos are soft-deleted (tombstones) so a
 * deletion on one device is not undone by another device that still has the row.
 */

const MAX_TODOS = 1000;
const MAX_TEXT = 2000;
const MAX_DAYS = 800;
const MAX_JSON = 20_000;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function int(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpError(400, `Invalid ${field}`);
  }
  return Math.trunc(value);
}

function optionalString(value: unknown, field: string, max = 200): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.length > max) {
    throw new HttpError(400, `Invalid ${field}`);
  }
  return value;
}

function jsonColumn(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  const text = JSON.stringify(value);
  if (text.length > MAX_JSON) throw new HttpError(400, `${field} too large`);
  return text;
}

function parseColumn(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// ---- Todos ----------------------------------------------------------------

type TodoRow = {
  id: string;
  text: string;
  completed: number;
  position: number;
  created_at: number;
  updated_at: number;
  deleted: number;
  notion_page_id: string | null;
  notion_due: string | null;
};

export async function getTodos(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  const { results } = await env.DB.prepare(
    "SELECT id, text, completed, position, created_at, updated_at, deleted, notion_page_id, notion_due FROM todos WHERE user_id = ? ORDER BY position",
  )
    .bind(user.id)
    .all<TodoRow>();
  return json({
    todos: results.map((row) => ({
      id: row.id,
      text: row.text,
      completed: row.completed === 1,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deleted: row.deleted === 1,
      notionPageId: row.notion_page_id ?? undefined,
      notionDue: row.notion_due ?? undefined,
    })),
  });
}

export async function putTodos(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  const body = await readJson<{ todos?: unknown }>(request);
  if (!Array.isArray(body.todos) || body.todos.length > MAX_TODOS) {
    throw new HttpError(400, "Invalid todos");
  }

  const statements = body.todos.map((raw) => {
    if (!isRecord(raw)) throw new HttpError(400, "Invalid todo");
    const id = optionalString(raw.id, "id", 64);
    if (!id) throw new HttpError(400, "Invalid id");
    const text = optionalString(raw.text, "text", MAX_TEXT) ?? "";
    return env.DB.prepare(
      `INSERT INTO todos (user_id, id, text, completed, position, created_at, updated_at, deleted, notion_page_id, notion_due)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, id) DO UPDATE SET
         text = excluded.text,
         completed = excluded.completed,
         position = excluded.position,
         updated_at = excluded.updated_at,
         deleted = excluded.deleted,
         notion_page_id = excluded.notion_page_id,
         notion_due = excluded.notion_due
       WHERE excluded.updated_at > todos.updated_at`,
    ).bind(
      user.id,
      id,
      text,
      raw.completed === true ? 1 : 0,
      int(raw.position, "position"),
      int(raw.createdAt, "createdAt"),
      int(raw.updatedAt, "updatedAt"),
      raw.deleted === true ? 1 : 0,
      optionalString(raw.notionPageId, "notionPageId", 64),
      optionalString(raw.notionDue, "notionDue", 40),
    );
  });

  if (statements.length > 0) await env.DB.batch(statements);
  return getTodos(request, env);
}

// ---- Settings (timer config, preferences, theme) ---------------------------

type SettingsRow = {
  timer_config: string | null;
  preferences: string | null;
  theme: string | null;
  updated_at: number;
};

export async function getSettings(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  const row = await env.DB.prepare(
    "SELECT timer_config, preferences, theme, updated_at FROM settings WHERE user_id = ?",
  )
    .bind(user.id)
    .first<SettingsRow>();
  if (!row) return json({ settings: null });
  return json({
    settings: {
      timerConfig: parseColumn(row.timer_config),
      preferences: parseColumn(row.preferences),
      theme: row.theme,
      updatedAt: row.updated_at,
    },
  });
}

export async function putSettings(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  const body = await readJson<Record<string, unknown>>(request);
  const theme = optionalString(body.theme, "theme", 40);

  await env.DB.prepare(
    `INSERT INTO settings (user_id, timer_config, preferences, theme, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       timer_config = excluded.timer_config,
       preferences = excluded.preferences,
       theme = excluded.theme,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at > settings.updated_at`,
  )
    .bind(
      user.id,
      jsonColumn(body.timerConfig, "timerConfig"),
      jsonColumn(body.preferences, "preferences"),
      theme,
      int(body.updatedAt, "updatedAt"),
    )
    .run();
  return getSettings(request, env);
}

// ---- Study progress --------------------------------------------------------

type ProgressRow = {
  date: string;
  focus_minutes: number;
  completed_sessions: number;
  hourly_minutes: string;
  hourly_completions: string;
  updated_at: number;
};

export async function getProgress(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  const { results } = await env.DB.prepare(
    "SELECT date, focus_minutes, completed_sessions, hourly_minutes, hourly_completions, updated_at FROM daily_progress WHERE user_id = ?",
  )
    .bind(user.id)
    .all<ProgressRow>();
  const days: Record<string, unknown> = {};
  for (const row of results) {
    days[row.date] = {
      focusMinutes: row.focus_minutes,
      completedSessions: row.completed_sessions,
      hourlyMinutes: parseColumn(row.hourly_minutes),
      hourlyCompletions: parseColumn(row.hourly_completions),
      updatedAt: row.updated_at,
    };
  }
  return json({ days });
}

function hourlyArray(value: unknown, field: string): string {
  if (
    !Array.isArray(value) ||
    value.length !== 24 ||
    !value.every((n) => typeof n === "number" && Number.isFinite(n))
  ) {
    throw new HttpError(400, `Invalid ${field}`);
  }
  return JSON.stringify(value);
}

export async function putProgress(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  const body = await readJson<{ days?: unknown }>(request);
  if (!isRecord(body.days)) throw new HttpError(400, "Invalid days");
  const entries = Object.entries(body.days);
  if (entries.length > MAX_DAYS) throw new HttpError(400, "Too many days");

  const statements = entries.map(([date, raw]) => {
    if (!DATE_KEY.test(date) || !isRecord(raw)) throw new HttpError(400, "Invalid day");
    return env.DB.prepare(
      `INSERT INTO daily_progress (user_id, date, focus_minutes, completed_sessions, hourly_minutes, hourly_completions, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, date) DO UPDATE SET
         focus_minutes = excluded.focus_minutes,
         completed_sessions = excluded.completed_sessions,
         hourly_minutes = excluded.hourly_minutes,
         hourly_completions = excluded.hourly_completions,
         updated_at = excluded.updated_at
       WHERE excluded.updated_at > daily_progress.updated_at`,
    ).bind(
      user.id,
      date,
      Math.max(0, Number(raw.focusMinutes) || 0),
      Math.max(0, int(raw.completedSessions, "completedSessions")),
      hourlyArray(raw.hourlyMinutes, "hourlyMinutes"),
      hourlyArray(raw.hourlyCompletions, "hourlyCompletions"),
      int(raw.updatedAt, "updatedAt"),
    );
  });

  if (statements.length > 0) await env.DB.batch(statements);
  return getProgress(request, env);
}
