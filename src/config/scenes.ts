import type { BackgroundConfig, SceneConfig } from "@/types/scene";
import { coffeeDrink, matchaDrink } from "./drinks";

export const ginghamPinkBackground: BackgroundConfig = {
  id: "gingham-pink",
  name: "Pink Gingham",
  className: "bg-gingham",
};

export const ginghamCoffeeBackground: BackgroundConfig = {
  id: "gingham-coffee",
  name: "Coffee Gingham",
  className: "bg-gingham-coffee",
};

export const matchaScene: SceneConfig = {
  background: ginghamPinkBackground,
  drink: matchaDrink,
};

export const coffeeScene: SceneConfig = {
  background: ginghamCoffeeBackground,
  drink: coffeeDrink,
};

/** @deprecated Use themes config instead */
export const defaultScene: SceneConfig = matchaScene;

export const allBackgrounds: BackgroundConfig[] = [
  ginghamPinkBackground,
  ginghamCoffeeBackground,
];
