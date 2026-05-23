import { CafeScene } from "@/components/CafeScene";
import { SettingsBar } from "@/components/SettingsBar";
import { DrinkDisplay } from "@/components/DrinkDisplay";
import { Timer } from "@/components/Timer";
import { Controls } from "@/components/Controls";
import { CycleTracker } from "@/components/CycleTracker";
import { ModeSelector } from "@/components/ModeSelector";
import { TodoList } from "@/components/TodoList";
import { useTimer } from "@/hooks/useTimer";
import { useTodos } from "@/hooks/useTodos";
import { defaultScene } from "@/config/scenes";

export default function App() {
  const timer = useTimer();
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();

  return (
    <CafeScene scene={defaultScene}>
      <div className="grid flex-1 grid-cols-[1fr_minmax(240px,280px)] gap-10">
        {/* Left column: settings bar on top, then drink & timer side by side */}
        <div className="flex flex-col gap-6">
          <SettingsBar />

          <div className="flex flex-1 items-center gap-6">
            <DrinkDisplay
              drink={defaultScene.drink}
              className="h-80 w-80"
            />

            <div className="cafe-card ml-auto flex w-100 flex-col items-center justify-center gap-5 self-start py-8">
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
              <CycleTracker
                current={timer.cycle}
                total={timer.totalCycles}
              />
              <ModeSelector
                mode={timer.mode}
                onSelect={timer.switchMode}
              />
            </div>
          </div>
        </div>

        {/* Right column: todo list spanning full height */}
        <div className="cafe-card min-h-[200px] max-h-[575px]">
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
