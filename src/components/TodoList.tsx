// TodoList component to display the todo list
// with a form to add a new todo and a list of todos

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Todo } from "@/types/todo";

type TodoListProps = {
  todos: Todo[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
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
    <motion.li
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex min-w-0 items-start gap-2 rounded-lg bg-white/40 px-3 py-2"
    >
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
    </motion.li>
  );
}

export function TodoList({
  todos,
  onAdd,
  onToggle,
  onDelete,
  onUpdate,
}: TodoListProps) {
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput("");
  }

  const remaining = todos.filter((t) => !t.completed).length;

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
          className="input flex-1"
        />
        <button
          type="submit"
          className="btn btn-sm btn--matcha"
        >
          Add
        </button>
      </form>

      <ul className="cafe-scrollbar flex min-w-0 flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto">
        <AnimatePresence>
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
