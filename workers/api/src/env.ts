export interface Env {
  SESSIONS: KVNamespace;
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
  SESSION_SIGNING_SECRET: string;
  NOTION_REDIRECT_URI: string;
  /** Origin the app is served from; the OAuth callback redirects here. */
  APP_ORIGIN: string;
}
