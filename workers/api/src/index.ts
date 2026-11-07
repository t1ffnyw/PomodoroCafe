import type { Env } from "./env";
import { HttpError, assertAllowedOrigin, json } from "./http";
import { deleteAccount, handleGoogleCallback, logoutUser, meUser, startGoogleLogin } from "./auth";
import {
  getProgress,
  getSettings,
  getTodos,
  putProgress,
  putSettings,
  putTodos,
} from "./data";
import { handleOAuthCallback, logout, me, startOAuth } from "./oauth";
import { getSchema, listDatabases, queryTasks } from "./routes";

type Handler = (request: Request, env: Env, params: string[]) => Promise<Response>;

type Route = {
  method: string;
  pattern: RegExp;
  handler: Handler;
};

const routes: Route[] = [
  { method: "GET", pattern: /^\/auth\/login\/google$/, handler: startGoogleLogin },
  { method: "GET", pattern: /^\/auth\/login\/google\/callback$/, handler: handleGoogleCallback },
  { method: "POST", pattern: /^\/auth\/logout$/, handler: logoutUser },
  { method: "GET", pattern: /^\/api\/me$/, handler: meUser },
  { method: "DELETE", pattern: /^\/api\/account$/, handler: deleteAccount },
  { method: "GET", pattern: /^\/api\/todos$/, handler: getTodos },
  { method: "PUT", pattern: /^\/api\/todos$/, handler: putTodos },
  { method: "GET", pattern: /^\/api\/settings$/, handler: getSettings },
  { method: "PUT", pattern: /^\/api\/settings$/, handler: putSettings },
  { method: "GET", pattern: /^\/api\/progress$/, handler: getProgress },
  { method: "PUT", pattern: /^\/api\/progress$/, handler: putProgress },
  { method: "GET", pattern: /^\/auth\/notion\/start$/, handler: startOAuth },
  { method: "GET", pattern: /^\/auth\/notion\/callback$/, handler: handleOAuthCallback },
  { method: "POST", pattern: /^\/auth\/notion\/logout$/, handler: logout },
  { method: "GET", pattern: /^\/api\/notion\/me$/, handler: me },
  { method: "GET", pattern: /^\/api\/notion\/databases$/, handler: listDatabases },
  {
    method: "GET",
    pattern: /^\/api\/notion\/databases\/([^/]+)\/schema$/,
    handler: getSchema,
  },
  { method: "POST", pattern: /^\/api\/notion\/tasks$/, handler: queryTasks },
];

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  for (const { method, pattern, handler } of routes) {
    const match = pathname.match(pattern);
    if (match && request.method === method) {
      return handler(request, env, match.slice(1));
    }
  }
  throw new HttpError(404, "Not found");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      assertAllowedOrigin(request, env);
      return await route(request, env);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ error: error.message }, error.status);
      }
      console.error(error);
      return json({ error: "Internal error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
