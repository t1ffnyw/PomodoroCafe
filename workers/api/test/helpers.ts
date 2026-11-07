import { env, exports } from "cloudflare:workers";
import { signSessionId } from "../src/session";

export type TestUser = { id: string; email: string; cookie: string };

/** Creates a user row plus a signed login session, as a completed Google login would. */
export async function createUser(email = "a@example.com"): Promise<TestUser> {
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO users (id, provider, provider_id, email, name, created_at) VALUES (?, 'google', ?, ?, ?, ?)",
  )
    .bind(id, `google-${id}`, email, "Test User", Date.now())
    .run();

  const sessionId = crypto.randomUUID();
  await env.SESSIONS.put(`user_session:${sessionId}`, JSON.stringify({ userId: id }));
  const cookie = `cp_session=${encodeURIComponent(await signSessionId(env, sessionId))}`;
  return { id, email, cookie };
}

type CallOptions = {
  user?: TestUser;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

/** Calls the Worker the way the browser does (same-origin, JSON). */
export function call(path: string, { user, method = "GET", body, headers }: CallOptions = {}) {
  // redirect: "manual" so tests can assert on the 302 itself (Location, Set-Cookie)
  // instead of following it back into the Worker.
  const init: RequestInit = { method, headers: { ...headers }, redirect: "manual" };
  if (user) (init.headers as Record<string, string>).Cookie = user.cookie;
  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return exports.default.fetch(new Request(`http://localhost:8787${path}`, init));
}

export const now = () => Date.now();

export const todo = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  text: "Write tests",
  completed: false,
  position: 0,
  createdAt: 1_000,
  updatedAt: 1_000,
  deleted: false,
  ...overrides,
});

export const hours = (fill = 0) => Array<number>(24).fill(fill);

export const day = (overrides: Record<string, unknown> = {}) => ({
  focusMinutes: 25,
  completedSessions: 1,
  hourlyMinutes: hours(),
  hourlyCompletions: hours(),
  updatedAt: 1_000,
  ...overrides,
});

/** A second login session for an existing user, like signing in on another device. */
export async function newSession(user: TestUser): Promise<TestUser> {
  const sessionId = crypto.randomUUID();
  await env.SESSIONS.put(`user_session:${sessionId}`, JSON.stringify({ userId: user.id }));
  const cookie = `cp_session=${encodeURIComponent(await signSessionId(env, sessionId))}`;
  return { ...user, cookie };
}

/** The non-empty cookies a response sets, as a Cookie request header value. */
export function cookiesFrom(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0] ?? "")
    .filter((pair) => pair.includes("=") && !pair.endsWith("="))
    .join("; ");
}
