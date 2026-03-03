import { useEffect, useRef } from "react";

export function useGameLoop(callback, fps) {
  const lastTimeRef = useRef(0);

  useEffect(() => {
    let frameId;

    function loop(time) {
      if (time - lastTimeRef.current >= 1000 / fps) {
        callback();
        lastTimeRef.current = time;
      }
      frameId = requestAnimationFrame(loop);
    }

    frameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameId);
  }, [callback, fps]);
}