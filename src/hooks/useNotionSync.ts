import { useCallback, useEffect, useState } from "react";
import type { Todo } from "@/types/todo";
import type { NotionSyncSettings, NotionTask } from "@/types/notion";
import { NotionApiError, fetchTasks } from "@/lib/notion/client";

export type NotionSyncState =
  | { status: "idle" }
  | { status: "syncing" }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

const MESSAGE_DURATION_MS = 5000;

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * One-way, fill-only sync: Notion todos that are still unchecked are left alone,
 * and new tasks are only pulled into free slots (up to `maxTasks` unchecked).
 */
export function useNotionSync(
  todos: Todo[],
  settings: NotionSyncSettings,
  addNotionTasks: (tasks: NotionTask[]) => void,
  onSessionExpired: () => void,
) {
  const [state, setState] = useState<NotionSyncState>({ status: "idle" });

  useEffect(() => {
    if (state.status !== "done" && state.status !== "error") return;
    const timeout = window.setTimeout(
      () => setState({ status: "idle" }),
      MESSAGE_DURATION_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [state]);

  const sync = useCallback(async () => {
    if (!settings.databaseId) {
      setState({
        status: "error",
        message: "Set up Notion with the Notion button first.",
      });
      return;
    }

    const openNotionTodos = todos.filter(
      (t) => t.notionPageId && !t.completed,
    ).length;
    const slots = settings.maxTasks - openNotionTodos;
    if (slots <= 0) {
      setState({
        status: "done",
        message: `${plural(openNotionTodos, "Notion task")} still open. Finish one to pull more.`,
      });
      return;
    }

    setState({ status: "syncing" });
    try {
      const linkedPageIds = todos.flatMap((t) =>
        t.notionPageId ? [t.notionPageId] : [],
      );
      const tasks = await fetchTasks(
        { ...settings, maxTasks: slots },
        linkedPageIds,
      );
      addNotionTasks(tasks);
      setState({
        status: "done",
        message:
          tasks.length > 0
            ? `Added ${plural(tasks.length, "task")} from Notion.`
            : "No new Notion tasks to add.",
      });
    } catch (error) {
      if (error instanceof NotionApiError && error.status === 401) {
        onSessionExpired();
        setState({
          status: "error",
          message: "Reconnect with the Notion button below.",
        });
        return;
      }
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Sync failed.",
      });
    }
  }, [todos, settings, addNotionTasks, onSessionExpired]);

  return { syncState: state, sync };
}
