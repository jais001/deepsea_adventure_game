import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import { LevelConfig } from './types';
import { LEVELS } from './data/levels';
import { Waves, Heart, Sparkles, HelpCircle } from 'lucide-react';

export default function App() {
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig | null>(null);

  // When a level is successfully completed, progress is saved in local storage,
  // and we proceed to next level or return back
  const handleLevelSuccess = (levelId: number, score: number) => {
    // If there is a next level, transition into it!
    const nextLevelId = levelId + 1;
    const nextLevel = LEVELS.find((l) => l.id === nextLevelId);
    
    if (nextLevel) {
      setSelectedLevel(nextLevel);
    } else {
      setSelectedLevel(null); // End of game! Back to menu
    }
  };

  const handleLevelGameOver = () => {
    localStorage.setItem('rea_unlocked_level', '1');
    setSelectedLevel(null);
  };

  const handleFailRestart = () => {
    localStorage.setItem('rea_unlocked_level', '1');
    setSelectedLevel(LEVELS[0]); // Boot Level 1 immediately 
  };

  return (
    <main className="min-h-screen w-full bg-[#F5F5F0] text-[#2C3E2E] flex flex-col justify-between overflow-x-hidden relative">
      
      {/* Soft natural ambient background layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#ffffff,_#F5F5F0)] pointer-events-none z-0 opacity-80"></div>
      
      {/* 1. COMPACT AESTHETIC REA NAV BAR */}
      <header className="w-full max-w-4xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-[#FF7F50] rounded-xl shadow-md text-white">
            <Waves size={18} />
          </div>
          <div>
            <span className="text-xs text-[#5A5A40] font-semibold uppercase tracking-wider block leading-none">Tiny Reef</span>
            <strong className="text-sm font-serif italic font-extrabold text-[#1A3A3A]">Rea's Swim Quest</strong>
          </div>
        </div>

        {selectedLevel && (
          <div className="flex items-center space-x-2 bg-white border border-[#E0E0D6] px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm text-[#2C3E2E]">
            <span className="w-2 h-2 rounded-full bg-[#FF7F50] animate-pulse" style={{ animationDuration: '2s' }}></span>
            <span className="text-[#5A5A40]">Depth: <strong>0{selectedLevel.id}</strong></span>
          </div>
        )}
      </header>

      {/* 2. CHIEF PRIMARY INTERACTIVE GRID ZONE */}
      <section className="flex-1 w-full max-w-4xl mx-auto px-6 flex flex-col justify-center z-10 py-2">
        {selectedLevel ? (
          <GameCanvas
            level={selectedLevel}
            onBack={() => setSelectedLevel(null)}
            onSuccess={(score) => handleLevelSuccess(selectedLevel.id, score)}
            onGameOver={handleLevelGameOver}
            onFailRestart={handleFailRestart}
          />
        ) : (
          <MainMenu onSelectLevel={(lvl) => setSelectedLevel(lvl)} />
        )}
      </section>

      {/* 3. UNDERWATER CREDITS FOOTER PANEL */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-6 border-t border-[#E0E0D6] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#5A5A40] z-10 gap-3">
        <div className="flex items-center gap-1.5">
          <span>Rea's Deep Sea Swimming © 2026. Designed with</span>
          <Heart size={10} className="text-[#FF7F50] fill-[#FF7F50]" />
          <span>for arcade enthusiasts.</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-[#2C3E2E]">
            <Sparkles size={11} className="text-[#D4AF37]" />
            Active feeds trigger bubble shield
          </span>
        </div>
      </footer>
    </main>
  );
}
