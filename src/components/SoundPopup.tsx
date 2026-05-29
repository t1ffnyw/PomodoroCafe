import { useState } from "react";
import { motion } from "framer-motion";
import type { AppPreferences, AmbientSoundId } from "@/types/preferences";
import { AMBIENT_SOUND_LABELS } from "@/config/sounds";

type SoundPopupProps = {
  preferences: AppPreferences;
  onSave: (preferences: AppPreferences) => void;
  onClose: () => void;
};

const AMBIENT_OPTIONS: AmbientSoundId[] = ["none", "cafe", "typing", "lofi"];

export function SoundPopup({
  preferences,
  onSave,
  onClose,
}: SoundPopupProps) {
  const [chimeEnabled, setChimeEnabled] = useState(preferences.chimeEnabled);
  const [ambientSound, setAmbientSound] = useState(preferences.ambientSound);
  const [ambientVolume, setAmbientVolume] = useState(preferences.ambientVolume);

  function handleSave() {
    onSave({
      ...preferences,
      chimeEnabled,
      ambientSound,
      ambientVolume: Math.min(100, Math.max(0, ambientVolume)),
    });
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
        Sound
      </h3>

      <div className="flex flex-col gap-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={chimeEnabled}
            onChange={(e) => setChimeEnabled(e.target.checked)}
            className="h-4 w-4 accent-cafe-matcha"
          />
          <span className="font-body text-sm text-cafe-text">Session chime</span>
        </label>

        <div>
          <span className="mb-1.5 block font-body text-sm text-cafe-text">
            Ambient sound
          </span>
          <div className="flex flex-wrap gap-1.5">
            {AMBIENT_OPTIONS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setAmbientSound(id)}
                className={`btn btn-sm ${
                  ambientSound === id ? "btn--matcha" : "btn--cream"
                }`}
              >
                {AMBIENT_SOUND_LABELS[id]}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-body text-sm text-cafe-text">Ambient volume</span>
          <input
            type="range"
            min={0}
            max={100}
            value={ambientVolume}
            onChange={(e) => setAmbientVolume(Number(e.target.value))}
            className="accent-cafe-matcha"
            disabled={ambientSound === "none"}
          />
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
