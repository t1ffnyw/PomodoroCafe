import type { AppTheme, ThemeId } from "@/types/theme";
import { coffeeScene, matchaScene } from "./scenes";

export const themes: Record<ThemeId, AppTheme> = {
  matcha: {
    id: "matcha",
    label: "Matcha",
    scene: matchaScene,
  },
  coffee: {
    id: "coffee",
    label: "Coffee",
    scene: coffeeScene,
  },
};

export const allThemes: AppTheme[] = Object.values(themes);
