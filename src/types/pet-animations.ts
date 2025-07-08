// Standard pet animation types
export type PetAnimationType = 
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'eat'
  | 'happy'
  | 'sad'
  | 'sleep'
  | 'play'
  | 'pet'; // being petted

export interface AnimationFrame {
  x: number; // x position in sprite sheet
  y: number; // y position in sprite sheet
  width: number;
  height: number;
  duration?: number; // optional frame-specific duration
}

export interface Animation {
  name: PetAnimationType;
  row: number; // which row in the sprite sheet
  frameCount: number;
  frameDuration: number; // default ms per frame
  loop: boolean;
  frames?: AnimationFrame[]; // optional for non-uniform frames
}

export interface SpriteSheetMetadata {
  // Image dimensions
  imageWidth: number;
  imageHeight: number;
  
  // Default frame size (can be overridden per animation)
  frameWidth: number;
  frameHeight: number;
  
  // Animation definitions
  animations: Record<PetAnimationType, Animation>;
  
  // Display settings
  scale: number; // How much to scale up (e.g., 2 for pixel art)
  pixelated: boolean; // Whether to use pixel-perfect rendering
}

// Example metadata for a standard pet sprite sheet
export const DEFAULT_SPRITE_METADATA: SpriteSheetMetadata = {
  imageWidth: 128, // 4 frames * 32px
  imageHeight: 256, // 8 animations * 32px
  frameWidth: 32,
  frameHeight: 32,
  scale: 2,
  pixelated: true,
  animations: {
    idle: {
      name: 'idle',
      row: 0,
      frameCount: 4,
      frameDuration: 200,
      loop: true
    },
    walk: {
      name: 'walk',
      row: 1,
      frameCount: 4,
      frameDuration: 150,
      loop: true
    },
    run: {
      name: 'run',
      row: 2,
      frameCount: 4,
      frameDuration: 100,
      loop: true
    },
    jump: {
      name: 'jump',
      row: 3,
      frameCount: 4,
      frameDuration: 150,
      loop: false
    },
    eat: {
      name: 'eat',
      row: 4,
      frameCount: 4,
      frameDuration: 200,
      loop: false
    },
    happy: {
      name: 'happy',
      row: 5,
      frameCount: 4,
      frameDuration: 150,
      loop: true
    },
    sad: {
      name: 'sad',
      row: 6,
      frameCount: 4,
      frameDuration: 250,
      loop: true
    },
    sleep: {
      name: 'sleep',
      row: 7,
      frameCount: 4,
      frameDuration: 400,
      loop: true
    },
    play: {
      name: 'play',
      row: 5, // reuse happy animation
      frameCount: 4,
      frameDuration: 150,
      loop: true
    },
    pet: {
      name: 'pet',
      row: 5, // reuse happy animation
      frameCount: 4,
      frameDuration: 150,
      loop: true
    }
  }
};

// Sprite sheet upload guidelines
export const SPRITE_UPLOAD_GUIDELINES = {
  format: 'PNG with transparency',
  layout: 'Horizontal frames, vertical animations',
  standardSize: '128x256px (4 frames × 8 animations × 32px each)',
  animations: [
    'Row 0: Idle (standing, breathing)',
    'Row 1: Walk (normal walking)',
    'Row 2: Run (fast movement)',
    'Row 3: Jump (jumping up)',
    'Row 4: Eat (eating/being fed)',
    'Row 5: Happy (excited, tail wagging)',
    'Row 6: Sad (lonely, drooping)',
    'Row 7: Sleep (resting, eyes closed)'
  ],
  notes: [
    'Each animation should have 4 frames',
    'Keep consistent frame dimensions',
    'Use transparent background',
    'Center pet in each frame'
  ]
};