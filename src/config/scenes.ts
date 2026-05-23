import type { BackgroundConfig, SceneConfig } from "@/types/scene";
import { matchaDrink } from "./drinks";

export const ginghamPinkBackground: BackgroundConfig = {
  id: "gingham-pink",
  name: "Pink Gingham",
  className: "bg-gingham",
};

export const defaultScene: SceneConfig = {
  background: ginghamPinkBackground,
  drink: matchaDrink,
};

export const allBackgrounds: BackgroundConfig[] = [ginghamPinkBackground];
