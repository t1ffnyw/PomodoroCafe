export type NotionSyncSettings = {
  databaseId: string | null;
  databaseTitle: string | null;
  titleProperty: string;
  statusProperty: string;
  dueProperty: string;
  statusValues: string[];
  maxTasks: number;
  dueWindowDays: number;
  fillBeyondWindow: boolean;
};

export const DEFAULT_NOTION_SYNC_SETTINGS: NotionSyncSettings = {
  databaseId: null,
  databaseTitle: null,
  titleProperty: "",
  statusProperty: "",
  dueProperty: "",
  statusValues: [],
  maxTasks: 5,
  dueWindowDays: 7,
  fillBeyondWindow: true,
};

export type NotionStatus =
  | { connected: false }
  | { connected: true; workspaceName: string | null; workspaceIcon: string | null };

export type NotionDatabaseSummary = {
  id: string;
  title: string;
};

export type NotionPropertySchema = {
  name: string;
  type: string;
  options?: string[];
};

export type NotionDatabaseSchema = {
  id: string;
  title: string;
  properties: NotionPropertySchema[];
};

export type NotionTask = {
  pageId: string;
  title: string;
  /** Notion date start: `YYYY-MM-DD` or an ISO datetime. */
  due: string;
};
