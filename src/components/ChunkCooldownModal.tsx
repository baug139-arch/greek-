import React from 'react';
import { Lock, RotateCcw, ArrowRight, X, Clock, Brain } from 'lucide-react';

interface ChunkCooldownModalProps {
  isOpen: boolean;
  chunkTitle: string;
  sectionName: string;
  currentStage: number; // 0-based: 0 (1-й этап), 1 (2-й этап), 2 (3-й этап)
  nextStage: number; // 0-based: 1 (2-й этап), 2 (3-й этап)
  cooldownText: string;
  cooldownLabel: string;
  hasNextChunk?: boolean;
  nextChunkTitle?: string;
  onRepeatCurrentStage: () => void;
  onLearnNextChunk?: () => void;
  onClose: () => void;
}

export const ChunkCooldownModal: React.FC<ChunkCooldownModalProps> = ({
  isOpen,
  chunkTitle,
  sectionName,
  currentStage,
  nextStage,
  cooldownText,
  cooldownLabel,
  hasNextChunk = false,
  nextChunkTitle = 'Следующая порция',
  onRepeatCurrentStage,
  onLearnNextChunk,
  onClose,
}) => {
  if (!isOpen) return null;

  const currentStageName = currentStage === 0 ? '1-й этап (Полный)' : currentStage === 1 ? '2-й этап (Закрепление)' : '3-й этап (Экспресс)';
  const nextStageName = nextStage === 1 ? '2-й этап (Закрепление)' : '3-й этап (Экспресс-контроль)';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border-2 border-[#1A1A1A] max-w-lg w-full shadow-2xl overflow-hidden flex flex-col rounded-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#E5E1DA] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#8C5E14] text-white rounded-xs flex items-center justify-center">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
                Интервальная пауза памяти
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1A1A1A]">
              {nextStageName} заблокирован 🔒
            </h3>
            <p className="text-xs font-sans text-[#6B655C]">
              {sectionName} • {chunkTitle}
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

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Countdown timer card */}
          <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xs space-y-2 text-center">
            <span className="text-xs font-sans uppercase tracking-wider text-amber-900 font-bold block">
              До открытия {nextStageName} осталось:
            </span>
            <div className="text-3xl sm:text-4xl font-serif font-bold text-[#8C5E14] flex items-center justify-center gap-2">
              <Clock className="w-7 h-7 animate-pulse text-amber-600" />
              <span>{cooldownText}</span>
            </div>
            <p className="text-[11px] font-sans text-amber-900/80">
              Необходимый интервал закрепления: <strong>{cooldownLabel}</strong>
            </p>
          </div>

          {/* Explanation */}
          <div className="flex items-start gap-2.5 p-3 bg-[#FAF8F5] border border-[#E5E1DA] text-xs font-sans text-[#5C5549] leading-relaxed rounded-xs">
            <Brain className="w-4 h-4 text-[#2D4A32] shrink-0 mt-0.5" />
            <p>
              По методике интервального повторения Эббингауза мозгу необходима пауза для перехода слов в долговременную память. Немедленное прохождение всех этапов подряд разрушает прочность запоминания.
            </p>
          </div>

          {/* Action choices */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-sans uppercase tracking-wider font-bold text-[#1A1A1A] block">
              Что вы хотите сделать?
            </span>

            {/* Option A: Repeat current stage */}
            <button
              type="button"
              onClick={onRepeatCurrentStage}
              className="w-full p-3.5 bg-white border-2 border-[#1A1A1A] hover:bg-[#FAF8F5] text-left transition-all cursor-pointer rounded-xs flex items-center justify-between group shadow-2xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-sans text-sm font-bold text-[#1A1A1A]">
                  <RotateCcw className="w-4 h-4 text-[#2D4A32] group-hover:rotate-[-45deg] transition-transform" />
                  <span>Повторить {currentStageName} заново</span>
                </div>
                <p className="text-[11px] font-sans text-[#6B655C]">
                  Освежить и отработать те же слова ещё раз (таймер 2-го этапа продолжит идти)
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8C7D6B] group-hover:text-[#1A1A1A] shrink-0 ml-2" />
            </button>

            {/* Option B: Learn next chunk if available */}
            {hasNextChunk && onLearnNextChunk && (
              <button
                type="button"
                onClick={onLearnNextChunk}
                className="w-full p-3.5 bg-[#1A1A1A] hover:bg-[#2C3E50] text-white text-left transition-all cursor-pointer rounded-xs flex items-center justify-between group shadow-2xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-sans text-sm font-bold text-white">
                    <span>Учить {nextChunkTitle}</span>
                  </div>
                  <p className="text-[11px] font-sans text-[#FAF8F5]/80">
                    Пока идёт таймер, перейдите к следующей порции новых слов
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-white shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[#FAF8F5] border-t border-[#E5E1DA] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs font-sans uppercase tracking-wider text-[#6B655C] hover:text-[#1A1A1A] font-bold transition-colors cursor-pointer rounded-xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
