import type { AmbientSoundId } from "@/types/preferences";

/** User-supplied files under public/assets/sounds/ */
export const SOUND_PATHS = {
  chime: "/assets/sounds/chime.mp3",
  cafe: "/assets/sounds/ambient-cafe.mp3",
  typing: "/assets/sounds/ambient-typing.mp3",
  lofi: "/assets/sounds/ambient-lofi.mp3",
} as const;

export const AMBIENT_SOUND_PATHS: Record<
  Exclude<AmbientSoundId, "none">,
  string
> = {
  cafe: SOUND_PATHS.cafe,
  typing: SOUND_PATHS.typing,
  lofi: SOUND_PATHS.lofi,
};

export const AMBIENT_SOUND_LABELS: Record<AmbientSoundId, string> = {
  none: "None",
  cafe: "Café",
  typing: "Typing",
  lofi: "Lo-fi",
};
