import React, { useState } from 'react';
import { TrainingMode, TrainingDirection } from '../types';
import { X, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

interface FullModuleModalProps {
  isOpen: boolean;
  title: string;
  wordsCount: number;
  initialMode?: TrainingMode;
  initialDirection?: TrainingDirection;
  onClose: () => void;
  onStart: (mode: TrainingMode, direction: TrainingDirection) => void;
}

interface ModeOption {
  id: TrainingMode;
  name: string;
  desc: string;
  badge?: string;
  icon: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'quiz',
    name: 'Тест (4 варианта)',
    desc: 'Быстрая и эффективная проверка перевода всех слов модуля.',
    badge: 'Рекомендуется',
    icon: '🎯',
  },
  {
    id: 'flashcards',
    name: 'Флеш-карточки',
    desc: 'Быстрый последовательный просмотр карточек с озвучкой и мнемониками.',
    icon: '📇',
  },
  {
    id: 'typing',
    name: 'Письменный ввод',
    desc: 'Печать русского перевода с клавиатуры для глубокого запоминания.',
    icon: '✍️',
  },
  {
    id: 'builder',
    name: 'Конструктор слов',
    desc: 'Сборка греческих слов из рассыпанных букв по памяти.',
    icon: '🧩',
  },
  {
    id: 'audio',
    name: 'Аудио-восприятие',
    desc: 'Распознавание эразмова чтения на слух без опоры на текст.',
    icon: '🎧',
  },
  {
    id: 'all',
    name: 'Все упражнения (Комплекс)',
    desc: 'Глубокий разносторонний цикл со всеми форматами заданий.',
    icon: '🌟',
  },
];

export const FullModuleModal: React.FC<FullModuleModalProps> = ({
  isOpen,
  title,
  wordsCount,
  initialMode = 'quiz',
  initialDirection = 'bidirectional',
  onClose,
  onStart,
}) => {
  const [selectedMode, setSelectedMode] = useState<TrainingMode>(initialMode);
  const [selectedDirection, setSelectedDirection] = useState<TrainingDirection>(initialDirection);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border-2 border-[#1A1A1A] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#E5E1DA] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-amber-500 text-white rounded-xs">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </span>
              <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
                Сквозное повторение модуля
              </span>
              <span className="text-[10px] font-sans font-bold bg-[#1A1A1A] text-white px-2 py-0.5 rounded-xs">
                {wordsCount} слов
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1A1A1A]">
              {title}
            </h3>
            <p className="text-xs font-sans text-[#6B655C]">
              Все {wordsCount} слов будут объединены в одну непрерывную тренировку без разбивки на мелкие порции.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-[#E5E1DA] rounded transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* 1. Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-sans uppercase tracking-wider font-bold text-[#1A1A1A] block">
              1. Выберите режим тренировки:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODE_OPTIONS.map((opt) => {
                const isSelected = selectedMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedMode(opt.id)}
                    className={`p-3 text-left border transition-all cursor-pointer rounded-xs flex flex-col justify-between relative ${
                      isSelected
                        ? 'border-[#1A1A1A] bg-[#FAF8F5] ring-2 ring-[#1A1A1A]'
                        : 'border-[#E5E1DA] bg-white hover:border-[#8C7D6B] hover:bg-[#FAF8F5]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-sm font-sans font-bold text-[#1A1A1A] flex items-center gap-1.5">
                          <span>{opt.icon}</span>
                          <span>{opt.name}</span>
                        </span>
                        {opt.badge && (
                          <span className="text-[9px] font-sans font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-xs">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-sans text-[#6B655C] leading-snug">
                        {opt.desc}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="mt-2 flex justify-end">
                        <CheckCircle2 className="w-4 h-4 text-[#2D4A32]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Direction Selection */}
          <div className="space-y-2 pt-2 border-t border-[#E5E1DA]">
            <label className="text-xs font-sans uppercase tracking-wider font-bold text-[#1A1A1A] block">
              2. Направление перевода:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDirection('bidirectional')}
                className={`p-2.5 text-center text-xs font-sans font-medium border transition-colors cursor-pointer rounded-xs ${
                  selectedDirection === 'bidirectional'
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold'
                    : 'border-[#E5E1DA] bg-white text-[#1A1A1A] hover:border-[#8C7D6B]'
                }`}
              >
                <span className="block text-sm mb-0.5">⇄</span>
                <span>Двусторонний</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDirection('greek_to_ru')}
                className={`p-2.5 text-center text-xs font-sans font-medium border transition-colors cursor-pointer rounded-xs ${
                  selectedDirection === 'greek_to_ru'
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold'
                    : 'border-[#E5E1DA] bg-white text-[#1A1A1A] hover:border-[#8C7D6B]'
                }`}
              >
                <span className="block text-sm mb-0.5">🇬🇷 ➔ 🇷🇺</span>
                <span>Грек ➔ Рус</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDirection('ru_to_greek')}
                className={`p-2.5 text-center text-xs font-sans font-medium border transition-colors cursor-pointer rounded-xs ${
                  selectedDirection === 'ru_to_greek'
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold'
                    : 'border-[#E5E1DA] bg-white text-[#1A1A1A] hover:border-[#8C7D6B]'
                }`}
              >
                <span className="block text-sm mb-0.5">🇷🇺 ➔ 🇬🇷</span>
                <span>Рус ➔ Грек</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-t border-[#E5E1DA] flex flex-col sm:flex-row justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs font-sans uppercase tracking-wider text-[#6B655C] hover:text-[#1A1A1A] font-bold transition-colors cursor-pointer text-center"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => onStart(selectedMode, selectedDirection)}
            className="px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase tracking-widest font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Начать тренировку ({wordsCount} слов)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
