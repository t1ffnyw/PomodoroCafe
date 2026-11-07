import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Todo } from "@/types/todo";
import { useTodos } from "./useTodos";

const STORAGE_KEY = "cafe-pomodoro-todos";
const DAY = 24 * 60 * 60 * 1000;

const stored = (): Todo[] => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
const at = (ms: number) => vi.spyOn(Date, "now").mockReturnValue(ms);

function withTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  return renderHook(() => useTodos());
}

const todo = (id: string, extra: Partial<Todo> = {}): Todo => ({
  id,
  text: id,
  completed: false,
  createdAt: 1_000,
  updatedAt: 1_000,
  ...extra,
});

describe("useTodos", () => {
  it("stamps new todos with createdAt and updatedAt", () => {
    at(5_000);
    const { result } = renderHook(() => useTodos());

    act(() => result.current.addTodo("Write tests"));

    expect(result.current.todos[0]).toMatchObject({
      text: "Write tests",
      createdAt: 5_000,
      updatedAt: 5_000,
    });
  });

  it("bumps updatedAt when a todo is toggled or edited", () => {
    const { result } = withTodos([todo("a")]);

    at(2_000);
    act(() => result.current.toggleTodo("a"));
    expect(result.current.todos[0]).toMatchObject({ completed: true, updatedAt: 2_000 });

    at(3_000);
    act(() => result.current.updateTodo("a", "renamed"));
    expect(result.current.todos[0]).toMatchObject({ text: "renamed", updatedAt: 3_000 });
  });

  it("hides a deleted todo but keeps it as a tombstone so the deletion can sync", () => {
    const { result } = withTodos([todo("a"), todo("b")]);

    at(2_000);
    act(() => result.current.deleteTodo("a"));

    expect(result.current.todos.map((t) => t.id)).toEqual(["b"]);
    expect(result.current.allTodos[0]).toMatchObject({ id: "a", deleted: true, updatedAt: 2_000 });
    expect(stored().find((t) => t.id === "a")?.deleted).toBe(true);
  });

  it("bumps updatedAt only for todos that moved when reordering", () => {
    const { result } = withTodos([todo("a"), todo("b"), todo("c")]);

    at(4_000);
    act(() => result.current.reorderTodos([todo("b"), todo("a")]));

    const byId = Object.fromEntries(result.current.allTodos.map((t) => [t.id, t]));
    expect(result.current.allTodos.map((t) => t.id)).toEqual(["b", "a", "c"]);
    expect(byId.a?.updatedAt).toBe(4_000);
    expect(byId.b?.updatedAt).toBe(4_000);
    expect(byId.c?.updatedAt).toBe(1_000);
  });

  it("keeps tombstones in their slot when reordering the visible todos", () => {
    // A recent tombstone, so it survives the 30-day pruning on load.
    const { result } = withTodos([
      todo("a"),
      todo("gone", { deleted: true, updatedAt: Date.now() }),
      todo("b"),
    ]);

    act(() => result.current.reorderTodos([todo("b"), todo("a")]));

    expect(result.current.allTodos.map((t) => t.id)).toEqual(["b", "gone", "a"]);
  });

  it("drops tombstones older than 30 days on load but keeps recent ones", () => {
    const now = 100 * DAY;
    at(now);
    const { result } = withTodos([
      todo("old", { deleted: true, updatedAt: now - 31 * DAY }),
      todo("recent", { deleted: true, updatedAt: now - 1 * DAY }),
      todo("live", { updatedAt: now - 365 * DAY }),
    ]);

    expect(result.current.allTodos.map((t) => t.id)).toEqual(["recent", "live"]);
  });

  it("loads todos saved before timestamps existed", () => {
    const legacy = { id: "x", text: "old todo", completed: false, createdAt: 1_000 };
    const { result } = withTodos([legacy as Todo]);

    expect(result.current.todos).toEqual([legacy]);
  });

  it("does not re-add a Notion task that is already linked", () => {
    const { result } = withTodos([todo("a", { notionPageId: "page-1" })]);

    act(() =>
      result.current.addNotionTasks([
        { pageId: "page-1", title: "Already here" },
        { pageId: "page-2", title: "New task" },
      ] as never),
    );

    expect(result.current.todos.map((t) => t.notionPageId)).toEqual(["page-1", "page-2"]);
  });

  it("replaces the whole list, tombstones included", () => {
    const { result } = withTodos([todo("a")]);

    act(() => result.current.replaceAllTodos([todo("b"), todo("c", { deleted: true })]));

    expect(result.current.todos.map((t) => t.id)).toEqual(["b"]);
    expect(result.current.allTodos.map((t) => t.id)).toEqual(["b", "c"]);
  });
});
