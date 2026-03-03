const states = {
  IDLE: {
    onUpdate: () => randomChance(0.01) && "WALK"
  },
  WALK: {
    onUpdate: pet => pet.moveRandom()
  },
  FOLLOW_CURSOR: {
    onUpdate: pet => pet.moveTo(cursor)
  }
};