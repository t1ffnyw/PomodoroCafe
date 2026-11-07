import { useState, useEffect, useCallback, useMemo } from "react";
import type { Todo } from "@/types/todo";
import type { NotionTask } from "@/types/notion";

const STORAGE_KEY = "cafe-pomodoro-todos";
/** Deleted todos are kept this long so the deletion can reach other devices. */
const TOMBSTONE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const cutoff = Date.now() - TOMBSTONE_TTL_MS;
    return (JSON.parse(raw) as Todo[]).filter(
      (t) => !t.deleted || (t.updatedAt ?? t.createdAt) > cutoff,
    );
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (err) {
    console.warn("Failed to save todos to localStorage", err);
  }
}

export function useTodos() {
  // Includes tombstones (deleted todos); `todos` below is what the UI sees.
  const [allTodos, setAllTodos] = useState<Todo[]>(loadTodos);

  useEffect(() => {
    saveTodos(allTodos);
  }, [allTodos]);

  const todos = useMemo(() => allTodos.filter((t) => !t.deleted), [allTodos]);

  const addTodo = useCallback((text: string) => {
    const now = Date.now();
    setAllTodos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setAllTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, updatedAt: Date.now() } : t,
      ),
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setAllTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, deleted: true, updatedAt: Date.now() } : t,
      ),
    );
  }, []);

  const updateTodo = useCallback((id: string, text: string) => {
    setAllTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text, updatedAt: Date.now() } : t)),
    );
  }, []);

  /** Appends Notion tasks that aren't already in the list; existing todos are never changed. */
  const addNotionTasks = useCallback((tasks: NotionTask[]) => {
    setAllTodos((prev) => {
      const linked = new Set(
        prev.filter((t) => !t.deleted).map((t) => t.notionPageId),
      );
      const now = Date.now();
      const additions: Todo[] = tasks
        .filter((task) => !linked.has(task.pageId))
        .map((task) => ({
          id: crypto.randomUUID(),
          text: task.title,
          completed: false,
          createdAt: now,
          updatedAt: now,
          notionPageId: task.pageId,
          notionDue: task.due,
        }));
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, []);

  /**
   * Applies a new order for a subset of todos (e.g. only the visible, incomplete ones).
   * Todos outside the subset (including tombstones) keep their positions.
   */
  const reorderTodos = useCallback((ordered: Todo[]) => {
    setAllTodos((prev) => {
      const orderedIds = new Set(ordered.map((t) => t.id));
      const byId = new Map(prev.map((t) => [t.id, t]));
      const now = Date.now();
      let next = 0;
      return prev.map((t) => {
        if (!orderedIds.has(t.id)) return t;
        const replacement = ordered[next++];
        const moved = replacement && byId.get(replacement.id);
        if (!moved) return t;
        // Moved todos get a new timestamp so their new position syncs.
        return moved.id === t.id ? moved : { ...moved, updatedAt: now };
      });
    });
  }, []);

  /** Replaces the whole list, tombstones included (used when merging with the server). */
  const replaceAllTodos = useCallback((next: Todo[]) => {
    setAllTodos(next);
  }, []);

  return {
    todos,
    allTodos,
    replaceAllTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    addNotionTasks,
    reorderTodos,
  };
}
