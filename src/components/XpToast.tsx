'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface XpToastProps {
  xpGained: number;
  leveledUp: boolean;
  newLevel?: number;
  onClose: () => void;
}

export const XpToast = ({ xpGained, leveledUp, newLevel, onClose }: XpToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const enterTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto close after 3 seconds
    const closeTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 500);
    }, 3000);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-x-4 top-4 sm:top-6 sm:right-6 sm:left-auto z-50 pointer-events-none">
      <div
        className={`
          transform transition-all duration-500 ease-out w-full sm:w-[320px]
          ${isVisible && !isExiting ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        `}
      >
        {/* XP Gained Toast */}
        <div className="relative bg-gradient-to-r from-love-500 to-love-600 text-white px-4 py-3 rounded-2xl shadow-2xl mb-3 pointer-events-auto border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">Experiência Ganha</p>
              <p className="text-2xl font-bold">+{xpGained} XP</p>
            </div>
          </div>
        </div>

        {/* Level Up Toast */}
        {leveledUp && newLevel && (
          <div 
            className={`
              relative bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-3 rounded-2xl shadow-2xl pointer-events-auto border border-white/30
              transform transition-all duration-500 delay-300
              ${isVisible && !isExiting ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Subiu de Nível!</p>
                <p className="text-2xl font-bold">Nível {newLevel}</p>
              </div>
            </div>
            <div className="absolute -top-1 -right-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


