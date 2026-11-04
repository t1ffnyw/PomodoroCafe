import type { TimerMode } from "@/types/timer";
import type { NotionSyncSettings } from "@/types/notion";
import { DEFAULT_NOTION_SYNC_SETTINGS } from "@/types/notion";

export type AmbientSoundId = "none" | "cafe" | "typing" | "lofi";

export type AppPreferences = {
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  chimeEnabled: boolean;
  ambientSound: AmbientSoundId;
  ambientVolume: number;
  notion: NotionSyncSettings;
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  autoStartBreaks: false,
  autoStartFocus: false,
  chimeEnabled: true,
  ambientSound: "none",
  ambientVolume: 50,
  notion: DEFAULT_NOTION_SYNC_SETTINGS,
};

export type SessionCompleteEvent = {
  completedMode: TimerMode;
  nextMode: TimerMode;
};
