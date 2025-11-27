'use client';

import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  level: number;
  xp: number;
  maxXp: number;
  animate?: boolean;
}

export const ProgressBar = ({ level, xp, maxXp, animate = false }: ProgressBarProps) => {
  const [displayXp, setDisplayXp] = useState(animate ? 0 : xp);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const percentage = maxXp > 0 ? Math.min((displayXp / maxXp) * 100, 100) : 0;

  useEffect(() => {
    if (animate && displayXp !== xp) {
      setIsAnimating(true);
      const duration = 1000;
      const steps = 30;
      const increment = (xp - displayXp) / steps;
      let current = displayXp;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;
        if (step >= steps) {
          setDisplayXp(xp);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayXp(Math.round(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else if (!animate) {
      setDisplayXp(xp);
    }
  }, [xp, animate, displayXp]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] sm:text-xs font-bold text-love-700 ${isAnimating ? 'animate-pulse' : ''}`}>
          Nv. {level}
        </span>
        <span className={`text-[10px] sm:text-xs font-semibold text-love-600 ${isAnimating ? 'animate-pulse' : ''}`}>
          {displayXp}/{maxXp} XP
        </span>
      </div>
      <div className="w-full bg-love-200 rounded-full h-3 sm:h-4 relative overflow-hidden shadow-inner">
        <div 
          className={`bg-gradient-to-r from-love-400 via-love-500 to-love-600 h-full rounded-full transition-all duration-700 ease-out ${isAnimating ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
