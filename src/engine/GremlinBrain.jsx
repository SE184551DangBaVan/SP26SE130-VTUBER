const IDLE = "IDLE";
const WALK_LEFT = "WALK_LEFT";
const WALK_RIGHT = "WALK_RIGHT";
const INTRO = "INTRO";
const ACTION = "ACTION";

const SPRITE_KEYS = {
  [IDLE]: "idle",
  [WALK_LEFT]: "walkLeft",
  [WALK_RIGHT]: "walkRight",
  [INTRO]: "intro",
  [ACTION]: "action"
};

const WALK_DURATION_OPTIONS = [72, 120]; // 3 or 5 seconds for 24 FPS
const IDLE_DURATION_MIN = 24; // 1 second for 24 FPS
const IDLE_DURATION_MAX = 72; // 3 seconds for 24 FPS
const WALK_SPEED = 2.2;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chooseWalkState() {
  return Math.random() < 0.5 ? WALK_LEFT : WALK_RIGHT;
}

class GremlinBrain {
  constructor({ initialX = 0, width = 350, height = 350, boundsWidth = window.innerWidth, introPlayed = false }) {
    this.x = Math.max(0, initialX);
    this.width = width;
    this.height = height;
    this.boundsWidth = boundsWidth;
    this.introPlayed = introPlayed;
    this.state = introPlayed ? IDLE : INTRO;
    this.stateTimer = introPlayed ? randomInt(IDLE_DURATION_MIN, IDLE_DURATION_MAX) : 0; // Intro will set its own timer
    this.vx = 0;
  }

  setState(state, durationFrames) {
    this.state = state;
    this.stateTimer = durationFrames;
    this.vx = (state === WALK_LEFT ? -WALK_SPEED : state === WALK_RIGHT ? WALK_SPEED : 0);
  }

  triggerAction() {
    if (this.state !== ACTION) {
      this.setState(ACTION, 30); // Assuming 30 frames for action, adjust as needed
    }
  }

  update() {
    if (this.stateTimer <= 0) {
      this.transitionState();
    }

    if (this.state !== IDLE && this.state !== INTRO && this.state !== ACTION) {
      this.x += this.vx;
      this.keepInBounds();
    }

    if (this.stateTimer > 0) {
      this.stateTimer -= 1;
    }
  }

  transitionState() {
    if (this.state === INTRO) {
      this.introPlayed = true;
      this.setState(IDLE, randomInt(IDLE_DURATION_MIN, IDLE_DURATION_MAX));
    } else if (this.state === ACTION) {
      this.setState(IDLE, randomInt(IDLE_DURATION_MIN, IDLE_DURATION_MAX));
    } else if (this.state === IDLE) {
      const shouldWalk = Math.random() < 0.8;
      if (shouldWalk) {
        this.setState(chooseWalkState(), randomInt(...WALK_DURATION_OPTIONS));
      } else {
        this.setState(IDLE, randomInt(IDLE_DURATION_MIN, IDLE_DURATION_MAX));
      }
    } else {
      this.setState(IDLE, randomInt(IDLE_DURATION_MIN, IDLE_DURATION_MAX));
    }
  }

  keepInBounds() {
    const maxX = this.boundsWidth - this.width;
    if (this.x <= 0) {
      this.x = 0;
      this.vx *= -0.6;
      this.setState(WALK_RIGHT, randomInt(...WALK_DURATION_OPTIONS));
    } else if (this.x >= maxX) {
      this.x = maxX;
      this.vx *= -0.6;
      this.setState(WALK_LEFT, randomInt(...WALK_DURATION_OPTIONS));
    }
  }

  getSpriteKey() {
    return SPRITE_KEYS[this.state] || SPRITE_KEYS[IDLE];
  }
}

export function createGremlinBrain({ initialX = 0, width = 350, height = 350, boundsWidth = window.innerWidth, introPlayed = false } = {}) {
  return new GremlinBrain({ initialX, width, height, boundsWidth, introPlayed });
}
