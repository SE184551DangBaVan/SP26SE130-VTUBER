import { useState, useEffect } from 'react';

import SpriteSheetIdle from "../../assets/sprites/golduShippuIdle.png";
import SpriteSheetIdle2 from "../../assets/sprites/agnesTachyonIdle.png";

const PETS = {
  golduShippu: {
    name: "Goldu Shippu",
    frameWidth: 350,
    frameHeight: 350,
    thumbnail: SpriteSheetIdle.src
  },
  agnesTachyon: {
    name: "Agnes Tachyon",
    frameWidth: 300,
    frameHeight: 300,
    thumbnail: SpriteSheetIdle2.src
  }
};

export default function PetSelectionList() {
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    const savedPet = localStorage.getItem('selectedPet');
    if (savedPet && PETS[savedPet]) {
      setSelectedPet(savedPet);
    }
  }, []);

  const selectPet = (petKey) => {
    setSelectedPet(petKey);
    localStorage.setItem('selectedPet', petKey);
    // Trigger re-render of UserLayout
    window.dispatchEvent(new Event('storage'));
  };

  const deselectPet = () => {
    setSelectedPet(null);
    localStorage.removeItem('selectedPet');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="pet-selection-list" >
      <h3>Select Your Virtual Pet</h3>
      <div className="pet-thumbnails">
        {Object.entries(PETS).map(([key, pet]) => (
          <div key={key} className="pet-thumbnail" onClick={() => selectPet(key)}>
            <img
              src={pet.thumbnail}
              alt={pet.name}
              style={{
                width: `${pet.frameWidth * 0.2}px`,
                height: `${pet.frameHeight * 0.2}px`,
                objectFit: 'none',
                objectPosition: '0 0'
              }}
            />
            <p>{pet.name}</p>
          </div>
        ))}
      </div>
      {selectedPet && (
        <button onClick={deselectPet}>Deselect Pet</button>
      )}
    </div>
  );
}