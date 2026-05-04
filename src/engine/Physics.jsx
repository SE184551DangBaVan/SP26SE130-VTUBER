export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function applyHorizontalBounds(pet, width = window.innerWidth) {
  pet.x = clamp(pet.x, 0, width - pet.width);
}

export function createPhysicsState({ x = 0, y = 0, width = 350, height = 350 }) {
  return { x, y, vx: 0, vy: 0, width, height };
}
