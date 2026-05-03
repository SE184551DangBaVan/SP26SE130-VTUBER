"use client";

import { useEffect, useRef, useState } from "react";
import { createAnimationController } from "../../engine/AnimationController";
import { createGremlinBrain } from "../../engine/GremlinBrain";
import { useGameLoop } from "../../hooks/useGameLoop";
import "./VirtualGremlin.css";

import SpriteSheetIdle from "../../assets/sprites/idle.png";
import SpriteSheetWalkLeft from "../../assets/sprites/walkLeft.png";
import SpriteSheetWalkRight from "../../assets/sprites/walkRight.png";

export default function VirtualGremlin() {
  const brainRef = useRef(null);
  const [controllers, setControllers] = useState(null);
  const [spriteKey, setSpriteKey] = useState("idle");
  const [frame, setFrame] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnimations() {
      try {
        const [idleCtrl, walkLeftCtrl, walkRightCtrl] = await Promise.all([
          createAnimationController({
            imageSrc: SpriteSheetIdle.src,
            frameWidth: 350,
            frameHeight: 350,
            totalFrames: 340
          }),
          createAnimationController({
            imageSrc: SpriteSheetWalkLeft.src,
            frameWidth: 350,
            frameHeight: 350,
            totalFrames: 90
          }),
          createAnimationController({
            imageSrc: SpriteSheetWalkRight.src,
            frameWidth: 350,
            frameHeight: 350,
            totalFrames: 90
          })
        ]);

        if (cancelled) return;

        setControllers({
          idle: idleCtrl,
          walkLeft: walkLeftCtrl,
          walkRight: walkRightCtrl
        });

        const brain = createGremlinBrain({
          initialX: Math.max(24, Math.floor(window.innerWidth * 0.05)),
          width: 350,
          height: 350
        });

        brainRef.current = brain;
        setPosition({ x: Math.round(brain.x), y: Math.round(brain.y) });
        setSpriteKey(brain.getSpriteKey());
      } catch (err) {
        console.error("Failed to initialize virtual gremlin:", err);
        setError(err?.message || "Unable to load gremlin animations.");
      }
    }

    loadAnimations();

    return () => {
      cancelled = true;
    };
  }, []);

  useGameLoop(() => {
    const brain = brainRef.current;
    if (!brain || !controllers) return;

    brain.update();
    const key = brain.getSpriteKey();
    const activeController = controllers[key];

    setSpriteKey(key);
    setFrame((previousFrame) => (previousFrame + 1) % activeController.totalFrames);
    setPosition({ x: Math.round(brain.x), y: Math.round(brain.y) });
  }, 24);

  if (error) {
    return <div className="pet-error">Gremlin failed to load: {error}</div>;
  }

  if (!controllers) return null;

  const activeController = controllers[spriteKey];
  const framePosition = activeController.getFramePosition(frame);

  return (
    <div
      className="pet"
      style={{
        left: `${position.x}px`,
        backgroundImage: `url(${activeController.image.src})`,
        backgroundPosition: `${framePosition.x}px ${framePosition.y}px`
      }}
    />
  );
}
