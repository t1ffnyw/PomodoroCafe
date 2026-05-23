import { CafeScene } from "@/components/CafeScene";
import { SettingsBar } from "@/components/SettingsBar";
import { DrinkDisplay } from "@/components/DrinkDisplay";
import { Timer } from "@/components/Timer";
import { Controls } from "@/components/Controls";
import { TodoList } from "@/components/TodoList";
import { useTimer } from "@/hooks/useTimer";
import { useTodos } from "@/hooks/useTodos";
import { defaultScene } from "@/config/scenes";

export default function App() {
  const timer = useTimer();
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();

  return (
    <CafeScene scene={defaultScene}>
      {/* Settings bar — spans the left portion */}
      <div className="mb-6 max-w-3xl">
        <SettingsBar />
      </div>

      {/* Main content: drink illustration | timer card | todo card */}
      <div className="grid flex-1 grid-cols-[auto_1fr_minmax(240px,320px)] items-start gap-6">
        {/* Left — freestanding drink illustration */}
        <div className="flex items-end self-end pb-4">
          <DrinkDisplay
            drink={defaultScene.drink}
            className="h-48 w-36"
          />
        </div>

        {/* Center — Pomodoro timer card */}
        <div className="cafe-card flex flex-col items-center justify-center gap-6 py-10">
          <Timer
            minutes={timer.minutes}
            seconds={timer.seconds}
            mode={timer.mode}
            state={timer.state}
            progress={timer.progress}
          />
          <Controls
            state={timer.state}
            onStart={timer.start}
            onPause={timer.pause}
            onReset={timer.reset}
          />
        </div>

        {/* Right — Todo list card */}
        <div className="cafe-card h-full min-h-[360px]">
          <TodoList
            todos={todos}
            onAdd={addTodo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        </div>
      </div>
    </CafeScene>
  );
}
