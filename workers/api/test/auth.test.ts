import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { call, cookiesFrom, createUser } from "./helpers";

type GoogleProfile = { sub: string; email?: string; name?: string };

/** Replaces outbound fetch so the Worker "talks to Google" without any network. */
function mockGoogle({
  tokenOk = true,
  profile = { sub: "google-sub-1", email: "tiff@example.com", name: "Tiff" },
}: { tokenOk?: boolean; profile?: GoogleProfile } = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === "https://oauth2.googleapis.com/token") {
      return tokenOk
        ? Response.json({ access_token: "google-access-token" })
        : new Response("invalid_grant", { status: 400 });
    }
    if (url === "https://openidconnect.googleapis.com/v1/userinfo") {
      return Response.json(profile);
    }
    throw new Error(`Unexpected outbound request: ${url}`);
  });
}

/** Starts a login and returns the state Google would echo back, plus the state cookie. */
async function startLogin() {
  const response = await call("/auth/login/google");
  const location = new URL(response.headers.get("Location") ?? "");
  return { response, location, state: location.searchParams.get("state") ?? "", cookie: cookiesFrom(response) };
}

const callback = (query: string, cookie = "") =>
  call(`/auth/login/google/callback?${query}`, { headers: cookie ? { Cookie: cookie } : {} });

const userCount = async () =>
  (await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>())?.n;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("starting a Google login", () => {
  it("redirects to Google with the app's client id, redirect uri and scopes", async () => {
    const { response, location } = await startLogin();

    expect(response.status).toBe(302);
    expect(location.origin + location.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(location.searchParams.get("client_id")).toBe("test-google-client-id");
    expect(location.searchParams.get("redirect_uri")).toBe(
      "http://localhost:5173/auth/login/google/callback",
    );
    expect(location.searchParams.get("response_type")).toBe("code");
    expect(location.searchParams.get("scope")).toBe("openid email profile");
  });

  it("sets an HttpOnly state cookie matching the state sent to Google", async () => {
    const { response, state } = await startLogin();
    const setCookie = response.headers.getSetCookie().join(";");

    expect(state).not.toBe("");
    expect(setCookie).toContain(`cp_login_state=${state}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
  });

  it("uses a different state every time", async () => {
    expect((await startLogin()).state).not.toBe((await startLogin()).state);
  });
});

describe("finishing a Google login", () => {
  it("creates the user, signs them in and redirects to the app", async () => {
    const fetchSpy = mockGoogle();
    const { state, cookie } = await startLogin();

    const response = await callback(`code=auth-code&state=${state}`, cookie);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("http://localhost:5173/?login=success");
    expect(await userCount()).toBe(1);

    const row = await env.DB.prepare("SELECT provider, provider_id, email, name FROM users").first();
    expect(row).toEqual({
      provider: "google",
      provider_id: "google-sub-1",
      email: "tiff@example.com",
      name: "Tiff",
    });

    // The authorization code and client credentials were sent to Google's token endpoint.
    const tokenCall = fetchSpy.mock.calls.find(([url]) => String(url).includes("oauth2.googleapis.com"));
    const body = new URLSearchParams(String((tokenCall?.[1] as RequestInit).body));
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("client_id")).toBe("test-google-client-id");
    expect(body.get("client_secret")).toBe("test-google-client-secret");
    expect(body.get("grant_type")).toBe("authorization_code");

    // The new session cookie is HttpOnly and works for authenticated routes.
    expect(response.headers.getSetCookie().join(";")).toMatch(/cp_session=.*HttpOnly/);
    const me = await call("/api/me", { headers: { Cookie: cookiesFrom(response) } });
    expect(await me.json()).toEqual({ user: { email: "tiff@example.com", name: "Tiff" } });
  });

  it("reuses the same user when they sign in again", async () => {
    mockGoogle({ profile: { sub: "google-sub-1", email: "tiff@example.com", name: "Old Name" } });
    let login = await startLogin();
    await callback(`code=c1&state=${login.state}`, login.cookie);

    vi.restoreAllMocks();
    mockGoogle({ profile: { sub: "google-sub-1", email: "tiff@example.com", name: "New Name" } });
    login = await startLogin();
    await callback(`code=c2&state=${login.state}`, login.cookie);

    expect(await userCount()).toBe(1);
    const row = await env.DB.prepare("SELECT name FROM users").first<{ name: string }>();
    expect(row?.name).toBe("New Name");
  });

  it("creates separate users for different Google accounts", async () => {
    mockGoogle({ profile: { sub: "sub-a", email: "a@example.com" } });
    let login = await startLogin();
    await callback(`code=c1&state=${login.state}`, login.cookie);

    vi.restoreAllMocks();
    mockGoogle({ profile: { sub: "sub-b", email: "b@example.com" } });
    login = await startLogin();
    await callback(`code=c2&state=${login.state}`, login.cookie);

    expect(await userCount()).toBe(2);
  });

  it("rejects a callback whose state does not match the cookie", async () => {
    mockGoogle();
    const { state } = await startLogin();

    const response = await callback(`code=auth-code&state=${state}`, "cp_login_state=different");

    expect(response.headers.get("Location")).toBe("http://localhost:5173/?login=error&reason=invalid_state");
    expect(await userCount()).toBe(0);
  });

  it("rejects a callback with no state cookie at all", async () => {
    mockGoogle();
    const { state } = await startLogin();

    const response = await callback(`code=auth-code&state=${state}`);

    expect(response.headers.get("Location")).toContain("reason=invalid_state");
    expect(await userCount()).toBe(0);
  });

  it("rejects a state the server never issued", async () => {
    mockGoogle();
    const response = await callback("code=auth-code&state=made-up", "cp_login_state=made-up");

    expect(response.headers.get("Location")).toContain("reason=invalid_state");
    expect(await userCount()).toBe(0);
  });

  it("accepts each state only once", async () => {
    mockGoogle();
    const { state, cookie } = await startLogin();
    await callback(`code=auth-code&state=${state}`, cookie);

    const replay = await callback(`code=auth-code&state=${state}`, cookie);

    expect(replay.headers.get("Location")).toContain("reason=invalid_state");
  });

  it("reports a cancelled consent screen without creating a user", async () => {
    const response = await callback("error=access_denied");

    expect(response.headers.get("Location")).toBe("http://localhost:5173/?login=error&reason=access_denied");
    expect(await userCount()).toBe(0);
  });

  it("reports a failed token exchange without creating a user or session", async () => {
    mockGoogle({ tokenOk: false });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { state, cookie } = await startLogin();

    const response = await callback(`code=bad-code&state=${state}`, cookie);

    expect(response.headers.get("Location")).toBe("http://localhost:5173/?login=error&reason=login_failed");
    expect(await userCount()).toBe(0);
    expect(response.headers.getSetCookie().join(";")).not.toMatch(/cp_session=[^;]/);
  });
});

describe("session endpoints", () => {
  it("/api/me reports signed out without a session", async () => {
    expect(await (await call("/api/me")).json()).toEqual({ user: null });
  });

  it("/api/me returns the signed-in user's email and name only", async () => {
    const user = await createUser("me@example.com");
    expect(await (await call("/api/me", { user })).json()).toEqual({
      user: { email: "me@example.com", name: "Test User" },
    });
  });

  it("logging out clears the cookie and ends the session", async () => {
    const user = await createUser();

    const response = await call("/auth/logout", { user, method: "POST" });

    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie().join(";")).toMatch(/cp_session=;.*Max-Age=0/);
    expect((await call("/api/todos", { user })).status).toBe(401);
  });

  it("blocks state-changing requests from other origins", async () => {
    const user = await createUser();

    const evil = await call("/auth/logout", {
      user,
      method: "POST",
      headers: { Origin: "https://evil.example" },
    });
    expect(evil.status).toBe(403);

    const app = await call("/auth/logout", {
      user,
      method: "POST",
      headers: { Origin: "http://localhost:5173" },
    });
    expect(app.status).toBe(200);
  });
});
