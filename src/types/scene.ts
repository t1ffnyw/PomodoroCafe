export type LayerAnimation = "float" | "pulse" | "sprite" | "none";

export type DrinkLayer = {
  id: string;
  src: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  animation: LayerAnimation;
  spriteFrames?: number;
};

export type DrinkConfig = {
  id: string;
  name: string;
  layers: DrinkLayer[];
};

export type BackgroundConfig = {
  id: string;
  name: string;
  className: string;
};

export type SceneConfig = {
  background: BackgroundConfig;
  drink: DrinkConfig;
};
