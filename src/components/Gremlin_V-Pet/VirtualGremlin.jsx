import { useEffect, useState } from "react";
import { createAnimationController } from "../../engine/AnimationController";
import { useGameLoop } from "../../hooks/useGameLoop";
import "./VirtualGremlin.css";

import SpriteSheet from "../../assets/sprites/idle.png";

export default function VirtualGremlin() {
  const [controller, setController] = useState(null);
  const [frame, setFrame] = useState(0);
  const [error, setError] = useState(null);

  // load animation data ONCE
  useEffect(() => {
    console.log("Loading sprite sheet:", SpriteSheet);
    
    createAnimationController({
      imageSrc: SpriteSheet,
      frameWidth: 350,
      frameHeight: 350,
      totalFrames: 340
    })
      .then((ctrl) => {
        console.log("Sprite sheet loaded successfully:", ctrl);
        setController(ctrl);
      })
      .catch((err) => {
        console.error("Failed to create animation controller:", err);
        setError(err.message);
      });
  }, []);

  useGameLoop(() => {
    if (controller) {
      setFrame(f => (f + 1) % controller.totalFrames);
    }
  }, 24);

  if (error) {
    return (
      <></>
    );
  }

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