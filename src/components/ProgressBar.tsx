import React from 'react';

export const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-love-200 rounded-full h-4 relative overflow-hidden shadow-inner">
    <div 
      className="bg-gradient-to-r from-love-400 to-love-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
      style={{ width: `${progress}%` }}
    >
      {progress > 10 && <span className="text-[10px] text-white font-bold">{progress}%</span>}
    </div>
    <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20 animate-pulse"></div>
  </div>
);
