// SettingsPopup component to edit timer settings 
// focus, short break, long break, cycles before long break

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
  const [cycles, setCycles] = useState(config.cyclesBeforeLongBreak);

  function handleSave() {
    onSave({
      focusMinutes: Math.max(1, focus),
      breakMinutes: Math.max(1, shortBreak),
      longBreakMinutes: Math.max(1, longBreak),
      cyclesBeforeLongBreak: Math.max(1, cycles),
    });
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="popup"
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
              className="input-number"
            />
            <span className="text-muted-xs">min</span>
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
              className="input-number"
            />
            <span className="text-muted-xs">min</span>
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
              className="input-number"
            />
            <span className="text-muted-xs">min</span>
          </div>
        </label>

        <label className="flex items-center justify-between">
          <span className="font-body text-sm text-cafe-text">Cycles</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={8}
              value={cycles}
              onChange={(e) => setCycles(Number(e.target.value))}
              className="input-number"
            />
            <span className="text-muted-xs">set</span>
          </div>
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          className="btn btn-sm btn--matcha flex-1"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="btn btn-sm btn--pink-contrast flex-1"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
