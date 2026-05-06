"use client";

import { useEffect, useRef, useState } from "react";
import { createAnimationController } from "../../engine/AnimationController";
import { createGremlinBrain } from "../../engine/GremlinBrain";
import { useGameLoop } from "../../hooks/useGameLoop";
import "./VirtualGremlin.css";

import SpriteSheetIdle from "../../assets/sprites/golduShippuIdle.png";
import SpriteSheetWalkLeft from "../../assets/sprites/golduShippuWalkLeft.png";
import SpriteSheetWalkRight from "../../assets/sprites/golduShippuWalkRight.png";
import SpriteSheetAction from "../../assets/sprites/golduShippuAction.png";
import SpriteSheetIntro from "../../assets/sprites/golduShippuIntro.png";
import SpriteSheetGrab from "../../assets/sprites/golduShippuGrab.png";

import SpriteSheetIdle2 from "../../assets/sprites/agnesTachyonIdle.png";
import SpriteSheetWalkLeft2 from "../../assets/sprites/agnesTachyonWalkLeft.png";
import SpriteSheetWalkRight2 from "../../assets/sprites/agnesTachyonWalkRight.png";
import SpriteSheetAction2 from "../../assets/sprites/agnesTachyonAction.png";
import SpriteSheetIntro2 from "../../assets/sprites/agnesTachyonIntro.png";
import SpriteSheetGrab2 from "../../assets/sprites/agnesTachyonGrab.png";

const SCALE = 0.4;
const GRAVITY = 1.8;
const MAX_DROP_SPEED = 80;

const LOCAL_PETS = {
  golduShippu: {
    name: "Gold Ship",
    frameWidth: 350,
    frameHeight: 350,
    sprites: {
      idle: { src: SpriteSheetIdle.src, totalFrames: 340 },
      walkLeft: { src: SpriteSheetWalkLeft.src, totalFrames: 90 },
      walkRight: { src: SpriteSheetWalkRight.src, totalFrames: 90 },
      action: { src: SpriteSheetAction.src, totalFrames: 25 },
      intro: { src: SpriteSheetIntro.src, totalFrames: 43 },
      grab: { src: SpriteSheetGrab.src, totalFrames: 60 }
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
      intro: { src: SpriteSheetIntro2.src, totalFrames: 50 },
      grab: { src: SpriteSheetGrab2.src, totalFrames: 50 }
    }
  }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getModelSource = (selectedPet) => {
  if (selectedPet && typeof selectedPet === "object") return selectedPet;
  if (typeof selectedPet === "string") return LOCAL_PETS[selectedPet];
  return null;
};

const getFrameSize = (model) => {
  if (!model) return { frameWidth: 300, frameHeight: 300 };
  const frameWidth = model.frameWidth || (model.name === "Gold Ship" ? 350 : 300);
  const frameHeight = model.frameHeight || (model.name === "Gold Ship" ? 350 : 300);
  return { frameWidth, frameHeight };
};

const getScaledSize = (model) => {
  const { frameWidth, frameHeight } = getFrameSize(model);
  return {
    width: Math.round(frameWidth * SCALE),
    height: Math.round(frameHeight * SCALE)
  };
};

export default function VirtualGremlin({ selectedPet = 'golduShippu', alarms = [] }) {
  const containerRef = useRef(null);
  const petRef = useRef(null);
  const brainRef = useRef(null);
  const containerRectRef = useRef(null);
  const dragRef = useRef({
    pointerDown: false,
    startX: 0,
    startY: 0,
    pointerOffsetX: 0,
    pointerOffsetY: 0,
    rootX: 0,
    rootY: 0
  });
  const afterDropActionRef = useRef(false);

  const [controllers, setControllers] = useState(null);
  const [spriteKey, setSpriteKey] = useState("idle");
  const [frame, setFrame] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [dropVelocity, setDropVelocity] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAnimations() {
      try {
        const model = getModelSource(selectedPet);
        if (!model) throw new Error(`Pet model not found for ${selectedPet}`);

        const { frameWidth, frameHeight } = getFrameSize(model);
        const sprites = model.sprites || {};
        const spriteEntries = Object.entries(sprites);

        const controllersArray = await Promise.all(spriteEntries.map(([_, sprite]) =>
          createAnimationController({
            imageSrc: sprite.src || sprite.url,
            frameWidth,
            frameHeight,
            totalFrames: sprite.totalFrames
          })
        ));

        if (cancelled) return;

        const controllerMap = Object.fromEntries(spriteEntries.map(([key], index) => [key, controllersArray[index]]));
        setControllers(controllerMap);

        const introKey = `petIntroPlayed_${model.name || selectedPet}`;
        const hasPlayedIntro = sessionStorage.getItem(introKey) === 'true';
        setIntroPlayed(hasPlayedIntro);

        const rect = containerRef.current?.getBoundingClientRect();
        containerRectRef.current = rect || {
          width: window.innerWidth,
          height: (window.innerHeight - 200),
          left: 0,
          top: 0,
          bottom: window.innerHeight
        };

        const boundsWidth = rect?.width || window.innerWidth;
        const boundsHeight = rect?.height || window.innerHeight;
        const floorTop = Math.max(0, boundsHeight - Math.round(frameHeight * SCALE));

        const brain = createGremlinBrain({
          initialX: Math.max(24, Math.floor(boundsWidth * 0.05)),
          width: Math.round(frameWidth * SCALE),
          height: Math.round(frameHeight * SCALE),
          boundsWidth,
          introPlayed: hasPlayedIntro
        });

        brainRef.current = brain;
        setPosition({ x: Math.round(brain.x), y: floorTop });
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
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      containerRectRef.current = rect;
      if (brainRef.current) {
        brainRef.current.boundsWidth = rect.width;
      }
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

  const handlePointerDown = (event) => {
    if (event.button !== 0 || !petRef.current || !containerRectRef.current) return;

    dragRef.current.pointerDown = true;
    dragRef.current.startX = event.clientX;
    dragRef.current.startY = event.clientY;
    dragRef.current.initialX = position.x;
    dragRef.current.initialY = position.y;

    if (!isDragging && brainRef.current) {
      brainRef.current.setState("GRAB", Infinity);
      setSpriteKey("grab");
    }

    setIsDropping(false);
    setDropVelocity(0);
  };

  const handleClick = () => {
    if (isDragging || isDropping) return;
    if (brainRef.current) {
      brainRef.current.triggerAction();
    }
  };

  useEffect(() => {
    const handleMove = (event) => {
      if (!dragRef.current.pointerDown || !containerRectRef.current) return;

      const rect = containerRectRef.current;
      const distance = Math.hypot(event.clientX - dragRef.current.startX, event.clientY - dragRef.current.startY);
      const model = getModelSource(selectedPet);
      const scaled = getScaledSize(model);
      const maxX = Math.max(0, rect.width - scaled.width);
      const maxY = Math.max(0, rect.height - scaled.height);

      if (!isDragging && distance >= 6) {
        setIsDragging(true);
      }

      if (!isDragging) return;

      const deltaX = event.clientX - dragRef.current.startX;
      const deltaY = event.clientY - dragRef.current.startY;
      const nextX = clamp(dragRef.current.initialX + deltaX, 0, maxX);
      const nextY = clamp(dragRef.current.initialY + deltaY, 0, maxY);

      dragRef.current.rootX = nextX;
      dragRef.current.rootY = nextY;
      setPosition({ x: nextX, y: nextY });
      setIsDropping(false);
      setDropVelocity(0);
    };

    const handleUp = () => {
      if (!dragRef.current.pointerDown) return;
      dragRef.current.pointerDown = false;

      if (isDragging) {
        setIsDragging(false);
        setIsDropping(true);
        setDropVelocity(0);
        const rootX = typeof dragRef.current.rootX === 'number' ? dragRef.current.rootX : position.x;
        setPosition((prev) => ({ ...prev, x: rootX }));
        if (brainRef.current) {
          brainRef.current.x = rootX;
        }
        afterDropActionRef.current = true;
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, selectedPet]);

  useGameLoop(() => {
    if (!controllers) return;
    const model = getModelSource(selectedPet);
    const scaled = getScaledSize(model);
    const floorTop = Math.max(0, (containerRectRef.current?.height || window.innerHeight) - scaled.height);

    if (isDragging) {
      const activeKey = controllers.grab ? 'grab' : 'action';
      const activeController = controllers[activeKey] || controllers.idle;
      setSpriteKey(activeKey);
      setFrame((prev) => (prev + 1) % activeController.totalFrames);
      return;
    }

    if (isDropping) {
      const nextVelocity = Math.min(dropVelocity + GRAVITY, MAX_DROP_SPEED);
      const nextY = Math.min(floorTop, position.y + nextVelocity);
      setDropVelocity(nextVelocity);
      setPosition((prev) => ({ ...prev, y: nextY }));

      if (nextY >= floorTop) {
        setIsDropping(false);
        setDropVelocity(0);
        if (afterDropActionRef.current && brainRef.current) {
          brainRef.current.setState("ACTION", 30);
          afterDropActionRef.current = false;
        }
      }

      const activeKey = controllers.grab ? 'grab' : 'action';
      const activeController = controllers[activeKey] || controllers.idle;
      setSpriteKey(activeKey);
      setFrame((prev) => (prev + 1) % activeController.totalFrames);
      return;
    }

    const brain = brainRef.current;
    if (!brain) return;

    brain.update();
    const key = brain.getSpriteKey();
    const activeController = controllers[key] || controllers.idle;
    setSpriteKey(key);
    setFrame((prev) => (prev + 1) % activeController.totalFrames);
    setPosition((prev) => ({ ...prev, x: Math.round(brain.x), y: floorTop }));

    if (brain.introPlayed && !introPlayed) {
      setIntroPlayed(true);
      sessionStorage.setItem(`petIntroPlayed_${selectedPet}`, 'true');
    }
  }, 24);

  if (error) {
    return <div className="pet-error">V-Pet Disconnected</div>;
  }

  if (!controllers) return null;

  const activeController = controllers[spriteKey] || controllers.idle;
  const framePosition = activeController.getFramePosition(frame);
  const model = getModelSource(selectedPet);
  const frameSize = getFrameSize(model);

  return (
    <div className="pet-container" ref={containerRef}>
      <div
        ref={petRef}
        className="pet"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${frameSize.frameWidth}px`,
          height: `${frameSize.frameHeight}px`,
          backgroundImage: `url(${activeController.image.src})`,
          backgroundPosition: `${framePosition.x}px ${framePosition.y}px`,
          transform: `translate3d(0, 0, 0) scale(${SCALE})`
        }}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
      />
    </div>
  );
}
