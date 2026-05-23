import type { DrinkConfig } from "@/types/scene";

export const matchaDrink: DrinkConfig = {
  id: "matcha",
  name: "Matcha Latte",
  layers: [
    {
      id: "matcha-full",
      src: "/assets/drinks/matcha/matcha.png",
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      zIndex: 0,
      animation: "none",
    },
  ],
};

export const allDrinks: DrinkConfig[] = [matchaDrink];
