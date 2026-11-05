export interface Env {
  NOTION_SESSIONS: KVNamespace;
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
  SESSION_SIGNING_SECRET: string;
  NOTION_REDIRECT_URI: string;
  /** Origin the app is served from; the OAuth callback redirects here. */
  APP_ORIGIN: string;
}
