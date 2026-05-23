import { motion } from "framer-motion";
import type { DrinkConfig, DrinkLayer } from "@/types/scene";

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
  return (
    <div className={`relative ${className}`}>
      {drink.layers.map((layer) => {
        const animate = getLayerAnimation(layer.animation);

        return (
          <motion.img
            key={layer.id}
            src={layer.src}
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
