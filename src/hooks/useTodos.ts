import { useState, useEffect, useCallback } from "react";
import type { Todo } from "@/types/todo";
import type { NotionTask } from "@/types/notion";

const STORAGE_KEY = "cafe-pomodoro-todos";

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Todo[]) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const addTodo = useCallback((text: string) => {
    setTodos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTodo = useCallback((id: string, text: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    );
  }, []);

  /** Appends Notion tasks that aren't already in the list; existing todos are never changed. */
  const addNotionTasks = useCallback((tasks: NotionTask[]) => {
    setTodos((prev) => {
      const linked = new Set(prev.map((t) => t.notionPageId));
      const additions: Todo[] = tasks
        .filter((task) => !linked.has(task.pageId))
        .map((task) => ({
          id: crypto.randomUUID(),
          text: task.title,
          completed: false,
          createdAt: Date.now(),
          notionPageId: task.pageId,
          notionDue: task.due,
        }));
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, []);

  /**
   * Applies a new order for a subset of todos (e.g. only the visible, incomplete ones).
   * Todos outside the subset keep their positions.
   */
  const reorderTodos = useCallback((ordered: Todo[]) => {
    setTodos((prev) => {
      const orderedIds = new Set(ordered.map((t) => t.id));
      const byId = new Map(prev.map((t) => [t.id, t]));
      let next = 0;
      return prev.map((t) => {
        if (!orderedIds.has(t.id)) return t;
        const replacement = ordered[next++];
        return (replacement && byId.get(replacement.id)) ?? t;
      });
    });
  }, []);

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    addNotionTasks,
    reorderTodos,
  };
}
