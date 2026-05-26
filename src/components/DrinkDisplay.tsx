import { motion } from "framer-motion";
import type { DrinkConfig, DrinkLayer } from "@/types/scene";
import { useEffect, useState } from "react";

type DrinkDisplayProps = {
  drink: DrinkConfig;
  className?: string;
};

const floatAnimation = {
  y: [0, -6, 0],
  opacity: [0.6, 1, 0.6],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

const pulseAnimation = {
  scale: [1, 1.03, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

const matchaFrames = [
  "/assets/drinks/matcha/matcha-straw-1.png",
  "/assets/drinks/matcha/matcha-straw-2.png",
  "/assets/drinks/matcha/matcha-straw-3.png",
];

function getLayerAnimation(animation: DrinkLayer["animation"]) {
  switch (animation) {
    case "float":
      return floatAnimation;
    case "pulse":
      return pulseAnimation;
    default:
      return undefined;
  }
}

export function DrinkDisplay({ drink, className = "" }: DrinkDisplayProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    function playSequence() {
      setFrameIndex(0);

      window.setTimeout(() => setFrameIndex(1), 200);
      window.setTimeout(() => setFrameIndex(2), 400);
      window.setTimeout(() => setFrameIndex(1), 600);
      window.setTimeout(() => setFrameIndex(0), 800);
      window.setTimeout(() => setFrameIndex(1), 1000);
      window.setTimeout(() => setFrameIndex(2), 1200);
      window.setTimeout(() => setFrameIndex(1), 1400);
      window.setTimeout(() => setFrameIndex(0), 1600);
    }

    playSequence();

    const interval = window.setInterval(playSequence, 10000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {drink.layers.map((layer) => {
        const animate = getLayerAnimation(layer.animation);
        const src =
          layer.id === "matcha-full"
            ? (matchaFrames[frameIndex] ?? layer.src)
            : layer.src;

        return (
          <motion.img
            key={layer.id}
            src={src}
            alt={layer.id}
            className="absolute pixelated"
            style={{
              left: layer.position.x,
              top: layer.position.y,
              width: layer.size.width,
              height: layer.size.height,
              zIndex: layer.zIndex,
              imageRendering: "pixelated",
            }}
            animate={animate}
          />
        );
      })}
    </div>
  );
}
