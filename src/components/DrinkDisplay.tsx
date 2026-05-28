// DrinkDisplay component to display the drink

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

function scheduleFrameSequence(
  frameCount: number,
  setFrameIndex: (index: number) => void,
): () => void {
  const timeouts: number[] = [];

  if (frameCount === 3) {
    const sequence = [0, 1, 2, 1, 0, 1, 2, 1, 0];
    sequence.forEach((frame, i) => {
      timeouts.push(window.setTimeout(() => setFrameIndex(frame), i * 200));
    });
  } else if (frameCount === 2) {
    const sequence = [0, 1, 0, 1, 0, 1, 0];
    sequence.forEach((frame, i) => {
      timeouts.push(window.setTimeout(() => setFrameIndex(frame), i * 300));
    });
  }

  return () => timeouts.forEach((id) => window.clearTimeout(id));
}

export function DrinkDisplay({ drink, className = "" }: DrinkDisplayProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  const animatedLayer = drink.layers.find(
    (layer) => (layer.spriteFrames?.length ?? 0) > 0,
  );
  const spriteFrames = animatedLayer?.spriteFrames;

  useEffect(() => {
    if (!spriteFrames?.length) return;

    const frameCount = spriteFrames.length;

    function playSequence() {
      setFrameIndex(0);
      return scheduleFrameSequence(frameCount, setFrameIndex);
    }

    let clearSequence = playSequence();
    const interval = window.setInterval(() => {
      clearSequence();
      clearSequence = playSequence();
    }, 10000);

    return () => {
      clearSequence();
      window.clearInterval(interval);
    };
  }, [drink.id, spriteFrames?.length]);

  return (
    <div className={`relative ${className}`}>
      {drink.layers.map((layer) => {
        const animate = getLayerAnimation(layer.animation);
        const frames = layer.spriteFrames;
        const src =
          frames?.length
            ? (frames[frameIndex] ?? layer.src)
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
