pet.x += pet.vx;
pet.y += pet.vy;

// Gravity-lite
pet.vy += 0.2;

// Screen bounds
pet.x = clamp(pet.x, 0, window.innerWidth - pet.width);