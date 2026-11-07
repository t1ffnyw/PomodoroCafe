export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  /** Last change (epoch ms); used to merge with the server. Falls back to createdAt. */
  updatedAt?: number;
  /** Tombstone: kept so a deletion syncs to other devices, hidden from the UI. */
  deleted?: boolean;
  /** Set for todos pulled from Notion; absent for todos added in the app. */
  notionPageId?: string;
  notionDue?: string;
};
