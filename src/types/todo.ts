export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  /** Set for todos pulled from Notion; absent for todos added in the app. */
  notionPageId?: string;
  notionDue?: string;
};
