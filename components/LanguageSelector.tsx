
import React from 'react';
import { Language } from '../types';

interface Props {
  selected: Language;
  onSelect: (lang: Language) => void;
}

const languages: Language[] = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam'];

export const LanguageSelector: React.FC<Props> = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onSelect(lang)}
          className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-semibold ${
            selected === lang
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
};
