// SettingsPopup component to edit timer settings 
// focus, short break, long break, cycles before long break

import { useState } from "react";
import { motion } from "framer-motion";
import type { TimerConfig } from "@/types/timer";
import type { AppPreferences } from "@/types/preferences";

type SettingsPopupProps = {
  config: TimerConfig;
  preferences: AppPreferences;
  onSave: (config: TimerConfig, preferences: AppPreferences) => void;
  onClose: () => void;
};

export function SettingsPopup({
  config,
  preferences,
  onSave,
  onClose,
}: SettingsPopupProps) {
  const [focus, setFocus] = useState(config.focusMinutes);
  const [shortBreak, setShortBreak] = useState(config.breakMinutes);
  const [longBreak, setLongBreak] = useState(config.longBreakMinutes);
  const [cycles, setCycles] = useState(config.cyclesBeforeLongBreak);
  const [autoStartBreaks, setAutoStartBreaks] = useState(
    preferences.autoStartBreaks,
  );
  const [autoStartFocus, setAutoStartFocus] = useState(
    preferences.autoStartFocus,
  );

  function handleSave() {
    onSave(
      {
        focusMinutes: Math.max(1, focus),
        breakMinutes: Math.max(1, shortBreak),
        longBreakMinutes: Math.max(1, longBreak),
        cyclesBeforeLongBreak: Math.max(1, cycles),
      },
      {
        ...preferences,
        autoStartBreaks,
        autoStartFocus,
      },
    );
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="popup w-72"
    >
      <h3 className="mb-4 font-display text-base font-semibold text-cafe-text">
        Timer Settings
      </h3>

      <div className="grid grid-cols-[auto_4rem_2rem] items-center gap-x-3 gap-y-3">
        <label className="contents">
          <span className="font-body text-sm text-cafe-text">Focus</span>
          <input
            type="number"
            min={1}
            max={120}
            value={focus}
            onChange={(e) => setFocus(Number(e.target.value))}
            className="input-number"
          />
          <span className="text-muted-xs">min</span>
        </label>

        <label className="contents">
          <span className="font-body text-sm text-cafe-text">Short Break</span>
          <input
            type="number"
            min={1}
            max={60}
            value={shortBreak}
            onChange={(e) => setShortBreak(Number(e.target.value))}
            className="input-number"
          />
          <span className="text-muted-xs">min</span>
        </label>

        <label className="contents">
          <span className="font-body text-sm text-cafe-text">Long Break</span>
          <input
            type="number"
            min={1}
            max={60}
            value={longBreak}
            onChange={(e) => setLongBreak(Number(e.target.value))}
            className="input-number"
          />
          <span className="text-muted-xs">min</span>
        </label>

        <label className="contents">
          <span className="font-body text-sm text-cafe-text">Cycles</span>
          <input
            type="number"
            min={1}
            max={8}
            value={cycles}
            onChange={(e) => setCycles(Number(e.target.value))}
            className="input-number"
          />
          <span className="text-muted-xs">set</span>
        </label>
      </div>

      <h4 className="mb-2 mt-5 font-display text-sm font-semibold text-cafe-text">
        Behavior
      </h4>
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={autoStartBreaks}
            onChange={(e) => setAutoStartBreaks(e.target.checked)}
            className="h-4 w-4 accent-cafe-matcha"
          />
          <span className="font-body text-sm text-cafe-text">
            Auto-start breaks
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={autoStartFocus}
            onChange={(e) => setAutoStartFocus(e.target.checked)}
            className="h-4 w-4 accent-cafe-matcha"
          />
          <span className="font-body text-sm text-cafe-text">
            Auto-start focus
          </span>
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-sm btn--matcha flex-1"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn--pink-contrast flex-1"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
