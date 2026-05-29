import { useCallback, useRef } from "react";
import { SOUND_PATHS } from "@/config/sounds";

export function useChime() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playChime = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(SOUND_PATHS.chime);
      }
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } catch {
      /* autoplay blocked or missing file */
    }
  }, []);

  return { playChime };
}
