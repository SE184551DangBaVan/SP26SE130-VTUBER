import { useEffect, useState } from "react";
import { createAnimationController } from "../../engine/AnimationController";
import { useGameLoop } from "../../hooks/useGameLoop";
import "./VirtualGremlin.css";

import SpriteSheet from "../../assets/sprites/idle.png";

export default function VirtualGremlin() {
  const [controller, setController] = useState(null);
  const [frame, setFrame] = useState(0);

  // load animation data ONCE
  useEffect(() => {
    createAnimationController({
      imageSrc: SpriteSheet,
      frameWidth: 350,
      frameHeight: 350,
      totalFrames: 340 // ← IMPORTANT for rows with blank
    }).then(setController);
  }, []);

  useGameLoop(() => {
    if (controller) {
      setFrame(f => (f + 1) % controller.totalFrames);
    }
  }, 24);

  if (!controller) return null;

  const { x, y } = controller.getFramePosition(frame);

  return (
    <div
      className="pet"
      style={{
        backgroundImage: `url(${SpriteSheet})`,
        backgroundPosition: `${x}px ${y}px`
      }}
    />
  );
}