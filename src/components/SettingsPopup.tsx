import { useState } from "react";
import { motion } from "framer-motion";
import type { TimerConfig } from "@/types/timer";

type SettingsPopupProps = {
  config: TimerConfig;
  onSave: (config: TimerConfig) => void;
  onClose: () => void;
};

export function SettingsPopup({ config, onSave, onClose }: SettingsPopupProps) {
  const [focus, setFocus] = useState(config.focusMinutes);
  const [shortBreak, setShortBreak] = useState(config.breakMinutes);
  const [longBreak, setLongBreak] = useState(config.longBreakMinutes);

  function handleSave() {
    onSave({
      focusMinutes: Math.max(1, focus),
      breakMinutes: Math.max(1, shortBreak),
      longBreakMinutes: Math.max(1, longBreak),
      cyclesBeforeLongBreak: config.cyclesBeforeLongBreak,
    });
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl bg-white/95 p-5 shadow-lg backdrop-blur-sm"
    >
      <h3 className="mb-4 font-display text-base font-semibold text-cafe-text">
        Timer Settings
      </h3>

      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between">
          <span className="font-body text-sm text-cafe-text">Focus</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={120}
              value={focus}
              onChange={(e) => setFocus(Number(e.target.value))}
              className="w-16 rounded-lg bg-cafe-sage-light px-2 py-1 text-center font-body text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-matcha/40"
            />
            <span className="text-xs text-cafe-text-light">min</span>
          </div>
        </label>

        <label className="flex items-center justify-between">
          <span className="font-body text-sm text-cafe-text">Short Break</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={60}
              value={shortBreak}
              onChange={(e) => setShortBreak(Number(e.target.value))}
              className="w-16 rounded-lg bg-cafe-sage-light px-2 py-1 text-center font-body text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-matcha/40"
            />
            <span className="text-xs text-cafe-text-light">min</span>
          </div>
        </label>

        <label className="flex items-center justify-between">
          <span className="font-body text-sm text-cafe-text">Long Break</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={60}
              value={longBreak}
              onChange={(e) => setLongBreak(Number(e.target.value))}
              className="w-16 rounded-lg bg-cafe-sage-light px-2 py-1 text-center font-body text-sm text-cafe-text focus:outline-none focus:ring-2 focus:ring-cafe-matcha/40"
            />
            <span className="text-xs text-cafe-text-light">min</span>
          </div>
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          className="cafe-button-shadow flex-1 rounded-lg bg-cafe-matcha px-3 py-1.5 font-body text-sm font-semibold text-white [--cafe-button-shadow-color:var(--color-cafe-sage-dark)] hover:bg-cafe-sage-dark"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="cafe-button-shadow flex-1 rounded-lg bg-cafe-pink px-3 py-1.5 font-body text-sm font-semibold text-cafe-text [--cafe-button-shadow-color:var(--color-cafe-pink-dark)] hover:bg-cafe-pink-dark hover:text-white"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
