import type { Env } from "./env";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  const response = new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
  if (headers) {
    new Headers(headers).forEach((value, key) => response.headers.append(key, value));
  }
  return response;
}

export function redirect(location: string, cookies: string[] = []): Response {
  const headers = new Headers({ Location: location });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

/**
 * Requests carrying an Origin header must come from the app. Browsers always send
 * Origin on POST requests, so this blocks cross-site form posts and fetches.
 * APP_ORIGIN covers the Vite dev server, whose proxy forwards the browser's Origin.
 */
export function assertAllowedOrigin(request: Request, env: Env): void {
  const origin = request.headers.get("Origin");
  if (!origin) return;
  if (origin !== new URL(request.url).origin && origin !== env.APP_ORIGIN) {
    throw new HttpError(403, "Origin not allowed");
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new HttpError(415, "Expected application/json");
  }
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

export function parseCookies(request: Request): Map<string, string> {
  const cookies = new Map<string, string>();
  const header = request.headers.get("Cookie");
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) cookies.set(name, decodeURIComponent(value));
  }
  return cookies;
}

type CookieOptions = {
  maxAge: number;
  path?: string;
};

/**
 * Builds a first-party Set-Cookie header. Plain-http requests (local `wrangler dev`)
 * omit Secure because Secure cookies cannot be set over http in every browser.
 */
export function serializeCookie(
  request: Request,
  name: string,
  value: string,
  { maxAge, path = "/" }: CookieOptions,
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (new URL(request.url).protocol === "https:") parts.push("Secure");
  return parts.join("; ");
}
