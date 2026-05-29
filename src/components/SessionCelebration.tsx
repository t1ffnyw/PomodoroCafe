import { useEffect } from "react";
import { motion } from "framer-motion";
import type { TimerMode } from "@/types/timer";

type SessionCelebrationProps = {
  completedMode: TimerMode;
  drinkIcon: string;
  onDismiss: () => void;
};

const MESSAGES: Record<TimerMode, string> = {
  focus: "Focus complete! Time for a break.",
  break: "Break's over — ready to focus?",
  longBreak: "Long break complete. Fresh cup, fresh start!",
};

export function SessionCelebration({
  completedMode,
  drinkIcon,
  onDismiss,
}: SessionCelebrationProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-cafe-text/20 p-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="cafe-card flex max-w-sm flex-col items-center gap-4 px-8 py-8 text-center"
      >
        <img
          src={drinkIcon}
          alt=""
          className="h-16 w-16 object-contain pixelated"
          style={{ imageRendering: "pixelated" }}
        />
        <p className="font-display text-lg font-semibold text-cafe-text">
          {MESSAGES[completedMode]}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-pill btn--matcha"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
