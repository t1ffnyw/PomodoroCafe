import type { Env } from "./env";
import { HttpError, parseCookies, serializeCookie } from "./http";

export const SESSION_COOKIE = "cp_notion_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type SessionData = {
  accessToken: string;
  refreshToken: string | null;
  workspaceId: string;
  workspaceName: string | null;
  workspaceIcon: string | null;
  botId: string;
  createdAt: number;
  expiresAt: number;
};

export type Session = {
  id: string;
  data: SessionData;
};

const sessionKey = (id: string) => `session:${id}`;

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

export function randomToken(byteLength = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

function signingKey(env: Env): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SESSION_SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signSessionId(env: Env, id: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await signingKey(env),
    new TextEncoder().encode(id),
  );
  return `${id}.${toBase64Url(signature)}`;
}

async function verifySessionCookie(env: Env, value: string): Promise<string | null> {
  const [id, signature] = value.split(".");
  if (!id || !signature) return null;
  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return null;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await signingKey(env),
    signatureBytes,
    new TextEncoder().encode(id),
  );
  return valid ? id : null;
}

/** Stores the session in KV and returns the Set-Cookie header for it. */
export async function createSession(
  request: Request,
  env: Env,
  data: Omit<SessionData, "createdAt" | "expiresAt">,
): Promise<string> {
  const id = randomToken();
  const createdAt = Date.now();
  const session: SessionData = {
    ...data,
    createdAt,
    expiresAt: createdAt + SESSION_TTL_SECONDS * 1000,
  };
  await env.NOTION_SESSIONS.put(sessionKey(id), JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  return serializeCookie(request, SESSION_COOKIE, await signSessionId(env, id), {
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSession(request: Request, env: Env): Promise<Session | null> {
  const cookie = parseCookies(request).get(SESSION_COOKIE);
  if (!cookie) return null;
  const id = await verifySessionCookie(env, cookie);
  if (!id) return null;
  const data = await env.NOTION_SESSIONS.get<SessionData>(sessionKey(id), "json");
  return data ? { id, data } : null;
}

export async function requireSession(request: Request, env: Env): Promise<Session> {
  const session = await getSession(request, env);
  if (!session) throw new HttpError(401, "Not connected to Notion");
  return session;
}

export function deleteSession(env: Env, id: string): Promise<void> {
  return env.NOTION_SESSIONS.delete(sessionKey(id));
}

export function clearSessionCookie(request: Request): string {
  return serializeCookie(request, SESSION_COOKIE, "", { maxAge: 0 });
}
