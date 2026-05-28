import type { SceneConfig } from "@/types/scene";

export type ThemeId = "matcha" | "coffee";

export type AppTheme = {
  id: ThemeId;
  label: string;
  scene: SceneConfig;
};
