import React, { useEffect, useRef, useState } from 'react';
import { GameState, LevelConfig, Obstacle, FoodPellet, Particle, Bubble, FishState } from '../types';
import { Heart, Volume2, VolumeX, Pause, Play, RotateCcw, ChevronLeft, Shield, Sparkles, MessageSquareDot, Flame } from 'lucide-react';

interface GameCanvasProps {
  level: LevelConfig;
  onBack: () => void;
  onSuccess: (finalScore: number) => void;
  onGameOver: () => void;
  onFailRestart: () => void;
}

export default function GameCanvas({ level, onBack, onSuccess, onGameOver, onFailRestart }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('rea_sound_enabled') !== 'false';
  });

  // Game state (React-controlled for overlays)
  const [canvasState, setCanvasState] = useState<GameState>('playing');
  const [hudLives, setHudLives] = useState<number>(3);
  const [hudFeeds, setHudFeeds] = useState<number>(level.rewardFeedCount);
  const [hudScore, setHudScore] = useState<number>(0);
  const [hudProgress, setHudProgress] = useState<number>(0);
  const [shieldTimeLeft, setShieldTimeLeft] = useState<number>(0);
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const [showCurrentIndicator, setShowCurrentIndicator] = useState<boolean>(level.hasCurrents);

  // References for the fast game loop (prevents React lag)
  const gameLoopRef = useRef<number | null>(null);
  const stateRef = useRef<{
    gameState: GameState;
    distance: number;
    score: number;
    frame: number;
    lastSpawnX: number;
    lastFoodSpawnX: number;
    
    // Fish state
    fishY: number;
    fishVy: number;
    fishAngle: number;
    lives: number;
    feedStock: number;
    
    // Power-up states
    shieldTimer: number; // in frames
    invulnerabilityTimer: number; // in frames
    
    // Dynamic collections
    obstacles: Obstacle[];
    foodPellets: FoodPellet[];
    particles: Particle[];
    bubbles: Bubble[];
    
    // Current force tracking (sine wave)
    currentPhase: number;
    currentOffset: number;
  }>({
    gameState: 'playing',
    distance: 0,
    score: 0,
    frame: 0,
    lastSpawnX: 200,
    lastFoodSpawnX: 400,
    fishY: 250,
    fishVy: 0,
    fishAngle: 0,
    lives: 3,
    feedStock: level.rewardFeedCount,
    shieldTimer: 0,
    invulnerabilityTimer: 0,
    obstacles: [],
    foodPellets: [],
    particles: [],
    bubbles: [],
    currentPhase: 0,
    currentOffset: 0,
  });

  // Audio Context synth for sound effects!
  // No external assets required, we synthesize underwater bubbles, flap splashes, coin pickups, damage, and shields dynamically!
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSynthSound = (type: 'swim' | 'collect' | 'shield' | 'hit' | 'victory' | 'gameover') => {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'swim') {
        // Soft bubble flap sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'collect') {
        // Bright shining sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'shield') {
        // Magical swell
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'hit') {
        // Low noise explosion
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.35);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'victory') {
        // Short celebratory arpeggio
        osc.type = 'sine';
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const oscNode = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscNode.connect(gainNode);
          gainNode.connect(ctx.destination);
          oscNode.type = 'triangle';
          oscNode.frequency.setValueAtTime(freq, now + idx * 0.1);
          gainNode.gain.setValueAtTime(0.15, now + idx * 0.1);
          gainNode.gain.linearRampToValueAtTime(0.01, now + idx * 0.1 + 0.2);
          oscNode.start(now + idx * 0.1);
          oscNode.stop(now + idx * 0.1 + 0.2);
        });
      } else if (type === 'gameover') {
        // Decrescendo sadness
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.6);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Audio synthesis failed to initialize:', e);
    }
  };

  // Toggle Sound State
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('rea_sound_enabled', String(nextVal));
  };

  // logical dimensions
  const LOGICAL_WIDTH = 800;
  const LOGICAL_HEIGHT = 500;

  // Initialize and spawn elements
  useEffect(() => {
    const state = stateRef.current;
    
    // Reset state values
    state.gameState = 'playing';
    state.distance = 0;
    state.score = 0;
    state.frame = 0;
    state.fishY = LOGICAL_HEIGHT / 2;
    state.fishVy = 0;
    state.fishAngle = 0;
    state.lives = 3;
    state.feedStock = level.rewardFeedCount;
    state.shieldTimer = 0;
    state.invulnerabilityTimer = 0;
    state.obstacles = [];
    state.foodPellets = [];
    state.particles = [];
    
    // Pre-populate background bubbles
    state.bubbles = Array.from({ length: 25 }, () => ({
      x: Math.random() * LOGICAL_WIDTH,
      y: Math.random() * LOGICAL_HEIGHT,
      size: Math.random() * 5 + 2,
      speed: Math.random() * 0.8 + 0.3,
      drift: Math.random() * 10,
      driftSpeed: Math.random() * 0.02 + 0.01,
      driftPhase: Math.random() * Math.PI * 2
    }));

    state.lastSpawnX = 350; // Delay first obstacle slightly
    state.lastFoodSpawnX = 200;

    // Direct HUD Sync
    setHudLives(3);
    setHudFeeds(level.rewardFeedCount);
    setHudScore(0);
    setHudProgress(0);
    setIsShieldActive(false);
    setShieldTimeLeft(0);
    setCanvasState('playing');

    // Canvas sizing setup
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const containerWidth = container.clientWidth;
      // Maintain 8:5 aspect ratio with bounds limits
      const computedHeight = Math.min(500, Math.floor(containerWidth * 5 / 8));
      
      canvas.width = containerWidth;
      canvas.height = computedHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Initial play audio
    playSynthSound('swim');

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [level]);

  // Handle key triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (canvasState !== 'playing' && stateRef.current.gameState !== 'playing') return;

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        triggerFlap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasState]);

  // Swim Action (Flap)
  const triggerFlap = () => {
    const state = stateRef.current;
    if (state.gameState !== 'playing') return;

    state.fishVy = level.jumpForce;
    playSynthSound('swim');

    // Create swim bubble splash particles!
    for (let i = 0; i < 6; i++) {
      state.particles.push({
        x: 90, // Rea's approximate X center
        y: state.fishY + (Math.random() * 10 - 5),
        vx: -(level.speed + Math.random() * 2 + 1),
        vy: Math.random() * 3 - 1.5,
        color: 'rgba(255, 255, 255, 0.7)',
        alpha: 0.8,
        size: Math.random() * 4 + 2,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  };

  // Feed/Shield Action
  const triggerFeed = () => {
    const state = stateRef.current;
    if (state.gameState !== 'playing') return;
    if (state.feedStock <= 0) return;

    // Use feed
    state.feedStock -= 1;
    setHudFeeds(state.feedStock);

    // Trigger golden shield
    // 4 seconds = 240 frames at 60fps
    state.shieldTimer = 240;
    setIsShieldActive(true);
    setShieldTimeLeft(4.0);
    playSynthSound('shield');

    // Beautiful shockwave sparkles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      state.particles.push({
        x: 90,
        y: state.fishY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: 'rgba(251, 191, 36, 0.95)', // Golden tailwind color
        alpha: 0.9,
        size: Math.random() * 5 + 3,
        decay: Math.random() * 0.02 + 0.01
      });
    }
  };

  // Main Canvas animation frame
  useEffect(() => {
    let lastTime = 0;

    const gameLoop = (timestamp: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const state = stateRef.current;

      if (!canvas || !ctx) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Frames ticker limits
      state.frame += 1;

      // 1. UPDATE PHYSICS (if in playing state)
      if (state.gameState === 'playing') {
        // Undercurrent tide (water currents force)
        if (level.hasCurrents) {
          state.currentPhase += 0.025;
          // Apply gentle vertical current force
          const currentForce = Math.sin(state.currentPhase) * 0.16;
          state.fishVy += currentForce;
          state.currentOffset = Math.sin(state.currentPhase) * 15;
        }

        // Apply general gravity
        state.fishVy += level.gravity;
        state.fishY += state.fishVy;

        // Rotate fish slightly based on velocity
        state.fishAngle = Math.max(-0.4, Math.min(0.6, state.fishVy * 0.07));

        // Limit game area ceiling and bed
        const radius = 16;
        if (state.fishY < radius) {
          state.fishY = radius;
          state.fishVy = 0.05;
        } else if (state.fishY > LOGICAL_HEIGHT - radius - 15) {
          // Hit the sandy bottom seabed: lose life
          state.fishY = LOGICAL_HEIGHT - radius - 16;
          state.fishVy = -3.5; // Slight bounce force
          damageFish('seabed');
        }

        // Advance level distance progress
        state.distance += level.speed;
        const progressRaw = Math.min(100, Math.floor((state.distance / level.levelDuration) * 100));
        setHudProgress(progressRaw);

        // Update score
        state.score = Math.floor(state.distance / 10);
        setHudScore(state.score);

        // Update powers timers
        if (state.shieldTimer > 0) {
          state.shieldTimer--;
          setShieldTimeLeft(parseFloat((state.shieldTimer / 60).toFixed(1)));
          if (state.shieldTimer === 0) {
            setIsShieldActive(false);
          }
        }

        if (state.invulnerabilityTimer > 0) {
          state.invulnerabilityTimer--;
        }

        // Check level success!
        if (state.distance >= level.levelDuration && state.obstacles.filter(o => !o.passed).length === 0) {
          handleSuccessState();
        }

        // 2. SPAWN LOGIC
        // Spawn obstacles
        if (state.distance < level.levelDuration - 300) {
          const spawnDistanceGap = level.obstacleFrequency;
          if (state.distance - state.lastSpawnX >= spawnDistanceGap) {
            spawnObstacle(state);
          }
        }

        // Spawn food pellets randomly floating
        if (state.distance - state.lastFoodSpawnX >= 350) {
          if (Math.random() < 0.6) {
            spawnFoodPellet(state);
          }
          state.lastFoodSpawnX = state.distance;
        }

        // 3. MOVING ELEMENTS UPDATES & COLLISIONS
        updateAndCollideObstacles(state);
        updateAndCollideFood(state);
      }

      // Update background bubbles and floating visual effects (always update to keep visual state dynamic)
      updateBubblesAndParticles(state);

      // 4. RENDERING CANVAS
      drawGame(ctx, canvas.width, canvas.height, state);

      // Next frame
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    // Helper functions for updating properties
    const spawnObstacle = (state: typeof stateRef['current']) => {
      // Choose random wall shape configuration
      const gapY = Math.floor(Math.random() * (LOGICAL_HEIGHT - level.gapSize - 160)) + level.gapSize/2 + 80;
      const typeIndex = Math.floor(Math.random() * level.obstacleTypes.length);
      const chosenType = level.obstacleTypes[typeIndex];

      const newObstacle: Obstacle = {
        id: state.frame,
        x: LOGICAL_WIDTH,
        width: 55,
        gapY: gapY,
        gapHeight: level.gapSize,
        type: chosenType,
        passed: false
      };

      // Set moving attributes for specific types (jellyfish or sea mines)
      if (chosenType === 'jellyfish') {
        newObstacle.speedY = 1.0 + Math.random() * 0.6;
        newObstacle.rangeY = 45;
        newObstacle.initialY = gapY;
        newObstacle.currentYOffset = 0;
        newObstacle.direction = Math.random() > 0.5 ? 1 : -1;
      } else if (chosenType === 'mine') {
        newObstacle.speedY = 0.6 + Math.random() * 0.4;
        newObstacle.rangeY = 30;
        newObstacle.initialY = gapY;
        newObstacle.currentYOffset = Math.random() * 20 - 10;
        newObstacle.direction = Math.random() > 0.5 ? 1 : -1;
      }

      state.obstacles.push(newObstacle);
      state.lastSpawnX = state.distance;
    };

    const spawnFoodPellet = (state: typeof stateRef['current']) => {
      // Find a safe spot, or drop in the pathways/gaps
      const py = Math.floor(Math.random() * (LOGICAL_HEIGHT - 120)) + 60;
      state.foodPellets.push({
        id: state.frame,
        x: LOGICAL_WIDTH,
        y: py,
        collected: false,
        pulsePhase: Math.random() * Math.PI * 2
      });
    };

    const updateAndCollideObstacles = (state: typeof stateRef['current']) => {
      // Move obstacles from right to left
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        obs.x -= level.speed;

        // If obstacle has dynamic motion (like bobbing jellyfish)
        if (obs.type === 'jellyfish' || obs.type === 'mine') {
          if (obs.speedY !== undefined && obs.currentYOffset !== undefined && obs.rangeY !== undefined && obs.direction !== undefined) {
            obs.currentYOffset += obs.speedY * obs.direction;
            if (Math.abs(obs.currentYOffset) >= obs.rangeY) {
              obs.direction *= -1; // Reverse path
            }
          }
        }

        // Score trigger when fish passes it
        if (!obs.passed && obs.x + obs.width < 90) { // Fish X coordinate standard is 90
          obs.passed = true;
          // Add extra score for successfully passing obstacle!
          state.score += 50;
        }

        // Collision volume check
        // Fish bounding circle attributes
        const fishRadius = 14;
        const fishCenterX = 90;
        const fishCenterY = state.fishY;

        // Check if fish overlap with obstacle X span
        if (fishCenterX + fishRadius > obs.x && fishCenterX - fishRadius < obs.x + obs.width) {
          // Obstacle has top pillar and bottom pillar, or central object for mines/jellyfish
          const obstacleGapY = obs.initialY !== undefined && obs.currentYOffset !== undefined 
            ? obs.initialY + obs.currentYOffset 
            : obs.gapY;
          
          if (obs.type === 'mine' || obs.type === 'jellyfish') {
            // These objects block the actual gap pathway!
            // Circular or centered block collision box
            const objCenterX = obs.x + obs.width / 2;
            const objCenterY = obstacleGapY;
            const objRadius = obs.type === 'mine' ? 24 : 26;

            const distSq = Math.pow(fishCenterX - objCenterX, 2) + Math.pow(fishCenterY - objCenterY, 2);
            if (distSq < Math.pow(fishRadius + objRadius, 2)) {
              if (state.shieldTimer > 0) {
                // Shield destroys or knocks away obstacle!
                shatterObstacle(obs, state);
                state.obstacles.splice(i, 1);
              } else {
                damageFish(obs.type);
              }
            }
          } else {
            // Rectangular columns collision (coral and rock pillars)
            const topBoundaryBottom = obstacleGapY - obs.gapHeight / 2;
            const bottomBoundaryTop = obstacleGapY + obs.gapHeight / 2;

            const hitTop = fishCenterY - fishRadius < topBoundaryBottom;
            const hitBottom = fishCenterY + fishRadius > bottomBoundaryTop;

            if (hitTop || hitBottom) {
              if (state.shieldTimer > 0) {
                // Shield fractures or bypasses column, burst some particles!
                createClashParticles(obs.x + obs.width / 2, hitTop ? topBoundaryBottom : bottomBoundaryTop, state);
                // Keep moving, shielded!
              } else {
                damageFish(obs.type);
              }
            }
          }
        }

        // Clean out of bounds
        if (obs.x < -80) {
          state.obstacles.splice(i, 1);
        }
      }
    };

    const updateAndCollideFood = (state: typeof stateRef['current']) => {
      const fishCenterX = 90;
      const fishCenterY = state.fishY;
      const fishRadius = 16;

      for (let i = state.foodPellets.length - 1; i >= 0; i--) {
        const pellet = state.foodPellets[i];
        pellet.x -= level.speed;
        pellet.pulsePhase += 0.08;

        // Distance check
        const distSq = Math.pow(fishCenterX - pellet.x, 2) + Math.pow(fishCenterY - pellet.y, 2);
        if (distSq < Math.pow(fishRadius + 14, 2)) {
          // Collected food! Automatically shield up!
          pellet.collected = true;
          
          // Trigger golden shield immediately (4 seconds = 240 frames)
          state.shieldTimer = 240;
          setIsShieldActive(true);
          setShieldTimeLeft(4.0);
          
          playSynthSound('shield');

          // Green/Gold rich circular burst of particles
          for (let p = 0; p < 18; p++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 4 + 1.5;
            state.particles.push({
              x: pellet.x,
              y: pellet.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              color: p % 2 === 0 ? 'rgba(34, 197, 94, 0.95)' : 'rgba(251, 191, 36, 0.95)', // Glowing green + gold
              alpha: 0.95,
              size: Math.random() * 5 + 2.5,
              decay: Math.random() * 0.03 + 0.015
            });
          }

          state.foodPellets.splice(i, 1);
          continue;
        }

        // Erase when off-screen
        if (pellet.x < -50) {
          state.foodPellets.splice(i, 1);
        }
      }
    };

    const shatterObstacle = (obs: Obstacle, state: typeof stateRef['current']) => {
      playSynthSound('hit');
      // Giant explosion of glowing debris
      const obsY = obs.initialY !== undefined && obs.currentYOffset !== undefined 
        ? obs.initialY + obs.currentYOffset 
        : obs.gapY;

      for (let k = 0; k < 20; k++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 5 + 2;
        state.particles.push({
          x: obs.x + obs.width / 2,
          y: obsY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: obs.type === 'mine' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(244, 63, 94, 0.9)', // Sinking debris
          alpha: 1.0,
          size: Math.random() * 6 + 3,
          decay: Math.random() * 0.04 + 0.02
        });
      }
    };

    const createClashParticles = (x: number, y: number, state: typeof stateRef['current']) => {
      // Golden shield friction shield sparks
      for (let k = 0; k < 4; k++) {
        state.particles.push({
          x: x + (Math.random() * 10 - 5),
          y: y,
          vx: -level.speed * 0.5 - Math.random() * 2,
          vy: Math.random() * 4 - 2,
          color: 'rgba(251, 191, 36, 0.9)', // Golden friction rings
          alpha: 0.9,
          size: Math.random() * 4 + 1.5,
          decay: Math.random() * 0.05 + 0.03
        });
      }
    };

    const damageFish = (source: 'seabed' | 'coral' | 'rock' | 'mine' | 'jellyfish') => {
      const state = stateRef.current;
      // If already shielded or invulnerable, ignore!
      if (state.shieldTimer > 0 || state.invulnerabilityTimer > 0) return;

      // Hurt Rea
      state.lives -= 1;
      setHudLives(state.lives);
      state.invulnerabilityTimer = 90; // 1.5s invulnerable flashing
      playSynthSound('hit');

      // Giant red/orange shockwave burst
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4 + 1;
        state.particles.push({
          x: 90,
          y: state.fishY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: 'rgba(239, 68, 68, 0.95)', // Blood red drops
          alpha: 0.9,
          size: Math.random() * 5 + 2.5,
          decay: Math.random() * 0.04 + 0.02
        });
      }

      // Check crash / game over sequence
      if (state.lives <= 0) {
        handleGameOverState();
      }
    };

    const updateBubblesAndParticles = (state: typeof stateRef['current']) => {
      // 1. Bubbles bobbing and rising
      for (let i = 0; i < state.bubbles.length; i++) {
        const bubble = state.bubbles[i];
        bubble.y -= bubble.speed;
        bubble.driftPhase += bubble.driftSpeed;
        bubble.x += Math.sin(bubble.driftPhase) * 0.25;

        // Respawn bubble from floor if it exits top
        if (bubble.y < -15) {
          bubble.y = LOGICAL_HEIGHT + 15;
          bubble.x = Math.random() * LOGICAL_WIDTH;
          bubble.speed = Math.random() * 0.8 + 0.3;
        }
      }

      // 2. Physical particles fading away
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
        }
      }

      // 3. Passive trail bubbles from Rea's breathing or movement speed
      if (state.gameState === 'playing' && state.frame % 6 === 0) {
        state.particles.push({
          x: 74, // Behind mouth/gills position
          y: state.fishY + Math.random() * 6 - 3,
          vx: -level.speed * 0.7 - (Math.random() * 1.2),
          vy: -Math.random() * 0.5 - 0.1,
          color: 'rgba(255, 255, 255, 0.45)', // Bubble trail
          alpha: 0.7,
          size: Math.random() * 3 + 1.5,
          decay: Math.random() * 0.015 + 0.01
        });
      }

      // Extra shield sparkles
      if (state.gameState === 'playing' && state.shieldTimer > 0 && state.frame % 3 === 0) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 22;
        state.particles.push({
          x: 90 + Math.cos(angle) * radius,
          y: state.fishY + Math.sin(angle) * radius,
          vx: -level.speed * 0.6 + Math.cos(angle) * 1.0,
          vy: Math.sin(angle) * 1.0,
          color: 'rgba(251, 191, 36, 0.85)', // Gold sparkles orbit
          alpha: 0.85,
          size: Math.random() * 3.5 + 1.5,
          decay: Math.random() * 0.04 + 0.02
        });
      }
    };

    // Begin looping
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [level]);

  // Handle Game Over
  const handleGameOverState = () => {
    const state = stateRef.current;
    state.gameState = 'gameover';
    setCanvasState('gameover');
    playSynthSound('gameover');

    // Sync highscores
    const savedScoresStr = localStorage.getItem('rea_scores') || '{}';
    try {
      const scores = JSON.parse(savedScoresStr);
      const currentHighest = scores[level.id] || 0;
      if (state.score > currentHighest) {
        scores[level.id] = state.score;
        localStorage.setItem('rea_scores', JSON.stringify(scores));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle level clear success
  const handleSuccessState = () => {
    const state = stateRef.current;
    state.gameState = 'victory';
    setCanvasState('levelsuccess');
    playSynthSound('victory');

    // Save and unlock next level
    const currentUnlocks = parseInt(localStorage.getItem('rea_unlocked_level') || '1');
    if (level.id >= currentUnlocks && level.id < 8) {
      localStorage.setItem('rea_unlocked_level', String(level.id + 1));
    }

    // Save Score
    const savedScoresStr = localStorage.getItem('rea_scores') || '{}';
    try {
      const scores = JSON.parse(savedScoresStr);
      const currentHighest = scores[level.id] || 0;
      if (state.score > currentHighest) {
        scores[level.id] = state.score;
      }
      localStorage.setItem('rea_scores', JSON.stringify(scores));
    } catch (e) {
      console.error(e);
    }
  };

  const drawGame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    state: typeof stateRef['current']
  ) => {
    // Standard drawing calculations
    ctx.clearRect(0, 0, width, height);

    // Coordinate multiplier to map logical 800x500 space onto the actual CSS rendered size
    const scaleX = width / LOGICAL_WIDTH;
    const scaleY = height / LOGICAL_HEIGHT;

    ctx.save();
    ctx.scale(scaleX, scaleY);

    // 1. DRAW WATER GRADIENT BACKGROUND
    const seaGradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    // Draw background corresponding to current level canvasBg and ambient dark ocean vibe
    seaGradient.addColorStop(0, hexToRgb(level.canvasBg, 0.95));
    seaGradient.addColorStop(1, hexToRgb(level.canvasBg, 0.45));
    ctx.fillStyle = seaGradient;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // 2. DRAW NATURAL SEA BACKGROUND (Swaying seaweed corals at the bottom)
    drawBackgroundScenery(ctx, state);

    // 3. DRAW TRANSLUCENT BUBBLES
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    for (const bubble of state.bubbles) {
      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Gleam highlight inside bubble
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'; // Back to standard
    }

    // 4. DRAW WATER CURRENT INDICATORS (White streaming trails)
    if (level.hasCurrents) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      for (let j = 0; j < 4; j++) {
        const streamY = 120 + j * 90 + Math.sin(state.currentPhase + j) * 8;
        const driftOffset = (state.frame * 2.5 + j * 200) % (LOGICAL_WIDTH + 100);
        ctx.beginPath();
        ctx.moveTo(LOGICAL_WIDTH - driftOffset, streamY);
        ctx.lineTo(LOGICAL_WIDTH - driftOffset + 120, streamY);
        ctx.stroke();
      }
    }

    // 5. DRAW FOOD PELLETS
    for (const pellet of state.foodPellets) {
      const pulse = Math.sin(pellet.pulsePhase) * 2;
      const r = 8 + pulse * 0.5;

      // Outer glow circle
      const pelletGlow = ctx.createRadialGradient(pellet.x, pellet.y, 2, pellet.x, pellet.y, r * 2.5);
      pelletGlow.addColorStop(0, 'rgba(52, 211, 153, 0.8)'); // Light Emerald Green
      pelletGlow.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = pelletGlow;
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, r * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Main pellet body (Starfish shape or round pellet)
      ctx.fillStyle = '#10b981'; // Tailwind Emerald-500
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Small details
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pellet.x - r * 0.35, pellet.y - r * 0.35, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. DRAW EXTRA PARTICLES (Sparks, water splashes, bubbles)
    for (const p of state.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0; // Reset alpha

    // 7. DRAW OBSTACLES
    drawObstacles(ctx, state);

    // 8. DRAW REA (THE TINY FISH!)
    drawRea(ctx, state);

    ctx.restore();
  };

  const drawRea = (ctx: CanvasRenderingContext2D, state: typeof stateRef['current']) => {
    const rx = 90;
    const ry = state.fishY;
    const isInvulnerable = state.invulnerabilityTimer > 0;

    // Flashing visual effect when damaged & invulnerable
    if (isInvulnerable && Math.floor(state.frame / 5) % 2 === 0) {
      return; // Skip drawing this frame to simulate flashing!
    }

    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(state.fishAngle);

    // Shield protective circle glow
    if (state.shieldTimer > 0) {
      ctx.save();
      const shieldPulse = Math.sin(state.frame * 0.1) * 3;
      const shieldRadius = 26 + shieldPulse;
      
      const shieldGlow = ctx.createRadialGradient(0, 0, 16, 0, 0, shieldRadius);
      shieldGlow.addColorStop(0, 'rgba(251, 191, 36, 0.2)'); // Amber yellow core
      shieldGlow.addColorStop(0.7, 'rgba(251, 191, 36, 0.75)'); // Intense amber rim
      shieldGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      
      ctx.fillStyle = shieldGlow;
      ctx.beginPath();
      ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
      ctx.fill();

      // Add a double rings border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 22 + shieldPulse * 0.4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    // 1. Swim Tails fin wiggler
    const tailWiggle = Math.sin(state.frame * 0.28 + (Math.abs(state.fishVy) * 0.1)) * 9;
    
    // Tail fin draw path
    ctx.fillStyle = '#f59e0b'; // Amber-500
    ctx.strokeStyle = '#d97706'; // Amber-600
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(-18 + tailWiggle * 0.35, -12 + tailWiggle, -28 + tailWiggle, -16 + tailWiggle);
    ctx.lineTo(-24 + tailWiggle * 0.8, tailWiggle);
    ctx.lineTo(-28 + tailWiggle, 16 + tailWiggle);
    ctx.quadraticCurveTo(-18 + tailWiggle * 0.35, 12 + tailWiggle, -12, 0);
    ctx.fill();
    ctx.stroke();

    // 2. Main fish body (Rea)
    // Dynamic body squish based on jump force velocity
    const squishY = Math.max(0.85, 1.0 - Math.abs(state.fishVy) * 0.02);
    const squishX = Math.min(1.15, 1.0 + Math.abs(state.fishVy) * 0.025);
    
    // Body gradient
    const bodyGrad = ctx.createLinearGradient(0, -12, 0, 12);
    bodyGrad.addColorStop(0, '#fb923c'); // Orange-400 (Top)
    bodyGrad.addColorStop(0.4, '#f97316'); // Orange-500 (Center)
    bodyGrad.addColorStop(1, '#ea580c'); // Orange-600 (Bottom under-belly)
    
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#c2410c'; // Orange-700
    ctx.lineWidth = 2.0;
    
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 * squishX, 13 * squishY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Decorative side stripe stripes (cute clownfish markings!)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -11 * squishY);
    ctx.lineTo(2, -10 * squishY);
    ctx.lineTo(1, 10 * squishY);
    ctx.lineTo(-4, 11 * squishY);
    ctx.quadraticCurveTo(-2, 0, -4, -11 * squishY);
    ctx.fill();
    ctx.stroke();

    // 4. Large adorable eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, -4, 4.8, 0, Math.PI * 2);
    ctx.fill();

    // Pupil looking forward-downward
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(9.5, -3.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Cute eye sheen dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10.5, -4.5, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Smiling fish mouth
    ctx.strokeStyle = '#7c2d12'; // Rust deep orange
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(12, 3, 3, 0, Math.PI * 0.7);
    ctx.stroke();

    // 6. Flapping pectoral fins
    const finWag = Math.sin(state.frame * 0.2) * 4;
    ctx.fillStyle = '#fb923c';
    ctx.strokeStyle = '#c2410c';
    ctx.beginPath();
    ctx.ellipse(-2, 3, 4.5, 6, Math.PI * 0.15 + finWag * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  const drawBackgroundScenery = (ctx: CanvasRenderingContext2D, state: typeof stateRef['current']) => {
    // Ground sandy wave
    ctx.fillStyle = '#1e3a8a'; // Deep base sea floor shadow
    ctx.beginPath();
    ctx.ellipse(300, LOGICAL_HEIGHT - 5, 500, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sand layer
    ctx.fillStyle = '#d97706'; // Golden deep dark sand
    const sandOffset = (state.frame * 0.3) % 180;
    for (let i = -1; i < 6; i++) {
      const sx = i * 180 - sandOffset;
      ctx.beginPath();
      ctx.moveTo(sx, LOGICAL_HEIGHT);
      ctx.quadraticCurveTo(sx + 90, LOGICAL_HEIGHT - 22, sx + 180, LOGICAL_HEIGHT);
      ctx.fill();
    }

    // Swaying seaweed blades
    const seaweedCount = 8;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.45)'; // Soft emerald green
    for (let i = 0; i < seaweedCount; i++) {
      const swX = (i * 120 + 40) % (LOGICAL_WIDTH + 80) - 40;
      const swH = 60 + Math.sin(i * 1.5) * 20;
      const sway = Math.sin(state.frame * 0.02 + i) * 12;

      ctx.beginPath();
      ctx.moveTo(swX, LOGICAL_HEIGHT);
      ctx.bezierCurveTo(swX - 10 + sway * 0.5, LOGICAL_HEIGHT - swH * 0.4, swX + 10 + sway, LOGICAL_HEIGHT - swH * 0.8, swX + sway, LOGICAL_HEIGHT - swH);
      ctx.bezierCurveTo(swX + 18 + sway, LOGICAL_HEIGHT - swH * 0.7, swX + 8 + sway * 0.3, LOGICAL_HEIGHT - swH * 0.3, swX + 12, LOGICAL_HEIGHT);
      ctx.fill();
    }
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D, state: typeof stateRef['current']) => {
    for (const obs of state.obstacles) {
      const obstacleGapY = obs.initialY !== undefined && obs.currentYOffset !== undefined 
        ? obs.initialY + obs.currentYOffset 
        : obs.gapY;

      // Draw obstacle based on its configuration
      if (obs.type === 'mine') {
        // DRAW NAVAL SEA MINE
        drawSeaMine(ctx, obs.x + obs.width / 2, obstacleGapY, state);
      } else if (obs.type === 'jellyfish') {
        // DRAW JELLYFISH
        drawJellyfish(ctx, obs.x + obs.width / 2, obstacleGapY, state);
      } else {
        // COLUMNS: DRAW CORAL / DEEP ROCKS
        // Draw top pillar down to gap top
        const topHeight = obstacleGapY - obs.gapHeight / 2;
        drawPillar(ctx, obs.x, 0, obs.width, topHeight, true, obs.type);

        // Draw bottom pillar from gap bottom to floor
        const bottomY = obstacleGapY + obs.gapHeight / 2;
        const bottomHeight = LOGICAL_HEIGHT - bottomY;
        drawPillar(ctx, obs.x, bottomY, obs.width, bottomHeight, false, obs.type);
      }
    }
  };

  const drawPillar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isTop: boolean,
    type: 'coral' | 'rock'
  ) => {
    ctx.save();
    
    // Smooth corners for submarine growths
    ctx.lineJoin = 'round';

    if (type === 'coral') {
      // 1. CORAL BRANCH REEF
      const coralGradient = ctx.createLinearGradient(x, 0, x + width, 0);
      coralGradient.addColorStop(0, '#ec4899'); // Pink-500
      coralGradient.addColorStop(0.5, '#f43f5e'); // Rose-500
      coralGradient.addColorStop(1, '#be185d'); // Dark pink-700
      
      ctx.fillStyle = coralGradient;
      ctx.strokeStyle = '#9d174d'; // Dark rose border
      ctx.lineWidth = 2.5;

      // Draw rounded rectangular pillar
      ctx.beginPath();
      if (isTop) {
        ctx.fillRect(x, y - 5, width, height + 5);
        ctx.strokeRect(x, y - 5, width, height + 5);

        // Add branching horizontal coral cups for character!
        ctx.beginPath();
        ctx.arc(x + width/2, y + height - 8, width/2 + 2, 0, Math.PI, false);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(x, y, width, height + 5);
        ctx.strokeRect(x, y, width, height + 5);

        // Rounded coral cup lid on top
        ctx.beginPath();
        ctx.arc(x + width/2, y + 8, width/2 + 2, 0, Math.PI, true);
        ctx.fill();
        ctx.stroke();
      }

      // Inside bubble pores detailing
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      const spacingY = 35;
      const count = Math.floor(height / spacingY);
      for (let j = 0; j <= count; j++) {
        const py = y + (isTop ? height - 30 - j * spacingY : 30 + j * spacingY);
        if (py > y && py < y + height) {
          ctx.beginPath();
          ctx.arc(x + width * 0.35, py, 4, 0, Math.PI * 2);
          ctx.arc(x + width * 0.65, py + 12, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // 2. MOSS ROCK COLUMN
      const rockGradient = ctx.createLinearGradient(x, 0, x + width, 0);
      rockGradient.addColorStop(0, '#64748b'); // Slate-500
      rockGradient.addColorStop(0.5, '#475569'); // Slate-600
      rockGradient.addColorStop(1, '#1e293b'); // Slate-800

      ctx.fillStyle = rockGradient;
      ctx.strokeStyle = '#0f172a'; // Deep slate
      ctx.lineWidth = 2.5;

      // Draw rugged stony polygons instead of perfect grids
      ctx.beginPath();
      if (isTop) {
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + height - 12);
        ctx.lineTo(x + width * 0.3, y + height);
        ctx.lineTo(x + width * 0.7, y + height - 4);
        ctx.lineTo(x + width, y + height - 14);
        ctx.lineTo(x + width, y - 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Little green seaweed moss hanging
        ctx.fillStyle = '#15803d'; // Green-700
        ctx.beginPath();
        ctx.moveTo(x + 5, y + height - 1);
        ctx.quadraticCurveTo(x + 12, y + height + 14, x + 15, y + height - 3);
        ctx.quadraticCurveTo(x + 25, y + height + 18, x + 30, y + height);
        ctx.quadraticCurveTo(x + 40, y + height + 10, x + 48, y + height - 2);
        ctx.lineTo(x + width - 5, y + height - 1);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.moveTo(x, y + height + 5);
        ctx.lineTo(x, y + 14);
        ctx.lineTo(x + width * 0.3, y + 4);
        ctx.lineTo(x + width * 0.6, y);
        ctx.lineTo(x + width * 0.8, y + 8);
        ctx.lineTo(x + width, y + 16);
        ctx.lineTo(x + width, y + height + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Green moss capping on top
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(x, y + 14);
        ctx.lineTo(x + width * 0.3, y + 4);
        ctx.lineTo(x + width * 0.6, y);
        ctx.lineTo(x + width * 0.8, y + 8);
        ctx.lineTo(x + width, y + 16);
        ctx.quadraticCurveTo(x + width * 0.7, y + 24, x + width * 0.5, y + 18);
        ctx.quadraticCurveTo(x + width * 0.2, y + 25, x, y + 14);
        ctx.closePath();
        ctx.fill();
      }

      // Crack lines in the rocks to look highly authentic
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + width * 0.35, y + height * 0.3);
      ctx.lineTo(x + width * 0.45, y + height * 0.45);
      ctx.lineTo(x + width * 0.15, y + height * 0.55);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawSeaMine = (ctx: CanvasRenderingContext2D, cx: number, cy: number, state: typeof stateRef['current']) => {
    ctx.save();
    ctx.translate(cx, cy);

    // Minor slow rotation effect
    const angleRotation = state.frame * 0.015;
    ctx.rotate(angleRotation);

    // Cable link trailing straight down to the ocean depths
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(115, 115, 115, 0.45)'; // Chain metal color
    ctx.lineWidth = 2.0;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, LOGICAL_HEIGHT);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleRotation);

    // Draw Spikes
    ctx.strokeStyle = '#334155'; // Dark steel gray
    ctx.lineWidth = 4.0;
    const spikeCount = 8;
    for (let s = 0; s < spikeCount; s++) {
      const angle = (s * Math.PI * 2) / spikeCount;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 32, Math.sin(angle) * 32);
      ctx.stroke();

      // Spike metal tips
      ctx.fillStyle = '#ef4444'; // Red detonators
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * 32, Math.sin(angle) * 32, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main Mine spherical core
    const coreGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 20);
    coreGrad.addColorStop(0, '#475569'); // Slate-600
    coreGrad.addColorStop(0.7, '#1e293b'); // Dark Slate-800
    coreGrad.addColorStop(1, '#0f172a'); // Very dark steel

    ctx.fillStyle = coreGrad;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pulsing central flashing alarm red beacon!
    const ledIntensity = Math.abs(Math.sin(state.frame * 0.08));
    ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + ledIntensity * 0.7})`;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawJellyfish = (ctx: CanvasRenderingContext2D, cx: number, cy: number, state: typeof stateRef['current']) => {
    ctx.save();
    ctx.translate(cx, cy);

    const animationPhase = state.frame * 0.06;
    const swimSqueezeX = 1.0 + Math.sin(animationPhase) * 0.12;
    const swimSqueezeY = 1.0 - Math.sin(animationPhase) * 0.12;

    // Draw wavy trailing tentacles
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)'; // Soft glowing translucent pink tentacles
    ctx.lineWidth = 2;
    const tentacleCount = 4;
    for (let t = 0; t < tentacleCount; t++) {
      const tx = -14 + t * 9;
      const tentacleSway = Math.sin(state.frame * 0.06 + t) * 8;

      ctx.beginPath();
      ctx.moveTo(tx, 5);
      ctx.bezierCurveTo(tx - 6 + tentacleSway * 0.4, 18, tx + 6 + tentacleSway, 32, tx + tentacleSway, 46);
      ctx.stroke();
    }

    // Semi-circle fluorescent translucent bell hood
    const bellGrad = ctx.createRadialGradient(0, -6, 2, 0, 0, 22);
    bellGrad.addColorStop(0, '#f9a8d4'); // Soft pink-300
    bellGrad.addColorStop(0.7, '#ec4899'); // Neon Pink-500
    bellGrad.addColorStop(1, '#be185d'); // Deep dark rose-700
    
    ctx.fillStyle = bellGrad;
    ctx.strokeStyle = '#fbcfe8'; // Glowing light margin edge
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    // Squished semi-dome
    ctx.arc(0, 0, 18 * swimSqueezeX, Math.PI, 0, false);
    ctx.quadraticCurveTo(12 * swimSqueezeX, 4 * swimSqueezeY, 0, 1 * swimSqueezeY);
    ctx.quadraticCurveTo(-12 * swimSqueezeX, 4 * swimSqueezeY, -18 * swimSqueezeX, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Outer bio-luminescent glow aura around the hood
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
    ctx.lineWidth = 3.0;
    ctx.stroke();
    
    ctx.restore();
  };

  // Convert hex to rgb for alpha overlay opacity
  const hexToRgb = (hex: string, alpha: number) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Game flow control functions
  const handlePauseToggle = () => {
    const state = stateRef.current;
    if (state.gameState === 'playing') {
      state.gameState = 'paused';
      setCanvasState('paused');
    } else if (state.gameState === 'paused') {
      state.gameState = 'playing';
      setCanvasState('playing');
    }
  };

  const handleRestart = () => {
    const state = stateRef.current;
    
    // Clear and restore parameters
    state.gameState = 'playing';
    state.distance = 0;
    state.score = 0;
    state.frame = 1;
    state.lastSpawnX = 350;
    state.lastFoodSpawnX = 200;
    state.fishY = LOGICAL_HEIGHT / 2;
    state.fishVy = 0;
    state.fishAngle = 0;
    state.lives = 3;
    state.feedStock = level.rewardFeedCount;
    state.shieldTimer = 0;
    state.invulnerabilityTimer = 0;
    state.obstacles = [];
    state.foodPellets = [];
    state.particles = [];

    setHudLives(3);
    setHudFeeds(level.rewardFeedCount);
    setHudScore(0);
    setHudProgress(0);
    setIsShieldActive(false);
    setShieldTimeLeft(0);
    setCanvasState('playing');

    playSynthSound('swim');
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-[32px] overflow-hidden shadow-xl bg-white border border-[#E0E0D6] flex flex-col font-sans select-none">
      
      {/* 1. HUD TOP STATS HEADER BAR */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#F5F5F0] border-b border-[#E0E0D6] z-10 text-[#2C3E2E]">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-1 px-2.5 bg-white hover:bg-stone-50 border border-[#E0E0D6] active:scale-95 transition rounded-xl text-[#2C3E2E] hover:text-[#1A3A3A] flex items-center gap-1.5 text-xs font-semibold shadow-sm"
            id="btn_back_to_menu"
          >
            <ChevronLeft size={16} />
            Back
          </button>
          
          <div className="h-6 w-px bg-[#E0E0D6]"></div>
          
          <div>
            <p className="text-[10px] text-[#5A5A40] font-bold uppercase tracking-wider">Level 0{level.id}</p>
            <h3 className="text-sm font-serif italic font-extrabold text-[#1A3A3A] -mt-0.5">{level.name}</h3>
          </div>
        </div>

        {/* Level Distance Progress Track Bar */}
        <div className="hidden sm:flex flex-col flex-1 max-w-[200px] mx-6">
          <div className="flex justify-between items-center text-[10px] text-[#5A5A40] mb-0.5">
            <span className="font-serif italic font-semibold">Swim Progress</span>
            <span className="font-mono text-[#FF7F50] font-bold">{hudProgress}%</span>
          </div>
          <div className="w-full h-2 bg-[#E8E8E0] rounded-full overflow-hidden border border-[#E0E0D6]/60">
            <div 
              className="bg-gradient-to-r from-[#2D5A5A] to-[#FF7F50] h-full transition-all duration-100 ease-out rounded-full"
              style={{ width: `${hudProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Lives & Feed Status Indicators */}
        <div className="flex items-center space-x-6">
          {/* Hearts lives */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#5A5A40] font-mono uppercase tracking-wider mb-0.5">Lives</span>
            <div className="flex space-x-1">
              {[1, 2, 3].map((heartId) => (
                <Heart
                  key={heartId}
                  size={18}
                  className={`transition-all duration-300 ${
                    heartId <= hudLives 
                      ? 'fill-[#FF7F50] text-[#FF7F50] scale-100 filter drop-shadow-[0_0_4px_rgba(255,127,80,0.4)]' 
                      : 'text-[#E0E0D6] scale-90 fill-[#F5F5F0]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-[#E0E0D6]"></div>

          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-xl hover:bg-[#E8E8E0] text-[#5A5A40] hover:text-[#1A3A3A] transition active:scale-95"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
            id="toggle_sound"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Active Pause overlay trigger */}
          {canvasState === 'playing' && (
            <button
              onClick={handlePauseToggle}
              className="p-1.5 bg-white border border-[#E0E0D6] text-[#5A5A40] hover:bg-[#E8E8E0] hover:text-[#1A3A3A] rounded-xl transition active:scale-95 shadow-sm"
              id="btn_pause_game"
            >
              <Pause size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. THE GAME WINDOW CANVAS container */}
      <div 
        ref={containerRef}
        onClick={canvasState === 'playing' ? triggerFlap : undefined}
        className={`relative w-full cursor-pointer flex justify-center items-center overflow-hidden bg-sky-900 touch-none select-none transition-all duration-300 ${
          level.hasCurrents ? 'border-y border-emerald-900/30' : ''
        }`}
        style={{ minHeight: '300px' }}
      >
        <canvas 
          ref={canvasRef}
          className="block w-full"
        />

        {/* Gentle indicator notification for Sandy Currents level */}
        {showCurrentIndicator && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#2D5A5A] border border-[#E0E0D6] px-3 py-1.5 rounded-2xl flex items-center space-x-2 text-xs font-semibold font-sans select-none pointer-events-none shadow-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#2D5A5A]"></span>
            <span className="font-serif italic">Current Flowing (Tidal Waves Active)</span>
          </div>
        )}

        {/* SHIELD HUD FLOAT AND POWER BAR */}
        {canvasState === 'playing' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-white/95 border border-[#E0E0D6] px-5 py-3 rounded-2xl shadow-xl z-20 select-none" onClick={(e) => e.stopPropagation()}>
            {isShieldActive ? (
              <div className="flex items-center space-x-2 font-mono text-xs font-bold text-[#D4AF37] bg-yellow-50/75 border border-[#E0E0D6] px-3 py-1.5 rounded-xl animate-pulse">
                <Shield size={14} className="fill-[#D4AF37] text-[#D4AF37]" />
                <span>GOLDEN SHIELD: {shieldTimeLeft}s</span>
              </div>
            ) : (
              <span className="text-[10px] text-[#5A5A40] font-semibold flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#D4AF37] animate-spin" style={{ animationDuration: '4s' }} />
                Catch glowing green pellets to trigger Golden Shield automatically!
              </span>
            )}
          </div>
        )}

        {/* PAUSE OVERLAY WINDOW */}
        {canvasState === 'paused' && (
          <div className="absolute inset-0 bg-[#0D2121]/75 backdrop-blur-sm flex flex-col justify-center items-center z-25 text-[#2C3E2E] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#F5F5F0] border border-[#E0E0D6] p-8 rounded-[28px] max-w-sm w-full text-center space-y-6 shadow-xl animate-float">
              <div className="inline-flex p-4 rounded-full bg-[#E8E8E0] text-[#1A3A3A] border border-[#E0E0D6]">
                <Pause size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-serif italic font-extrabold text-[#1A3A3A]">Game Paused</h3>
                <p className="text-[#5A5A40] text-sm mt-1">Rea is resting in the current reef.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-white hover:bg-stone-50 border border-[#E0E0D6] active:scale-95 transition rounded-xl text-[#2C3E2E] font-semibold text-sm shadow-sm"
                  id="btn_pause_restart"
                >
                  <RotateCcw size={16} />
                  <span>Restart</span>
                </button>
                <button
                  onClick={handlePauseToggle}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-4 bg-[#1A3A3A] hover:bg-[#2D5A5A] active:scale-95 transition rounded-xl text-white font-semibold text-sm shadow-md"
                  id="btn_pause_resume"
                >
                  <Play size={16} />
                  <span>Resume</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GAME OVER FAIL OVERLAY WINDOW */}
        {canvasState === 'gameover' && (
          <div className="absolute inset-0 bg-[#0D2121]/80 backdrop-blur-sm flex flex-col justify-center items-center z-25 text-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#F5F5F0] border-2 border-[#E0E0D6] p-8 rounded-[28px] max-w-sm w-full text-center space-y-6 shadow-xl">
              <div className="inline-flex p-4 rounded-full bg-red-50 border border-red-100 text-[#FF7F50]">
                <Flame size={36} className="animate-pulse" />
              </div>
              
              <div>
                <h3 className="text-2xl font-serif italic font-black text-[#FF7F50] tracking-tight">Run Failed</h3>
                <p className="text-[#5A5A40] text-sm mt-1.5 px-4 font-sans font-medium">
                  Rea crashed! Under the Deep Sea challenge, failing resets unlocked paths back to Depth 1.
                </p>
              </div>

              {/* Score summary panel */}
              <div className="bg-white border border-[#E0E0D6] py-3 px-4 rounded-2xl flex justify-between items-center text-sm shadow-sm text-[#2C3E2E]">
                <span className="text-[#5A5A40] font-medium font-sans">Final Run Score</span>
                <span className="font-mono font-bold text-[#FF7F50] text-lg">{hudScore} pts</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onBack}
                  className="py-2.5 px-4 bg-white hover:bg-stone-50 border border-[#E0E0D6]/90 active:scale-95 transition rounded-xl text-[#2C3E2E] font-semibold text-sm shadow-sm"
                  id="btn_fail_menu"
                >
                  Main Menu
                </button>
                {level.id === 1 ? (
                  <button
                    onClick={handleRestart}
                    className="py-2.5 px-4 bg-[#FF7F50] hover:bg-[#ff8f66] active:scale-95 shadow-md transition rounded-xl text-white font-bold text-sm"
                    id="btn_fail_retry"
                  >
                    Try Again
                  </button>
                ) : (
                  <button
                    onClick={onFailRestart}
                    className="py-2.5 px-4 bg-[#FF7F50] hover:bg-[#ff8f66] active:scale-95 shadow-md transition rounded-xl text-white font-bold text-xs"
                    id="btn_fail_restart_journey"
                    title="Start fresh from depth 1"
                  >
                    Restart Journey
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LEVEL CLEAR SUCCESS WINDOW */}
        {canvasState === 'levelsuccess' && (
          <div className="absolute inset-0 bg-[#0D2121]/80 backdrop-blur-sm flex flex-col justify-center items-center z-25 text-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#F5F5F0] border-2 border-[#E0E0D6] p-8 rounded-[28px] max-w-sm w-full text-center space-y-6 shadow-xl">
              <div className="inline-flex p-4 rounded-full bg-yellow-50 border border-yellow-250 text-[#D4AF37]">
                <Sparkles size={36} className="animate-bounce" />
              </div>
              
              <div>
                <span className="text-xs font-bold text-[#2D5A5A] uppercase tracking-widest bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Level Cleared!</span>
                <h3 className="text-2xl font-serif italic text-[#1A3A3A] font-extrabold mt-3 leading-tight">Excellent Swimming!</h3>
                <p className="text-[#5A5A40] text-sm mt-1 px-4">
                  Rea successfully navigated through {level.name}!
                </p>
              </div>

              <div className="space-y-2">
                <div className="bg-white border border-[#E0E0D6] py-2 px-4 rounded-xl flex justify-between items-center text-xs shadow-sm text-[#2C3E2E]">
                  <span className="text-[#5A5A40] font-medium font-sans">Swim Achievements</span>
                  <span className="font-bold text-[#2D5A5A]">100% Meters Done</span>
                </div>
                <div className="bg-white border border-[#E0E0D6] py-2.5 px-4 rounded-xl flex justify-between items-center text-sm shadow-sm text-[#2C3E2E]">
                  <span className="text-[#5A5A40] font-medium font-sans">Final Score</span>
                  <span className="font-mono font-bold text-[#FF7F50]">{hudScore} pts</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onBack}
                  className="py-2.5 px-4 bg-white hover:bg-stone-50 border border-[#E0E0D6] active:scale-95 transition rounded-xl text-[#2C3E2E] font-semibold text-sm shadow-sm"
                  id="btn_success_menu"
                >
                  Map Selector
                </button>
                <button
                  onClick={() => onSuccess(hudScore)}
                  className="py-2.5 px-4 bg-[#1A3A3A] hover:bg-[#2D5A5A] active:scale-95 shadow-md transition rounded-xl text-white font-bold text-sm flex justify-center items-center gap-1"
                  id="btn_success_continue"
                >
                  <span>Continue</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. SUB HUD CONTROLS BAR */}
      <div className="p-4 bg-[#F5F5F0] border-t border-[#E0E0D6] flex justify-between items-center text-xs text-[#5A5A40] z-10">
        <div className="flex items-center space-x-1.5 font-sans font-medium text-[#2C3E2E]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF7F50] animate-ping"></span>
          <span><strong>TAP / CLICK</strong> space, or hit <strong>SPACEBAR</strong> to swim Rea upward!</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 font-mono text-[#2C3E2E] font-medium">
            <span>Score:</span>
            <strong className="text-[#FF7F50] font-bold">{hudScore}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
