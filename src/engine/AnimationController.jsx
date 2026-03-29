export async function createAnimationController({
  imageSrc,
  frameWidth,
  frameHeight,
  totalFrames = null // OPTIONAL
}) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    
    image.onload = () => {
      try {
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

        resolve({
          image,
          frameWidth,
          frameHeight,
          columns,
          rows,
          totalFrames: maxFrames,
          getFramePosition
        });
      } catch (err) {
        reject(err);
      }
    };

    image.onerror = (err) => {
      console.error("Failed to load sprite sheet:", imageSrc);
      reject(new Error(`Failed to load image: ${imageSrc}`));
    };

    image.src = imageSrc;
  });
}