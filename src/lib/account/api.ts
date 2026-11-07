import type { AppPreferences } from "@/types/preferences";
import type { DayProgress } from "@/types/progress";
import type { TimerConfig } from "@/types/timer";
import type { Todo } from "@/types/todo";

export class AccountApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type AccountUser = {
  email: string | null;
  name: string | null;
};

export type RemoteTodo = Todo & { position: number };

export type RemoteSettings = {
  timerConfig: Partial<TimerConfig> | null;
  preferences: Partial<AppPreferences> | null;
  theme: string | null;
  updatedAt: number;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new AccountApiError(0, "Can't reach the server.");
  }
  const body = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok || body === null) {
    throw new AccountApiError(
      response.status,
      body?.error ?? `Request failed (${response.status})`,
    );
  }
  return body;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** Full-page redirect into Google's sign-in screen. */
export function signIn(): void {
  window.location.assign("/auth/login/google");
}

export async function signOut(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<AccountUser | null> {
  const { user } = await request<{ user: AccountUser | null }>("/api/me");
  return user;
}

export async function deleteAccount(): Promise<void> {
  await request("/api/account", { method: "DELETE" });
}

export async function getTodos(): Promise<RemoteTodo[]> {
  return (await request<{ todos: RemoteTodo[] }>("/api/todos")).todos;
}

export async function putTodos(todos: RemoteTodo[]): Promise<void> {
  await request("/api/todos", jsonInit("PUT", { todos }));
}

export async function getSettings(): Promise<RemoteSettings | null> {
  return (await request<{ settings: RemoteSettings | null }>("/api/settings"))
    .settings;
}

export async function putSettings(settings: {
  timerConfig: TimerConfig;
  preferences: AppPreferences;
  theme: string;
  updatedAt: number;
}): Promise<void> {
  await request("/api/settings", jsonInit("PUT", settings));
}

export async function getProgress(): Promise<Record<string, DayProgress>> {
  return (
    await request<{ days: Record<string, DayProgress> }>("/api/progress")
  ).days;
}

export async function putProgress(
  days: Record<string, DayProgress>,
): Promise<void> {
  await request("/api/progress", jsonInit("PUT", { days }));
}

/** Local data is a cache of the account's data; wipe it when leaving the account. */
export function clearLocalData(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("cafe-pomodoro-")) localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
