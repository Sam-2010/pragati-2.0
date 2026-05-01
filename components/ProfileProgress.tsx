"use client";

import React, { useEffect, useState } from 'react';
import { calculateProgress } from '@/lib/usePersistedForm';

export function ProfileProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      // Gather data fragments from all dashboard tabs
      const profile = JSON.parse(localStorage.getItem('farmer_profile') || '{}');
      const bank = JSON.parse(localStorage.getItem('farmer_bank') || '{}');
      const land = JSON.parse(localStorage.getItem('farmer_land') || '{}');
      
      // Combine and calculate
      const combinedData = { ...profile, ...bank, ...land };
      setProgress(calculateProgress(combinedData));
    };

    // Initial load
    updateProgress();

    // Listen for custom events from our hook
    window.addEventListener('formProgressUpdate', updateProgress);
    
    // Fallback: Listen for storage events (if user updates data in another browser tab)
    window.addEventListener('storage', updateProgress);

    return () => {
      window.removeEventListener('formProgressUpdate', updateProgress);
      window.removeEventListener('storage', updateProgress);
    };
  }, []);

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-[13px] font-bold text-gray-700">Profile Completeness</span>
        <span className="text-sm font-black text-[#1B4332]">{progress}%</span>
      </div>
      
      {/* Container */}
      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden shadow-inner">
        {/* Animated Bar with Gradient */}
        <div 
          className="bg-gradient-to-r from-[#1B4332] to-[#52B788] h-full rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Subtle shimmer animation overlay */}
          <div className="absolute inset-0 bg-white/10 w-full h-full -skew-x-12" />
        </div>
      </div>
    </div>
  );
}
