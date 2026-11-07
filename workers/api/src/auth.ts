import type { Env } from "./env";
import { HttpError, json, parseCookies, redirect, serializeCookie } from "./http";
import {
  SESSION_TTL_SECONDS,
  randomToken,
  signSessionId,
  verifySessionCookie,
} from "./session";

/** Google user sessions. Separate from the anonymous Notion session cookie. */
const USER_COOKIE = "cp_session";
const STATE_COOKIE = "cp_login_state";
const STATE_COOKIE_PATH = "/auth/login";
const STATE_TTL_SECONDS = 600;
const userSessionKey = (id: string) => `user_session:${id}`;
const loginStateKey = (state: string) => `login_state:${state}`;

export type User = {
  id: string;
  email: string | null;
  name: string | null;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  name?: string;
};

function appRedirect(env: Env, status: "success" | "error", reason?: string): string {
  const url = new URL("/", env.APP_ORIGIN);
  url.searchParams.set("login", status);
  if (reason) url.searchParams.set("reason", reason);
  return url.toString();
}

export async function startGoogleLogin(request: Request, env: Env): Promise<Response> {
  const state = randomToken();
  await env.SESSIONS.put(loginStateKey(state), "1", {
    expirationTtl: STATE_TTL_SECONDS,
  });

  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", env.GOOGLE_REDIRECT_URI);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "select_account");

  return redirect(authorizeUrl.toString(), [
    serializeCookie(request, STATE_COOKIE, state, {
      maxAge: STATE_TTL_SECONDS,
      path: STATE_COOKIE_PATH,
    }),
  ]);
}

async function fetchGoogleUser(env: Env, code: string): Promise<GoogleUserInfo> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) {
    throw new Error(`Google token exchange failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
  }
  const { access_token } = await tokenResponse.json<{ access_token: string }>();

  const infoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!infoResponse.ok) {
    throw new Error(`Google userinfo failed: ${infoResponse.status}`);
  }
  return infoResponse.json<GoogleUserInfo>();
}

async function upsertUser(env: Env, info: GoogleUserInfo): Promise<string> {
  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE provider = 'google' AND provider_id = ?",
  )
    .bind(info.sub)
    .first<{ id: string }>();

  if (existing) {
    await env.DB.prepare("UPDATE users SET email = ?, name = ? WHERE id = ?")
      .bind(info.email ?? null, info.name ?? null, existing.id)
      .run();
    return existing.id;
  }

  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO users (id, provider, provider_id, email, name, created_at) VALUES (?, 'google', ?, ?, ?, ?)",
  )
    .bind(id, info.sub, info.email ?? null, info.name ?? null, Date.now())
    .run();
  return id;
}

export async function handleGoogleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const clearState = serializeCookie(request, STATE_COOKIE, "", {
    maxAge: 0,
    path: STATE_COOKIE_PATH,
  });

  const googleError = url.searchParams.get("error");
  if (googleError) {
    return redirect(appRedirect(env, "error", googleError), [clearState]);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = parseCookies(request).get(STATE_COOKIE);
  const stateIssued = state ? await env.SESSIONS.get(loginStateKey(state)) : null;
  if (!code || !state || state !== cookieState || !stateIssued) {
    return redirect(appRedirect(env, "error", "invalid_state"), [clearState]);
  }
  await env.SESSIONS.delete(loginStateKey(state));

  let userId: string;
  try {
    userId = await upsertUser(env, await fetchGoogleUser(env, code));
  } catch (error) {
    console.error(error);
    return redirect(appRedirect(env, "error", "login_failed"), [clearState]);
  }

  const previousId = await currentSessionId(request, env);
  if (previousId) await env.SESSIONS.delete(userSessionKey(previousId));

  const sessionId = randomToken();
  await env.SESSIONS.put(userSessionKey(sessionId), JSON.stringify({ userId }), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  const sessionCookie = serializeCookie(
    request,
    USER_COOKIE,
    await signSessionId(env, sessionId),
    { maxAge: SESSION_TTL_SECONDS },
  );

  return redirect(appRedirect(env, "success"), [clearState, sessionCookie]);
}

async function currentSessionId(request: Request, env: Env): Promise<string | null> {
  const cookie = parseCookies(request).get(USER_COOKIE);
  return cookie ? verifySessionCookie(env, cookie) : null;
}

export async function getUser(request: Request, env: Env): Promise<User | null> {
  const sessionId = await currentSessionId(request, env);
  if (!sessionId) return null;
  const session = await env.SESSIONS.get<{ userId: string }>(
    userSessionKey(sessionId),
    "json",
  );
  if (!session) return null;
  return env.DB.prepare("SELECT id, email, name FROM users WHERE id = ?")
    .bind(session.userId)
    .first<User>();
}

export async function requireUser(request: Request, env: Env): Promise<User> {
  const user = await getUser(request, env);
  if (!user) throw new HttpError(401, "Not signed in");
  return user;
}

const clearUserCookie = (request: Request) =>
  serializeCookie(request, USER_COOKIE, "", { maxAge: 0 });

export async function logoutUser(request: Request, env: Env): Promise<Response> {
  const sessionId = await currentSessionId(request, env);
  if (sessionId) await env.SESSIONS.delete(userSessionKey(sessionId));
  return json({ user: null }, 200, { "Set-Cookie": clearUserCookie(request) });
}

export async function meUser(request: Request, env: Env): Promise<Response> {
  const user = await getUser(request, env);
  return json({ user: user ? { email: user.email, name: user.name } : null });
}

/** Deletes the account and every row owned by it (privacy policy: data deletion). */
export async function deleteAccount(request: Request, env: Env): Promise<Response> {
  const user = await requireUser(request, env);
  const sessionId = await currentSessionId(request, env);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM todos WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM settings WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM daily_progress WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
  ]);
  if (sessionId) await env.SESSIONS.delete(userSessionKey(sessionId));
  return json({ user: null }, 200, { "Set-Cookie": clearUserCookie(request) });
}
