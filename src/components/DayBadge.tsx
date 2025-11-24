import React from 'react';
import { CheckCircle } from 'lucide-react';

export const DayBadge = ({ day, completed }: { day: string, completed: boolean }) => (
  <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${completed ? 'scale-110' : 'opacity-70'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm transition-colors ${completed ? 'bg-love-500 border-love-600 text-white' : 'bg-white border-love-200 text-love-300'}`}>
      {completed ? <CheckCircle size={18} /> : <div className="w-3 h-3 rounded-full bg-love-100" />}
    </div>
    <span className="text-xs font-semibold text-love-800 uppercase tracking-wider">{day}</span>
  </div>
);
