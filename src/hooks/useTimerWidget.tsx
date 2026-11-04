// useTimerWidget hook to open the timer in an always-on-top
// Document Picture-in-Picture window (Chrome and Edge)

import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TimerWidget } from "@/components/TimerWidget";
import type { ThemeId } from "@/types/theme";
import type { TimerMode, TimerSnapshot, TimerState } from "@/types/timer";

const WIDGET_SIZE = { width: 220, height: 280 };

type UseTimerWidgetProps = {
  themeId: ThemeId;
  mode: TimerMode;
  state: TimerState;
  getSnapshot: () => TimerSnapshot;
  onTick: () => void;
  onStart: () => void;
  onPause: () => void;
};

function copyStyles(from: Document, to: Document) {
  for (const sheet of Array.from(from.styleSheets)) {
    try {
      const style = to.createElement("style");
      style.textContent = Array.from(sheet.cssRules, (rule) => rule.cssText).join(
        "\n",
      );
      to.head.append(style);
    } catch {
      // Cross-origin sheets (Google Fonts) hide their rules, so link them instead.
      if (sheet.href) {
        const link = to.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href;
        to.head.append(link);
      }
    }
  }
}

export function useTimerWidget({
  themeId,
  mode,
  state,
  getSnapshot,
  onTick,
  onStart,
  onPause,
}: UseTimerWidgetProps) {
  const isSupported = typeof window.documentPictureInPicture !== "undefined";
  const [widgetWindow, setWidgetWindow] = useState<Window | null>(null);
  const rootRef = useRef<Root | null>(null);

  const open = useCallback(async () => {
    const pip = window.documentPictureInPicture;
    if (!pip || rootRef.current) return;

    let pipWindow: Window;
    try {
      pipWindow = await pip.requestWindow(WIDGET_SIZE);
    } catch (error) {
      console.warn("Could not open the timer widget", error);
      return;
    }
    pipWindow.document.title = "Pomodoro Cafe";
    copyStyles(document, pipWindow.document);

    const container = pipWindow.document.createElement("div");
    pipWindow.document.body.append(container);
    rootRef.current = createRoot(container);

    pipWindow.addEventListener(
      "pagehide",
      () => {
        rootRef.current?.unmount();
        rootRef.current = null;
        setWidgetWindow(null);
      },
      { once: true },
    );

    setWidgetWindow(pipWindow);
  }, []);

  const toggle = useCallback(() => {
    if (widgetWindow) {
      widgetWindow.close();
    } else {
      void open();
    }
  }, [widgetWindow, open]);

  useEffect(() => {
    if (widgetWindow) {
      widgetWindow.document.documentElement.dataset.theme = themeId;
    }
  }, [widgetWindow, themeId]);

  useEffect(() => {
    if (!widgetWindow) return;
    rootRef.current?.render(
      <TimerWidget
        getSnapshot={getSnapshot}
        onTick={onTick}
        onStart={onStart}
        onPause={onPause}
        tickWindow={widgetWindow}
      />,
    );
  }, [widgetWindow, mode, state, getSnapshot, onTick, onStart, onPause]);

  useEffect(() => {
    return () => widgetWindow?.close();
  }, [widgetWindow]);

  return { isSupported, isOpen: widgetWindow !== null, toggle };
}
