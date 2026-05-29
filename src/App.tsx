import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CafeScene } from "@/components/CafeScene";
import { SettingsBar } from "@/components/SettingsBar";
import { DrinkDisplay } from "@/components/DrinkDisplay";
import { Timer } from "@/components/Timer";
import { Controls } from "@/components/Controls";
import { CycleTracker } from "@/components/CycleTracker";
import { ModeSelector } from "@/components/ModeSelector";
import { TodoList } from "@/components/TodoList";
import { FocusModeOverlay } from "@/components/FocusModeOverlay";
import { SessionCelebration } from "@/components/SessionCelebration";
import { useTimer } from "@/hooks/useTimer";
import { useTimerConfig } from "@/hooks/useTimerConfig";
import { useAppPreferences } from "@/hooks/useAppPreferences";
import { useTheme } from "@/hooks/useTheme";
import { useThemeFavicon } from "@/hooks/useThemeFavicon";
import { useChime } from "@/hooks/useChime";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { useTabTitle } from "@/hooks/useTabTitle";
import { useTodos } from "@/hooks/useTodos";
import type { SessionCompleteEvent } from "@/types/preferences";
import type { AppPreferences } from "@/types/preferences";
import type { TimerConfig } from "@/types/timer";

export default function App() {
  const { config: timerConfig, updateConfig } = useTimerConfig();
  const { preferences, updatePreferences } = useAppPreferences();
  const { themeId, theme, setTheme } = useTheme();
  useThemeFavicon(theme.cycleIcon);
  useAmbientSound(preferences);

  const { playChime } = useChime();
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  const [celebration, setCelebration] = useState<SessionCompleteEvent | null>(
    null,
  );
  const [isFocusMode, setIsFocusMode] = useState(false);

  const onSessionComplete = useCallback(
    (event: SessionCompleteEvent) => {
      setCelebration(event);
      if (preferencesRef.current.chimeEnabled) {
        playChime();
      }
    },
    [playChime],
  );

  const timer = useTimer(timerConfig, preferences, { onSessionComplete });
  const { todos, addTodo, toggleTodo, deleteTodo, updateTodo } = useTodos();

  useTabTitle({
    minutes: timer.minutes,
    seconds: timer.seconds,
    state: timer.state,
    mode: timer.mode,
  });

  useEffect(() => {
    if (timer.mode !== "focus") {
      setIsFocusMode(false);
    }
  }, [timer.mode]);

  function handleSavePreferences(prefs: AppPreferences) {
    updatePreferences(prefs);
  }

  function handleSaveSettings(config: TimerConfig, prefs: AppPreferences) {
    updatePreferences(prefs);

    const configChanged =
      config.focusMinutes !== timerConfig.focusMinutes ||
      config.breakMinutes !== timerConfig.breakMinutes ||
      config.longBreakMinutes !== timerConfig.longBreakMinutes ||
      config.cyclesBeforeLongBreak !== timerConfig.cyclesBeforeLongBreak;

    if (configChanged) {
      updateConfig(config);
    }
  }

  return (
    <CafeScene scene={theme.scene} themeId={themeId}>
      <AnimatePresence>
        {celebration && (
          <SessionCelebration
            completedMode={celebration.completedMode}
            drinkIcon={theme.cycleIcon}
            onDismiss={() => setCelebration(null)}
          />
        )}
      </AnimatePresence>

      {isFocusMode && (
        <FocusModeOverlay
          minutes={timer.minutes}
          seconds={timer.seconds}
          mode={timer.mode}
          state={timer.state}
          progress={timer.progress}
          onStart={timer.start}
          onPause={timer.pause}
          onReset={timer.reset}
          onClose={() => setIsFocusMode(false)}
        />
      )}

      <div className="grid flex-1 grid-cols-[1fr_minmax(240px,280px)] gap-10">
        <div className="flex flex-col gap-6">
          <SettingsBar
            timerConfig={timerConfig}
            preferences={preferences}
            onSaveSettings={handleSaveSettings}
            onSavePreferences={handleSavePreferences}
            themeId={themeId}
            onThemeChange={setTheme}
            showFocusModeButton={timer.mode === "focus"}
            onEnterFocusMode={() => setIsFocusMode(true)}
          />

          <div className="flex flex-1 items-center gap-6">
            <DrinkDisplay
              drink={theme.scene.drink}
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
                cycleIcon={theme.cycleIcon}
              />
              <ModeSelector
                mode={timer.mode}
                onSelect={timer.switchMode}
              />
            </div>
          </div>
        </div>

        <div className="cafe-card min-h-[200px] max-h-[585px]">
          <TodoList
            todos={todos}
            onAdd={addTodo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onUpdate={updateTodo}
          />
        </div>
      </div>
    </CafeScene>
  );
}
