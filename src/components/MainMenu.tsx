import React, { useState, useEffect } from 'react';
import { LevelConfig } from '../types';
import { LEVELS } from '../data/levels';
import { Sparkles, Gamepad2, Shield, Heart, HelpCircle, Trophy, Waves, Flame, Award, ChevronRight, Lock } from 'lucide-react';

interface MainMenuProps {
  onSelectLevel: (level: LevelConfig) => void;
}

export default function MainMenu({ onSelectLevel }: MainMenuProps) {
  const [unlockedCount, setUnlockedCount] = useState<number>(1);
  const [scores, setScores] = useState<{ [levelId: number]: number }>({});
  const [showHowTo, setShowHowTo] = useState<boolean>(false);

  // Load progress on mount
  useEffect(() => {
    const savedLevel = localStorage.getItem('rea_unlocked_level');
    if (savedLevel) {
      setUnlockedCount(parseInt(savedLevel));
    } else {
      localStorage.setItem('rea_unlocked_level', '1');
    }

    const savedScoresStr = localStorage.getItem('rea_scores');
    if (savedScoresStr) {
      try {
        setScores(JSON.parse(savedScoresStr));
      } catch (e) {
        console.error('Failed to parse high scores', e);
      }
    }
  }, []);

  const resetAllProgress = () => {
    if (window.confirm("Are you sure you want to reset all unlocked levels and high scores?")) {
      localStorage.setItem('rea_unlocked_level', '1');
      localStorage.setItem('rea_scores', '{}');
      setUnlockedCount(1);
      setScores({});
    }
  };

  const totalHighScore = (Object.values(scores) as number[]).reduce((sum, val) => sum + val, 0);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 font-sans pb-12 text-[#2C3E2E]">
      {/* 1. HERO GREETINGS CARD WITH FLOATING JUMPING REA */}
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#102D2D] via-[#1A3A3A] to-[#112F2C] border-[10px] border-white text-white p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 transition-all duration-300">
        
        {/* Undersea ambient shapes absolute floating behind */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF7F50]/10 rounded-full filter blur-3xl -mr-20 -mt-20 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#2D5A5A]/30 rounded-full filter blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

        <div className="space-y-4 max-w-lg z-10 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#E0E0D6] backdrop-blur-md">
              <Waves size={12} className="animate-spin text-[#FF7F50]" style={{ animationDuration: '6s' }} />
              <span>Undersea Quest</span>
            </div>
            
            <div className="inline-flex items-center space-x-1.5 bg-red-500/10 border border-red-500/25 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#FF8F66] backdrop-blur-md animate-pulse">
              <Flame size={12} className="text-[#FF7F50]" />
              <span>Permadeath Mode Enabled</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5.5xl font-serif text-white tracking-tight leading-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            Rea’s <span className="italic font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#FF7F50] via-[#FFD299] to-[#FF7F50] filter drop-shadow-[0_0_12px_rgba(255,127,80,0.2)]">Deep Sea</span> Journey
          </h1>
          
          <p className="text-sm md:text-base text-teal-100 font-medium leading-relaxed max-w-md">
            Help <strong className="text-white underline decoration-[#FF7F50] underline-offset-4 font-bold">Rea</strong> swim across 8 depths. Be careful: hitting too many reefs or jellyfish resets your journey back to Depth 1!
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
            <button
              onClick={() => setShowHowTo(true)}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/15 text-white border border-white/10 hover:border-white/25 font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
              id="btn_how_to_play"
            >
              <HelpCircle size={15} className="text-[#FF7F50]" />
              How to Play Guide
            </button>
            <button
              onClick={() => {
                const targetLvl = LEVELS.find(l => l.id === Math.min(unlockedCount, 8)) || LEVELS[0];
                onSelectLevel(targetLvl);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF7F50] to-[#ffaa66] hover:from-[#ff8f66] hover:to-[#ffbb77] hover:shadow-lg hover:shadow-orange-500/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-black/25"
              id="btn_quick_start"
            >
              <Gamepad2 size={15} />
              Begin Adventure [Lvl {Math.min(unlockedCount, 8)}]
            </button>
          </div>
        </div>

        {/* REA FLOATING DISPLAY CANVAS GRAPHIC */}
        <div className="relative flex justify-center items-center w-40 h-40 bg-[#0D2121]/50 backdrop-blur-sm rounded-full border border-white/10 shadow-inner p-4 animate-float">
          
          {/* Bubbles particle emulation */}
          <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '3s' }}></div>
          <div className="absolute bottom-6 left-5 w-3 h-3 rounded-full bg-white/15 animate-pulse" style={{ animationDuration: '4s' }}></div>

          {/* SVG representation of Rea for design polish */}
          <svg viewBox="0 0 100 100" className="w-28 h-28 transform scale-x-[-1] animate-wave">
            {/* Tail */}
            <path d="M70 50 C80 34 85 24 82 18 L76 50 L82 82 C85 76 80 66 70 50" fill="#f59e0b" stroke="#d97706" strokeWidth="2.5" />
            <path d="M70 50 C76 40 78 32 75 28 L72 50 L75 72 C78 68 76 60 70 50" fill="#fb923c" />
            
            {/* Body */}
            <ellipse cx="40" cy="50" rx="26" ry="19" fill="url(#body_orange_grad)" stroke="#c2410c" strokeWidth="3" />
            
            <defs>
              <linearGradient id="body_orange_grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="40%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>

            {/* White stripe */}
            <path d="M35 32 C41 32 40 68 35 68 C38 68 39 32 35 32" fill="#ffffff" stroke="#c2410c" strokeWidth="1" />
            
            {/* Big Eye */}
            <circle cx="24" cy="44" r="7.5" fill="#ffffff" />
            <circle cx="21" cy="44" r="3.8" fill="#0f172a" />
            <circle cx="20" cy="42" r="1.5" fill="#ffffff" />

            {/* Mouth */}
            <path d="M12 55 Q18 60 22 55" fill="none" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />

            {/* Side Fin */}
            <ellipse cx="42" cy="55" rx="6" ry="8" transform="rotate(20 42 55)" fill="#fb923c" stroke="#c2410c" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* 2. PLAYER STATS STATISTIC SLOTS MAP */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E0E0D6] p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="p-3.5 bg-[#F5F5F0] text-[#1A3A3A] rounded-xl border border-[#E0E0D6]">
            <Trophy size={18} className="text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[10px] text-[#5A5A40] uppercase tracking-widest font-bold font-mono">Sum Highscore</p>
            <h4 className="text-xl font-extrabold text-[#1A3A3A] font-mono">{totalHighScore} <span className="text-xs text-[#5A5A40] font-sans">pts</span></h4>
          </div>
        </div>

        <div className="bg-white border border-[#E0E0D6] p-5 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="p-3.5 bg-[#F5F5F0] text-[#1A3A3A] rounded-xl border border-[#E0E0D6]">
            <Award size={18} className="text-[#FF7F50]" />
          </div>
          <div>
            <p className="text-[10px] text-[#5A5A40] uppercase tracking-widest font-bold font-mono">Max Depth sector</p>
            <h4 className="text-xl font-extrabold text-[#1A3A3A]">Level {Math.min(unlockedCount, 8)} <span className="text-xs text-[#5A5A40] font-sans">/ 8</span></h4>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white border border-[#E0E0D6] p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-[#F5F5F0] text-[#1A3A3A] rounded-xl border border-[#E0E0D6]">
              <Shield size={18} className="text-[#2D5A5A]" />
            </div>
            <div>
              <p className="text-[10px] text-[#5A5A40] uppercase tracking-widest font-bold font-mono">Golden shield</p>
              <h4 className="text-xs font-semibold text-[#2C3E2E] mt-0.5">Catch pellets to shield up</h4>
            </div>
          </div>
          <button 
            onClick={resetAllProgress}
            className="text-[10px] text-[#5A5A40] hover:text-[#FF7F50] font-semibold uppercase hover:bg-red-50/70 border border-[#E0E0D6] px-3 py-1.5 transition rounded-lg"
            id="btn_reset_game"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* 3. 8 LEVELS LEVEL-MAP NAVIGATION GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E0E0D6] pb-2.5">
          <h2 className="text-lg font-bold font-serif italic text-[#1A3A3A] flex items-center gap-2">
            <Waves className="text-[#2D5A5A]" size={20} />
            Deep Sea Journeys Selector
          </h2>
          <span className="text-xs text-[#5A5A40] font-semibold bg-white px-3 py-1 rounded-full border border-[#E0E0D6] shadow-sm">
            Complete paths to unlock depths
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEVELS.map((level) => {
            const isUnlocked = level.id <= unlockedCount;
            const highscore = scores[level.id] || 0;

            return (
              <div
                key={level.id}
                onClick={isUnlocked ? () => onSelectLevel(level) : undefined}
                className={`group relative rounded-2xl p-5 border overflow-hidden transition-all duration-300 ${
                  isUnlocked 
                    ? 'bg-white hover:bg-[#FDFDFB] border-[#E0E0D6] hover:border-[#FF7F50]/60 hover:shadow-md cursor-pointer transform hover:-translate-y-1' 
                    : 'bg-[#E8E8E0]/40 border-[#E0E0D6] opacity-65 cursor-not-allowed select-none'
                }`}
                style={{ contentVisibility: 'auto' }}
              >
                {/* Visual ambient natural tone stripe decoration */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  level.id <= 2 
                    ? 'bg-[#FF7F50]' 
                    : level.id <= 5 
                    ? 'bg-[#2D5A5A]' 
                    : 'bg-[#D4AF37]'
                }`}></div>

                <div className="flex justify-between items-start pt-1.5 mb-2">
                  <span className="text-[10px] font-mono font-bold text-[#5A5A40]">DEPTH 0{level.id}</span>
                  
                  {isUnlocked ? (
                    highscore > 0 ? (
                      <span className="text-[10px] bg-[#F5F5F0] border border-[#E0E0D6] text-[#D4AF37] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                        <Trophy size={10} />
                        {highscore}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-[#E8E8E0] text-[#1A3A3A] font-extrabold px-2 py-0.5 rounded-md">
                        UNLOCKED
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 p-0.5" title="Completed prior depth to enter">
                      <Lock size={13} className="text-slate-400" />
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <h3 className={`font-serif italic text-base group-hover:text-[#FF7F50] transition ${
                    isUnlocked ? 'text-[#1A3A3A] font-extrabold' : 'text-slate-400'
                  }`}>
                    {level.name}
                  </h3>
                  <p className="text-[11px] text-[#5A5A40] leading-snug line-clamp-2 h-8">
                    {level.description}
                  </p>
                </div>

                {/* Level details / configuration metrics footer */}
                <div className="mt-4 pt-3 border-t border-[#E0E0D6] grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-[#5A5A40] block">Flow Speed</span>
                    <span className={`font-semibold ${isUnlocked ? 'text-[#2C3E2E]' : 'text-slate-400'}`}>{level.speed} kn</span>
                  </div>
                  <div>
                    <span className="text-[#5A5A40] block">Gap Size</span>
                    <span className={`font-semibold ${isUnlocked ? 'text-[#2C3E2E]' : 'text-slate-400'}`}>{level.gapSize}m</span>
                  </div>
                </div>

                {isUnlocked && (
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition duration-300 transform translate-x-1 group-hover:translate-x-0 text-[#FF7F50]">
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. "HOW TO PLAY" INSTRUCTIONAL MODAL DIALOG POPUP */}
      {showHowTo && (
        <div className="fixed inset-0 bg-[#0D2121]/75 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all duration-300 animate-fade-in">
          <div className="bg-[#F5F5F0] border-2 border-[#E0E0D6] rounded-3xl p-6 md:p-8 max-w-lg w-full text-[#2C3E2E] space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowHowTo(false)}
              className="absolute top-4 right-4 text-[#5A5A40] hover:text-[#1A3A3A] p-2 hover:bg-white/50 rounded-xl transition font-bold"
              aria-label="Close Guide dialog"
              id="btn_close_guide"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 border-b border-[#E0E0D6] pb-4">
              <div className="p-2.5 bg-[#1A3A3A] text-white rounded-2xl">
                <Gamepad2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif italic text-[#1A3A3A] leading-tight">Adventure Swimming Guide</h3>
                <p className="text-xs text-[#5A5A40]">Help Rea make her way through the currents!</p>
              </div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-[#2C3E2E]">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#1A3A3A] flex items-center justify-center font-mono font-bold text-white shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-[#1A3A3A] mb-0.5 font-serif">Main Swim Controls</h4>
                  <p>Tap your screen/canvas or hit the <kbd className="bg-white px-1.5 py-0.5 rounded font-mono text-[10px] border border-[#E0E0D6] shadow-sm">Spacebar</kbd> / <kbd className="bg-white px-1.5 py-0.5 rounded font-mono text-[10px] border border-[#E0E0D6] shadow-sm">Up Arrow</kbd> to flap Rea upwards. Gravity and sea drag pull her down continuously.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#1A3A3A] flex items-center justify-center font-mono font-bold text-white shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-[#1A3A3A] mb-0.5 font-serif">Obstacle Threats</h4>
                  <p>Steer clear of pink reef corals, heavy rocks, moving jellyfish columns, and deep sea mines. Hitting them takes away <strong>1 life</strong>. Each journey begins with <strong>3 lives</strong>!</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#2D5A5A] flex items-center justify-center font-mono font-bold text-white shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-[#FF7F50] mb-0.5 font-serif">Golden Bubble Shield</h4>
                  <p>Glowing green food pellets randomly float in of sea gaps! Colliding with a pellet automatically triggers an instant <strong>4.0-second Golden Shield</strong>. While protected, Rea can crash right through any coral structure or jellyfish without taking damage!</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-[#2D5A5A] flex items-center justify-center font-mono font-bold text-white shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-[#1A3A3A] mb-0.5 font-serif">Current Shifting Danger</h4>
                  <p>Swim all the way to 100% distance to open up the next oceanic sector. Watch out in depths 5 and 7—strong vertical currents sway Rea up and down!</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E0E0D6]">
              <button
                onClick={() => setShowHowTo(false)}
                className="w-full py-2.5 bg-[#1A3A3A] hover:bg-[#2D5A5A] transition shadow-md font-bold text-xs rounded-xl text-white"
                id="btn_got_it"
              >
                Let’s Swim!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
