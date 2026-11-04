import type { Env } from "./env";
import { HttpError, assertAllowedOrigin, json } from "./http";
import { handleOAuthCallback, logout, me, startOAuth } from "./oauth";
import { getSchema, listDatabases, queryTasks } from "./routes";

type Handler = (request: Request, env: Env, params: string[]) => Promise<Response>;

type Route = {
  method: string;
  pattern: RegExp;
  handler: Handler;
};

const routes: Route[] = [
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
