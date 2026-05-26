import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { TimerConfig } from "@/types/timer";
import { SettingsPopup } from "./SettingsPopup";

type SettingsBarProps = {
  title?: string;
  timerConfig: TimerConfig;
  onConfigChange: (config: TimerConfig) => void;
};

export function SettingsBar({
  title = "Café Pomodoro",
  timerConfig,
  onConfigChange,
}: SettingsBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="cafe-card relative flex w-9.5/10 items-center justify-between px-6 py-3">
      <h1 className="font-display text-xl font-semibold text-cafe-text">
        {title}
      </h1>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cafe-button-shadow flex h-10 w-10 items-center justify-center rounded-xl bg-cafe-pink text-white [--cafe-button-shadow-color:var(--color-cafe-pink-dark)] hover:bg-cafe-pink-dark"
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
        {isOpen && (
          <SettingsPopup
            config={timerConfig}
            onSave={onConfigChange}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
