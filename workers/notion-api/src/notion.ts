import type { Env } from "./env";
import { HttpError } from "./http";
import { deleteSession, type Session } from "./session";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const MAX_PAGES = 10;

type RichText = { plain_text: string };

type NotionProperty = {
  id: string;
  name: string;
  type: string;
  status?: { options: { name: string }[] };
  select?: { options: { name: string }[] };
};

export type NotionDatabase = {
  id: string;
  title: RichText[];
  properties: Record<string, NotionProperty>;
};

type PagePropertyValue = {
  type: string;
  title?: RichText[];
  date?: { start: string } | null;
};

export type NotionPage = {
  id: string;
  properties: Record<string, PagePropertyValue>;
};

type ListResponse<T> = {
  results: T[];
  has_more: boolean;
  next_cursor: string | null;
};

export function plainText(richText: RichText[] | undefined): string {
  return (richText ?? []).map((part) => part.plain_text).join("").trim();
}

async function notionFetch<T>(
  session: Session,
  env: Env,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${NOTION_API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${session.data.accessToken}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (response.ok) return response.json<T>();

  if (response.status === 401) {
    await deleteSession(env, session.id);
    throw new HttpError(401, "Notion connection expired. Please reconnect.");
  }
  if (response.status === 404) {
    throw new HttpError(404, "Not found in Notion. Make sure the database is shared with the integration.");
  }
  if (response.status === 429) {
    throw new HttpError(429, "Notion rate limit reached. Try again in a moment.");
  }
  if (response.status === 400) {
    const body = await response.json<{ message?: string }>().catch(() => null);
    throw new HttpError(400, body?.message ?? "Notion rejected the request");
  }
  console.error(`Notion API ${path} failed: ${response.status} ${await response.text()}`);
  throw new HttpError(502, "Notion API request failed");
}

/** Follows `next_cursor` pagination until `shouldStop` or no more results. */
export async function paginate<T>(
  fetchPage: (cursor: string | undefined) => Promise<ListResponse<T>>,
  shouldStop: (collected: T[]) => boolean = () => false,
): Promise<T[]> {
  const collected: T[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await fetchPage(cursor);
    collected.push(...response.results);
    if (!response.has_more || !response.next_cursor || shouldStop(collected)) break;
    cursor = response.next_cursor;
  }
  return collected;
}

export function searchDatabases(session: Session, env: Env): Promise<NotionDatabase[]> {
  return paginate((cursor) =>
    notionFetch<ListResponse<NotionDatabase>>(session, env, "/search", {
      method: "POST",
      body: {
        filter: { property: "object", value: "database" },
        page_size: 100,
        start_cursor: cursor,
      },
    }),
  );
}

export function getDatabase(session: Session, env: Env, databaseId: string): Promise<NotionDatabase> {
  return notionFetch<NotionDatabase>(session, env, `/databases/${databaseId}`);
}

export function queryDatabasePage(
  session: Session,
  env: Env,
  databaseId: string,
  body: Record<string, unknown>,
): Promise<ListResponse<NotionPage>> {
  return notionFetch<ListResponse<NotionPage>>(session, env, `/databases/${databaseId}/query`, {
    method: "POST",
    body,
  });
}
