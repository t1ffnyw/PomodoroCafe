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
      spriteFrames: [
        "/assets/drinks/matcha/matcha-straw-1.png",
        "/assets/drinks/matcha/matcha-straw-2.png",
        "/assets/drinks/matcha/matcha-straw-3.png",
      ],
    },
  ],
};

export const coffeeDrink: DrinkConfig = {
  id: "coffee",
  name: "Coffee",
  layers: [
    {
      id: "coffee-full",
      src: "/assets/drinks/coffee/coffee-steam-1.png",
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      zIndex: 0,
      animation: "none",
      spriteFrames: [
        "/assets/drinks/coffee/coffee-steam-1.png",
        "/assets/drinks/coffee/coffee-steam-2.png",
      ],
    },
  ],
};

export const allDrinks: DrinkConfig[] = [matchaDrink, coffeeDrink];
