import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { TimerConfig } from "@/types/timer";
import type { ThemeId } from "@/types/theme";
import { SettingsPopup } from "./SettingsPopup";
import { ThemePicker } from "./ThemePicker";

type SettingsBarProps = {
  title?: string;
  timerConfig: TimerConfig;
  onConfigChange: (config: TimerConfig) => void;
  themeId: ThemeId;
  onThemeChange: (id: ThemeId) => void;
};

export function SettingsBar({
  title = "Pomodoro Cafe",
  timerConfig,
  onConfigChange,
  themeId,
  onThemeChange,
}: SettingsBarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  return (
    <div className="cafe-card relative flex w-9.5/10 items-center justify-between px-6 py-3">
      <h1 className="font-display text-xl font-semibold text-cafe-text">
        {title}
      </h1>
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => {
            setIsThemeOpen(!isThemeOpen);
            setIsSettingsOpen(false);
          }}
          className="btn btn-icon btn--pink text-white hover:text-white"
          aria-label="Change theme"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
            <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
            <path d="M14.5 17.5 4.5 15" />
          </svg>
        </button>
        <button
          onClick={() => {
            setIsSettingsOpen(!isSettingsOpen);
            setIsThemeOpen(false);
          }}
          className="btn btn-icon btn--pink text-white hover:text-white"
          aria-label="Settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        <AnimatePresence>
          {isThemeOpen && (
            <ThemePicker
              themeId={themeId}
              onSelect={onThemeChange}
              onClose={() => setIsThemeOpen(false)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isSettingsOpen && (
            <SettingsPopup
              config={timerConfig}
              onSave={onConfigChange}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
