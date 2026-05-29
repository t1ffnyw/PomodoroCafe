import { useEffect, useRef } from "react";
import type { AppPreferences } from "@/types/preferences";
import { AMBIENT_SOUND_PATHS } from "@/config/sounds";

export function useAmbientSound(preferences: AppPreferences) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const { ambientSound, ambientVolume } = preferences;

    if (ambientSound === "none") {
      audioRef.current?.pause();
      return;
    }

    const src = AMBIENT_SOUND_PATHS[ambientSound];
    const volume = Math.min(1, Math.max(0, ambientVolume / 100));

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.loop = true;
    } else if (!audioRef.current.src.endsWith(src)) {
      audioRef.current.src = src;
    }

    audioRef.current.volume = volume;
    void audioRef.current.play().catch(() => {
      /* autoplay blocked until user interaction */
    });
  }, [preferences.ambientSound, preferences.ambientVolume]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);
}
