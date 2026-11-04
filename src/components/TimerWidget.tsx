// Compact timer shown in the always-on-top Picture-in-Picture window

import { useEffect, useReducer } from "react";
import type { TimerSnapshot } from "@/types/timer";
import { Timer } from "./Timer";
import { Controls } from "./Controls";

type TimerWidgetProps = {
  getSnapshot: () => TimerSnapshot;
  onTick: () => void;
  onStart: () => void;
  onPause: () => void;
  tickWindow: Window;
};

export function TimerWidget({
  getSnapshot,
  onTick,
  onStart,
  onPause,
  tickWindow,
}: TimerWidgetProps) {
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  // The widget window stays visible, so its timers keep running at full
  // speed while the cafe tab is in the background and throttled.
  useEffect(() => {
    const id = tickWindow.setInterval(() => {
      onTick();
      forceRender();
    }, 250);
    return () => tickWindow.clearInterval(id);
  }, [tickWindow, onTick]);

  const { mode, state, remainingMs, totalMs } = getSnapshot();
  const minutes = Math.floor(remainingMs / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1000);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-cafe-sage-light">
      <Timer
        minutes={minutes}
        seconds={seconds}
        mode={mode}
        state={state}
        progress={1 - remainingMs / totalMs}
        size="mini"
      />
      <Controls state={state} onStart={onStart} onPause={onPause} />
    </div>
  );
}
