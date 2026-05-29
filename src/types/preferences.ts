import type { TimerMode } from "@/types/timer";

export type AmbientSoundId = "none" | "cafe" | "typing" | "lofi";

export type AppPreferences = {
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  chimeEnabled: boolean;
  ambientSound: AmbientSoundId;
  ambientVolume: number;
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  autoStartBreaks: false,
  autoStartFocus: false,
  chimeEnabled: true,
  ambientSound: "none",
  ambientVolume: 50,
};

export type SessionCompleteEvent = {
  completedMode: TimerMode;
  nextMode: TimerMode;
};
