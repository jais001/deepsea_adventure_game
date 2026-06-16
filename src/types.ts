export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelsuccess' | 'victory';

export type ObstacleType = 'coral' | 'rock' | 'mine' | 'jellyfish';

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  bgGradient: string; // Tailwind class
  canvasBg: string;     // Color code for canvas background
  accentColor: string;  // Hex or Tailwind class
  speed: number;
  gapSize: number;      // Size of the gap to swim through
  levelDuration: number; // Duration of level in distance units (e.g. 1500)
  gravity: number;
  jumpForce: number;
  hasCurrents: boolean; // Gentle vertical flow pushing up and down
  obstacleFrequency: number; // Spawn rate factor (lower = more frequent)
  obstacleTypes: ObstacleType[];
  rewardFeedCount: number; // Starting feeds provided
}

export interface Obstacle {
  id: number;
  x: number;
  width: number;
  gapY: number;      // Y position of the middle of the gap
  gapHeight: number;  // Height of the gap
  type: ObstacleType;
  passed: boolean;
  
  // For moving obstacles (jellyfish or floating mines)
  speedY?: number;
  rangeY?: number;
  initialY?: number;
  currentYOffset?: number;
  direction?: number; 
}

export interface FoodPellet {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  pulsePhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  decay: number;
}

export interface Bubble {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  driftSpeed: number;
  driftPhase: number;
}

export interface FishState {
  y: number;
  vy: number;
  angle: number;
  radius: number;
  lives: number;
  feedsCollected: number;
  isShielded: boolean;
  shieldTimeRemaining: number; // in seconds
  invulnerableTimeRemaining: number; // after taking hit, in seconds
}

export interface PlayHistory {
  levelId: number;
  stars: number;
  highScore: number;
  completed: boolean;
}
