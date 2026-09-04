import React, { useState } from 'react';
import { Delete } from 'lucide-react';

interface GreekKeyboardProps {
  onInsert?: (char: string) => void;
  onInsertChar?: (char: string) => void;
  onDelete?: () => void;
  onBackspace?: () => void;
  onClear?: () => void;
}

export const GreekKeyboard: React.FC<GreekKeyboardProps> = ({
  onInsert,
  onInsertChar,
  onDelete,
  onBackspace,
  onClear,
}) => {
  const [activeTab, setActiveTab] = useState<'alphabet' | 'diacritics'>('alphabet');

  const handleInsert = (char: string) => {
    if (onInsert) {
      onInsert(char);
    } else if (onInsertChar) {
      onInsertChar(char);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else if (onBackspace) {
      onBackspace();
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  const baseRows = [
    ['ε', 'ρ', 'τ', 'υ', 'θ', 'ι', 'ο', 'π'],
    ['α', 'σ', 'δ', 'φ', 'γ', 'η', 'ξ', 'κ', 'λ'],
    ['ζ', 'χ', 'ψ', 'ω', 'β', 'ν', 'μ', 'ς']
  ];

  const diacriticsGrid = [
    { title: 'Острое (ὀξεῖα / acute)', chars: ['ά', 'έ', 'ή', 'ί', 'ό', 'ύ', 'ώ'] },
    { title: 'Тупое (βαρεῖα / grave)', chars: ['ὰ', 'ὲ', 'ὴ', 'ὶ', 'ὸ', 'ὺ', 'ὼ'] },
    { title: 'Облечённое (περισπωμένη / circumflex)', chars: ['ᾶ', 'ῆ', 'ῖ', 'ῦ', 'ῶ'] },
    { title: 'Густое придыхание [h] (δασεῖα)', chars: ['ἁ', 'ἑ', 'ἡ', 'ἱ', 'ὁ', 'ὑ', 'ὡ', 'ῥ'] },
    { title: 'Тонкое придыхание (ψιλή)', chars: ['ἀ', 'ἐ', 'ἠ', 'ἰ', 'ὀ', 'ὐ', 'ὠ'] },
    { title: 'Иота подписная (ὑπογεγραμμένη)', chars: ['ᾳ', 'ῃ', 'ῳ', 'ᾷ', 'ᾗ', 'ᾧ'] },
  ];

  return (
    <div className="bg-[#F9F7F2] border border-[#E5E1DA] p-3 text-[#1A1A1A] select-none shadow-xs">
      <div className="flex items-center justify-between border-b border-[#E5E1DA] pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('alphabet')}
            className={`text-xs font-sans uppercase tracking-wider px-3 py-1 border transition-colors ${
              activeTab === 'alphabet'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white text-[#6B655C] border-[#E5E1DA] hover:border-[#1A1A1A]'
            }`}
          >
            Алфавит Койне
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diacritics')}
            className={`text-xs font-sans uppercase tracking-wider px-3 py-1 border transition-colors ${
              activeTab === 'diacritics'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white text-[#6B655C] border-[#E5E1DA] hover:border-[#1A1A1A]'
            }`}
          >
            Диакритика & Ударения
          </button>
        </div>
        <span className="text-[10px] font-sans text-[#8C7D6B] uppercase tracking-widest hidden sm:inline">
          Клавиатура Койне
        </span>
      </div>

      {activeTab === 'alphabet' ? (
        <div className="space-y-1 sm:space-y-1.5 touch-manipulation">
          {baseRows.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5 w-full">
              {row.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleInsert(letter)}
                  className="h-9 sm:h-10 min-w-7 sm:min-w-10 flex-1 max-w-10 px-1 sm:px-2 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-[#FAF8F5] active:bg-[#1A1A1A] active:text-white font-serif text-lg sm:text-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer touch-manipulation rounded-xs"
                >
                  {letter}
                </button>
              ))}
            </div>
          ))}

          <div className="flex justify-center gap-2 pt-1 border-t border-[#E5E1DA]/60 mt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-sans text-[#6B655C] hover:text-[#1A1A1A] border border-[#E5E1DA] bg-white hover:bg-[#FAF8F5]"
            >
              Очистить
            </button>
            <button
              type="button"
              onClick={() => handleInsert(' ')}
              className="flex-1 max-w-xs py-1.5 text-xs font-sans uppercase tracking-widest text-[#4A443D] border border-[#E5E1DA] bg-white hover:bg-[#FAF8F5] hover:border-[#1A1A1A]"
            >
              Пробел
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-1.5 text-xs font-sans border border-[#E5E1DA] bg-white hover:bg-[#FAF8F5] hover:border-[#1A1A1A] flex items-center gap-1"
              title="Удалить символ"
            >
              <Delete className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Стереть</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
          {diacriticsGrid.map((group, gIdx) => (
            <div key={gIdx} className="bg-white p-2 border border-[#E5E1DA]">
              <p className="text-[10px] font-sans uppercase tracking-wider text-[#8C7D6B] mb-1.5">
                {group.title}
              </p>
              <div className="flex flex-wrap gap-1">
                {group.chars.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleInsert(ch)}
                    className="w-9 h-9 bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white font-serif text-lg transition-all flex items-center justify-center cursor-pointer"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
