import type { Env } from "./env";
import { json, parseCookies, redirect, serializeCookie } from "./http";
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSession,
  randomToken,
} from "./session";

const STATE_COOKIE = "cp_notion_state";
const STATE_COOKIE_PATH = "/auth/notion";
const STATE_TTL_SECONDS = 600;
const stateKey = (state: string) => `oauth_state:${state}`;

type NotionTokenResponse = {
  access_token: string;
  refresh_token?: string | null;
  bot_id: string;
  workspace_id: string;
  workspace_name?: string | null;
  workspace_icon?: string | null;
};

function appRedirect(env: Env, status: "connected" | "error", reason?: string): string {
  const url = new URL("/", env.APP_ORIGIN);
  url.searchParams.set("notion", status);
  if (reason) url.searchParams.set("reason", reason);
  return url.toString();
}

export async function startOAuth(request: Request, env: Env): Promise<Response> {
  const state = randomToken();
  await env.NOTION_SESSIONS.put(stateKey(state), "1", {
    expirationTtl: STATE_TTL_SECONDS,
  });

  const authorizeUrl = new URL("https://api.notion.com/v1/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", env.NOTION_CLIENT_ID);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("owner", "user");
  authorizeUrl.searchParams.set("redirect_uri", env.NOTION_REDIRECT_URI);
  authorizeUrl.searchParams.set("state", state);

  return redirect(authorizeUrl.toString(), [
    serializeCookie(request, STATE_COOKIE, state, {
      maxAge: STATE_TTL_SECONDS,
      path: STATE_COOKIE_PATH,
    }),
  ]);
}

async function exchangeCode(env: Env, code: string): Promise<NotionTokenResponse> {
  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.NOTION_REDIRECT_URI,
    }),
  });
  if (!response.ok) {
    throw new Error(`Notion token exchange failed: ${response.status} ${await response.text()}`);
  }
  return response.json<NotionTokenResponse>();
}

export async function handleOAuthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const clearState = serializeCookie(request, STATE_COOKIE, "", {
    maxAge: 0,
    path: STATE_COOKIE_PATH,
  });

  const notionError = url.searchParams.get("error");
  if (notionError) {
    return redirect(appRedirect(env, "error", notionError), [clearState]);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = parseCookies(request).get(STATE_COOKIE);
  const stateIssued = state ? await env.NOTION_SESSIONS.get(stateKey(state)) : null;
  if (!code || !state || state !== cookieState || !stateIssued) {
    return redirect(appRedirect(env, "error", "invalid_state"), [clearState]);
  }
  await env.NOTION_SESSIONS.delete(stateKey(state));

  let token: NotionTokenResponse;
  try {
    token = await exchangeCode(env, code);
  } catch (error) {
    console.error(error);
    return redirect(appRedirect(env, "error", "token_exchange_failed"), [clearState]);
  }

  const previous = await getSession(request, env);
  if (previous) await deleteSession(env, previous.id);

  const sessionCookie = await createSession(request, env, {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    workspaceId: token.workspace_id,
    workspaceName: token.workspace_name ?? null,
    workspaceIcon: token.workspace_icon ?? null,
    botId: token.bot_id,
  });

  return redirect(appRedirect(env, "connected"), [clearState, sessionCookie]);
}

export async function logout(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (session) await deleteSession(env, session.id);
  return json({ connected: false }, 200, { "Set-Cookie": clearSessionCookie(request) });
}

export async function me(request: Request, env: Env): Promise<Response> {
  const session = await getSession(request, env);
  if (!session) return json({ connected: false });
  return json({
    connected: true,
    workspaceName: session.data.workspaceName,
    workspaceIcon: session.data.workspaceIcon,
  });
}
