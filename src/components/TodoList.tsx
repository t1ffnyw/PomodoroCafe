// TodoList component to display the todo list
// with a form to add a new todo and a reorderable list of todos

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
} from "framer-motion";
import type { Todo } from "@/types/todo";
import type { NotionSyncState } from "@/hooks/useNotionSync";

type TodoListProps = {
  todos: Todo[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onReorder: (ordered: Todo[]) => void;
  syncState: NotionSyncState;
  /** Shows the Sync button next to Add when provided. */
  onSync?: () => void;
  /** Rendered in the bottom-left corner of the list; popups inside can anchor to its full width. */
  footer?: ReactNode;
};

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
};

function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    setEditText(todo.text);
    setIsEditing(true);
  }

  function commitEdit() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      onUpdate(todo.id, trimmed);
    }
    setIsEditing(false);
  }

  function cancelEdit() {
    setEditText(todo.text);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  }

  const textClassName = `min-w-0 flex-1 break-words font-body text-sm transition-opacity ${
    todo.completed
      ? "text-cafe-text-light line-through opacity-60"
      : "text-cafe-text"
  }`;

  return (
    <Reorder.Item
      value={todo}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
      className="relative flex min-w-0 items-start gap-2 rounded-lg bg-white/40 px-2 py-2"
    >
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        className="-ml-0.5 flex h-4 w-3 shrink-0 cursor-grab touch-none items-center justify-center text-cafe-text-light active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.2" />
          <circle cx="6" cy="2" r="1.2" />
          <circle cx="2" cy="7" r="1.2" />
          <circle cx="6" cy="7" r="1.2" />
          <circle cx="2" cy="12" r="1.2" />
          <circle cx="6" cy="12" r="1.2" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        className={`cafe-button-shadow h-4 w-4 shrink-0 rounded border-2 [--cafe-button-shadow-color:var(--color-cafe-sage-dark)] ${
          todo.completed
            ? "border-cafe-matcha bg-cafe-matcha"
            : "border-cafe-text-light bg-transparent"
        }`}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
      />
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className={`input min-w-0 flex-1 py-1 ${textClassName}`}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className={`${textClassName} cursor-text text-left`}
        >
          {todo.text}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        className="btn btn--pink-contrast flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
        aria-label="Delete task"
      >
        ×
      </button>
    </Reorder.Item>
  );
}

export function TodoList({
  todos,
  onAdd,
  onToggle,
  onDelete,
  onUpdate,
  onReorder,
  syncState,
  onSync,
  footer,
}: TodoListProps) {
  const [input, setInput] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput("");
  }

  const remaining = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - remaining;
  const visibleTodos = showCompleted
    ? todos
    : todos.filter((t) => !t.completed);
  const isSyncing = syncState.status === "syncing";
  const syncMessage =
    syncState.status === "done" || syncState.status === "error"
      ? syncState
      : null;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-cafe-text">To Do List</h2>
        <span className="text-sm text-muted">
          {remaining} remaining
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task..."
          className="input min-w-0 flex-1"
        />
        <button
          type="submit"
          className="btn btn-sm btn--matcha"
        >
          Add
        </button>
        {onSync && (
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="btn btn--cream h-9 w-9 shrink-0 rounded-lg disabled:opacity-60"
            aria-label="Sync with Notion"
            title="Sync with Notion"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isSyncing ? "animate-spin" : undefined}
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          </button>
        )}
      </form>

      <AnimatePresence>
        {syncMessage && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`-mt-1 font-body text-xs ${
              syncMessage.status === "error"
                ? "text-cafe-wood-dark"
                : "text-cafe-text-light"
            }`}
          >
            {syncMessage.message}
          </motion.p>
        )}
      </AnimatePresence>

      {completedCount > 0 && (
        <button
          type="button"
          onClick={() => setShowCompleted((prev) => !prev)}
          className="self-start font-body text-sm font-semibold text-cafe-matcha hover:underline"
        >
          {showCompleted ? "Hide completed" : "Show completed"}
        </button>
      )}

      <Reorder.Group
        axis="y"
        values={visibleTodos}
        onReorder={onReorder}
        layoutScroll
        className="cafe-scrollbar flex min-w-0 flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto"
      >
        <AnimatePresence>
          {visibleTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {footer && <div className="relative flex justify-start">{footer}</div>}
    </div>
  );
}
