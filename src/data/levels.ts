import { LevelConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Sunlit Shallows",
    subtitle: "Warm Waters",
    description: "Swim through safe, beautiful coral reefs. Perfect for learning how to drift and flap!",
    bgGradient: "from-sky-400 via-sky-500 to-blue-600",
    canvasBg: "#38bdf8", // Sky blue base
    accentColor: "sky",
    speed: 2.2,
    gapSize: 155,
    levelDuration: 1200, // Distance to cover
    gravity: 0.32,
    jumpForce: -5.5,
    hasCurrents: false,
    obstacleFrequency: 240, // Frames between spawn
    obstacleTypes: ['coral'],
    rewardFeedCount: 3
  },
  {
    id: 2,
    name: "Golden Coral Garden",
    subtitle: "Denser Reefs",
    description: "The sea life is getting crowded. Steer carefully around towering coral structures and rocky walls.",
    bgGradient: "from-sky-500 via-blue-500 to-blue-700",
    canvasBg: "#0ea5e9", // Sky-500
    accentColor: "indigo",
    speed: 2.6,
    gapSize: 140,
    levelDuration: 1400,
    gravity: 0.34,
    jumpForce: -5.8,
    hasCurrents: false,
    obstacleFrequency: 210,
    obstacleTypes: ['coral', 'rock'],
    rewardFeedCount: 2
  },
  {
    id: 3,
    name: "Bubbling Reef",
    subtitle: "Bobbing Jellyfish",
    description: "Bobbing jellyfish populate this section! Time your flaps to safely cross as they move up and down.",
    bgGradient: "from-cyan-500 via-blue-600 to-indigo-800",
    canvasBg: "#06b6d4", // Cyan-500
    accentColor: "cyan",
    speed: 3.0,
    gapSize: 130,
    levelDuration: 1600,
    gravity: 0.36,
    jumpForce: -6.0,
    hasCurrents: false,
    obstacleFrequency: 190,
    obstacleTypes: ['coral', 'jellyfish'],
    rewardFeedCount: 3
  },
  {
    id: 4,
    name: "Sunken Shipwreck",
    subtitle: "Tight Gaps",
    description: "Navigate the mossy cabin structures and metal support columns of a drowned pirate galleon.",
    bgGradient: "from-teal-500 via-blue-700 to-slate-900",
    canvasBg: "#14b8a6", // Teal-500
    accentColor: "teal",
    speed: 3.3,
    gapSize: 120,
    levelDuration: 1800,
    gravity: 0.37,
    jumpForce: -6.1,
    hasCurrents: false,
    obstacleFrequency: 175,
    obstacleTypes: ['rock', 'coral'],
    rewardFeedCount: 3
  },
  {
    id: 5,
    name: "Sandy Currents",
    subtitle: "Riding the Flow",
    description: "Warning: Ocean currents push and pull Rea up and down gently. Hold your balance!",
    bgGradient: "from-emerald-500 via-indigo-700 to-emerald-950",
    canvasBg: "#10b981", // Emerald-500
    accentColor: "emerald",
    speed: 3.5,
    gapSize: 120,
    levelDuration: 2000,
    gravity: 0.38,
    jumpForce: -6.2,
    hasCurrents: true, // Gentle wave offset applied to fish
    obstacleFrequency: 170,
    obstacleTypes: ['coral', 'jellyfish'],
    rewardFeedCount: 3
  },
  {
    id: 6,
    name: "Oceanic Trench",
    subtitle: "Glowing Mines",
    description: "Descend into the ink-blue trench where floating naval mines slowly sway in the deep tide.",
    bgGradient: "from-blue-800 via-indigo-900 to-slate-950",
    canvasBg: "#1e1b4b", // Deep indigo
    accentColor: "indigo",
    speed: 3.8,
    gapSize: 112,
    levelDuration: 2200,
    gravity: 0.40,
    jumpForce: -6.4,
    hasCurrents: false,
    obstacleFrequency: 160,
    obstacleTypes: ['mine', 'rock'],
    rewardFeedCount: 4
  },
  {
    id: 7,
    name: "Volcanic Vents",
    subtitle: "Thermal Eruptions",
    description: "Extreme heat creates active thermal vents. Use feed shields strategically in dense areas!",
    bgGradient: "from-indigo-950 via-slate-900 to-rose-950",
    canvasBg: "#0f172a", // Slate-900 with red orange accents
    accentColor: "rose",
    speed: 4.1,
    gapSize: 105,
    levelDuration: 2400,
    gravity: 0.42,
    jumpForce: -6.6,
    hasCurrents: true, // Stronger currents
    obstacleFrequency: 150,
    obstacleTypes: ['mine', 'jellyfish', 'rock'],
    rewardFeedCount: 4
  },
  {
    id: 8,
    name: "Deep Abyssal Plains",
    subtitle: "Rea's Ultimate Swim",
    description: "The absolute bottom of the sea! Narrow pathways, speedy flows, and complex obstacle walls.",
    bgGradient: "from-purple-950 via-indigo-950 to-neutral-950",
    canvasBg: "#050510", // Near black
    accentColor: "violet",
    speed: 4.3,
    gapSize: 98,
    levelDuration: 2600,
    gravity: 0.43,
    jumpForce: -6.8,
    hasCurrents: true,
    obstacleFrequency: 140,
    obstacleTypes: ['coral', 'rock', 'mine', 'jellyfish'],
    rewardFeedCount: 5
  }
];
