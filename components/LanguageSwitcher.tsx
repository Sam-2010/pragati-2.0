"use client";

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
          language === 'en'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('mr')}
        className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
          language === 'mr'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        मराठी
      </button>
    </div>
  );
};

export const LanguageSwitcherMinimal: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
    >
      <Globe size={14} className="text-slate-400 group-hover:text-emerald-600" />
      <span className="text-[10px] font-bold text-slate-600 group-hover:text-emerald-700 uppercase tracking-wider">
        {language === 'en' ? 'मराठी' : 'English'}
      </span>
    </button>
  );
};
