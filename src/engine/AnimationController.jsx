import { useEffect } from "react";

export async function createAnimationController({
  imageSrc,
  frameWidth,
  frameHeight,
  totalFrames = null // OPTIONAL
}) {
  const image = new Image();
  image.src = imageSrc;

  await image.decode();

  const sheetWidth = image.width;
  const sheetHeight = image.height;

  const columns = Math.floor(sheetWidth / frameWidth);
  const rows = Math.floor(sheetHeight / frameHeight);

  // If totalFrames is not provided, assume full grid
  const maxFrames = totalFrames ?? columns * rows;

  function getFramePosition(frameIndex) {
    // clamp to valid range
    const index = frameIndex % maxFrames;

    const col = index % columns;
    const row = Math.floor(index / columns);

    return {
      x: -col * frameWidth,
      y: -row * frameHeight
    };
  }

  return {
    image,
    frameWidth,
    frameHeight,
    columns,
    rows,
    totalFrames: maxFrames,
    getFramePosition
  };
}