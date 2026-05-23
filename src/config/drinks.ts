import type { DrinkConfig } from "@/types/scene";

export const matchaDrink: DrinkConfig = {
  id: "matcha",
  name: "Matcha Latte",
  layers: [
    {
      id: "coaster",
      src: "/assets/drinks/matcha/coaster.png",
      position: { x: 0, y: 80 },
      size: { width: 120, height: 30 },
      zIndex: 0,
      animation: "none",
    },
    {
      id: "cup",
      src: "/assets/drinks/matcha/cup.png",
      position: { x: 10, y: 0 },
      size: { width: 100, height: 100 },
      zIndex: 1,
      animation: "none",
    },
    {
      id: "liquid",
      src: "/assets/drinks/matcha/liquid.png",
      position: { x: 18, y: 20 },
      size: { width: 84, height: 60 },
      zIndex: 2,
      animation: "none",
    },
    {
      id: "foam",
      src: "/assets/drinks/matcha/foam.png",
      position: { x: 14, y: 10 },
      size: { width: 92, height: 24 },
      zIndex: 3,
      animation: "none",
    },
    {
      id: "steam",
      src: "/assets/drinks/matcha/steam.png",
      position: { x: 30, y: -30 },
      size: { width: 60, height: 40 },
      zIndex: 4,
      animation: "float",
    },
  ],
};

export const allDrinks: DrinkConfig[] = [matchaDrink];
