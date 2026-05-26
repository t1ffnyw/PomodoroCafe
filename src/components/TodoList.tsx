import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Todo } from "@/types/todo";

type TodoListProps = {
  todos: Todo[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TodoList({ todos, onAdd, onToggle, onDelete }: TodoListProps) {
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
        <span className="text-sm text-cafe-text-light">
          {remaining} remaining
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-lg border-none bg-white/60 px-3 py-2 font-body text-sm text-cafe-text placeholder:text-cafe-text-light/60 focus:outline-none focus:ring-2 focus:ring-cafe-matcha/40"
        />
        <button
          type="submit"
          className="cafe-button-shadow rounded-lg bg-cafe-matcha px-3 py-2 text-sm font-semibold text-white [--cafe-button-shadow-color:var(--color-cafe-sage-dark)] hover:bg-cafe-sage-dark"
        >
          Add
        </button>
      </form>

      <ul className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        <AnimatePresence>
          {todos.map((todo) => (
            <motion.li
              key={todo.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 rounded-lg bg-white/40 px-3 py-2"
            >
              <button
                onClick={() => onToggle(todo.id)}
                className={`cafe-button-shadow h-4 w-4 shrink-0 rounded border-2 [--cafe-button-shadow-color:var(--color-cafe-sage-dark)] ${
                  todo.completed
                    ? "border-cafe-matcha bg-cafe-matcha"
                    : "border-cafe-text-light bg-transparent"
                }`}
              />
              <span
                className={`flex-1 font-body text-sm transition-opacity ${
                  todo.completed
                    ? "text-cafe-text-light line-through opacity-60"
                    : "text-cafe-text"
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => onDelete(todo.id)}
                className="cafe-button-shadow flex h-6 w-6 items-center justify-center rounded-md bg-cafe-pink text-cafe-text [--cafe-button-shadow-color:var(--color-cafe-pink-dark)] hover:bg-cafe-pink-dark hover:text-white"
              >
                ×
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
