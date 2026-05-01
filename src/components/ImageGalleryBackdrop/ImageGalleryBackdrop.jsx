'use client';

import './ImageGalleryBackdrop.css';
import { useState, useEffect } from 'react';

export default function ImageGalleryBackdrop() {
  const [images, setImages] = useState([]);
  const doubledImages = [...images, ...images];
  const [shadowColors, setShadowColors] = useState({});
  const [shadowStyles, setShadowStyles] = useState({});

  // Generate 40 placeholder images
  useEffect(() => {
    const generatedImages = Array.from({ length: 42 }, (_, i) => ({
      id: i,
      src: `/Clips-Gallery/Gallery-Image(${i + 1}).gif`,
      alt: `Gallery Image ${i + 1}`
    }));
    setImages(generatedImages);

    // Pre-generate random shadow colors for each image
    const colors = {};
    const shadows = {};
    generatedImages.forEach(img => {
      const randomColor = generateRandomShadowColor();
      colors[img.id] = randomColor;
      shadows[img.id] = generateShadowStyle(randomColor);
    });
    setShadowColors(colors);
    setShadowStyles(shadows);
  }, []);

  const generateRandomShadowColor = () => {
    const colors = [
      'rgba(244, 170, 200, 0.4)',
      'rgba(45, 186, 233, 0.4)',
      'rgba(214, 221, 244, 0.4)',
      'rgba(82, 119, 192, 0.4)',
      'rgba(138, 218, 245, 0.4)',
      'rgba(203, 215, 193, 0.4)',
      'rgba(91, 209, 250, 0.4)',
      'rgba(145, 156, 196, 0.4)',
      'rgba(188, 97, 129, 0.4)',
      'rgba(4, 140, 231, 0.4)',
      'rgba(255, 107, 107, 0.4)',
      'rgba(255, 179, 71, 0.4)',
      'rgba(129, 212, 250, 0.4)',
      'rgba(165, 142, 251, 0.4)',
      'rgba(244, 143, 177, 0.4)',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const generateShadowStyle = (colorBase) => {
    const baseColor = colorBase;
    const color30 = baseColor.replace('0.4', '0.3');
    const color20 = baseColor.replace('0.4', '0.2');
    const color10 = baseColor.replace('0.4', '0.1');
    const color05 = baseColor.replace('0.4', '0.05');

    return `5px 5px ${baseColor}, 10px 10px ${color30}, 15px 15px ${color20}, 20px 20px ${color10}, 25px 25px ${color05}`;
  };

  return (
    <div className="image-gallery-backdrop">
      <div className="gallery-scroll-container">
        <div className="grid image-grid">
        {doubledImages.map((image, index) => (
            <div key={`${image.id}-${index}`} className="grid-block">
            <div className="tile">
                <a
                className="tile-link"
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                    '--shadow-style': shadowStyles[image.id]
                }}
                >
                <img
                    className="tile-img"
                    src={image.src}
                    alt={image.alt}
                />
                </a>
            </div>
            </div>
        ))}
        </div>
      </div>
    </div>
  );
}
