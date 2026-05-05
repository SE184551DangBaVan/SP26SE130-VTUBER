"use client";

import { useEffect, useRef, useState } from "react";
import { createAnimationController } from "../../engine/AnimationController";
import { createGremlinBrain } from "../../engine/GremlinBrain";
import { useGameLoop } from "../../hooks/useGameLoop";
import "./VirtualGremlin.css";


import SpriteSheetIdle from "../../assets/sprites/golduShippuIdle.png";
import SpriteSheetWalkLeft from "../../assets/sprites/golduShippuWalkLeft.png";
import SpriteSheetWalkRight from "../../assets/sprites/golduShippuWalkRight.png";
import SpriteSheetAction from "../../assets/sprites/golduShippuAction.png"; //25 totalFrames
import SpriteSheetIntro from "../../assets/sprites/golduShippuIntro.png"; //43 totalFrames

//Second Pet Test (frameWidth is 300, frameHeight is 300)
import SpriteSheetIdle2 from "../../assets/sprites/agnesTachyonIdle.png"; //340 totalFrames
import SpriteSheetWalkLeft2 from "../../assets/sprites/agnesTachyonWalkLeft.png"; //30 totalFrames
import SpriteSheetWalkRight2 from "../../assets/sprites/agnesTachyonWalkRight.png"; //30 totalFrames
import SpriteSheetAction2 from "../../assets/sprites/agnesTachyonAction.png"; //30 totalFrames
import SpriteSheetIntro2 from "../../assets/sprites/agnesTachyonIntro.png"; //50 totalFrames

const PETS = {
  golduShippu: {
    name: "Goldu Shippu",
    frameWidth: 350,
    frameHeight: 350,
    sprites: {
      idle: { src: SpriteSheetIdle.src, totalFrames: 340 },
      walkLeft: { src: SpriteSheetWalkLeft.src, totalFrames: 90 },
      walkRight: { src: SpriteSheetWalkRight.src, totalFrames: 90 },
      action: { src: SpriteSheetAction.src, totalFrames: 25 },
      intro: { src: SpriteSheetIntro.src, totalFrames: 43 }
    }
  },
  agnesTachyon: {
    name: "Agnes Tachyon",
    frameWidth: 300,
    frameHeight: 300,
    sprites: {
      idle: { src: SpriteSheetIdle2.src, totalFrames: 340 },
      walkLeft: { src: SpriteSheetWalkLeft2.src, totalFrames: 30 },
      walkRight: { src: SpriteSheetWalkRight2.src, totalFrames: 30 },
      action: { src: SpriteSheetAction2.src, totalFrames: 30 },
      intro: { src: SpriteSheetIntro2.src, totalFrames: 50 }
    }
  }
};

export default function VirtualGremlin({ selectedPet = 'golduShippu', alarms = [] }) {
  const containerRef = useRef(null);
  const brainRef = useRef(null);
  const [controllers, setControllers] = useState(null);
  const [spriteKey, setSpriteKey] = useState("idle");
  const [frame, setFrame] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  const [introPlayed, setIntroPlayed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAnimations() {
      try {
        const pet = PETS[selectedPet];
        if (!pet) throw new Error(`Pet ${selectedPet} not found`);

        const promises = Object.entries(pet.sprites).map(([key, { src, totalFrames }]) =>
          createAnimationController({
            imageSrc: src,
            frameWidth: pet.frameWidth,
            frameHeight: pet.frameHeight,
            totalFrames
          })
        );

        const [idleCtrl, walkLeftCtrl, walkRightCtrl, actionCtrl, introCtrl] = await Promise.all(promises);

        if (cancelled) return;

        setControllers({
          idle: idleCtrl,
          walkLeft: walkLeftCtrl,
          walkRight: walkRightCtrl,
          action: actionCtrl,
          intro: introCtrl
        });

        const introKey = `petIntroPlayed_${selectedPet}`;
        const hasPlayedIntro = sessionStorage.getItem(introKey) === 'true';
        setIntroPlayed(hasPlayedIntro);

        const rect = containerRef.current?.getBoundingClientRect();
        const boundsWidth = rect?.width || window.innerWidth;

        const brain = createGremlinBrain({
          initialX: Math.max(24, Math.floor(boundsWidth * 0.05)),
          width: pet.frameWidth,
          height: pet.frameHeight,
          boundsWidth: boundsWidth,
          introPlayed: hasPlayedIntro
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
  }, [selectedPet]);

  useEffect(() => {
    const updateBounds = () => {
      if (!brainRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      brainRef.current.boundsWidth = rect.width;
    };

    window.addEventListener("resize", updateBounds);
    updateBounds();

    return () => window.removeEventListener("resize", updateBounds);
  }, []);

  useEffect(() => {
    if (!alarms.length) return;

    const checkAlarms = () => {
      const now = new Date().toISOString();
      const triggered = alarms.some(alarm => now >= alarm);
      if (triggered && brainRef.current) {
        brainRef.current.triggerAction();
      }
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [alarms]);

  const handleClick = () => {
    if (brainRef.current) {
      brainRef.current.triggerAction();
    }
  };

  useGameLoop(() => {
    const brain = brainRef.current;
    if (!brain || !controllers) return;

    brain.update();
    const key = brain.getSpriteKey();
    const activeController = controllers[key];

    setSpriteKey(key);
    setFrame((previousFrame) => (previousFrame + 1) % activeController.totalFrames);
    setPosition({ x: Math.round(brain.x), y: Math.round(brain.y) });

    // Save intro played to sessionStorage
    if (brain.introPlayed && !introPlayed) {
      setIntroPlayed(true);
      sessionStorage.setItem(`petIntroPlayed_${selectedPet}`, 'true');
    }
  }, 24);

  if (!error) {
    return <div className="pet-error">V-Pet Disconnected</div>;
  }

  if (!controllers) return null;

  const activeController = controllers[spriteKey];
  const framePosition = activeController.getFramePosition(frame);
  const pet = PETS[selectedPet];

  return (
    <div className="pet-container" ref={containerRef}>
      <div
        className="pet"
        style={{
          left: `${position.x}px`,
          width: `${pet.frameWidth}px`,
          height: `${pet.frameHeight}px`,
          backgroundImage: `url(${activeController.image.src})`,
          backgroundPosition: `${framePosition.x}px ${framePosition.y}px`
        }}
        onClick={handleClick}
      />
    </div>
  );
}
