import type { AppTheme, ThemeId } from "@/types/theme";
import { coffeeScene, matchaScene } from "./scenes";

export const themes: Record<ThemeId, AppTheme> = {
  matcha: {
    id: "matcha",
    label: "Matcha",
    scene: matchaScene,
    cycleIcon: "/assets/drinks/matcha/mini-matcha.png",
  },
  coffee: {
    id: "coffee",
    label: "Coffee",
    scene: coffeeScene,
    cycleIcon: "/assets/drinks/coffee/mini-coffee.png",
  },
};

export const allThemes: AppTheme[] = Object.values(themes);
