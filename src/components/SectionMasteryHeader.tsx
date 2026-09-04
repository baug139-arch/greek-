import React from 'react';
import { SectionProgressStats, getMasteryBadgeConfig } from '../utils/srsEngine';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface SectionMasteryHeaderProps {
  title: string;
  subtitle?: string;
  stats: SectionProgressStats;
  onQuickPractice?: () => void;
  practiceButtonText?: string;
}

export const SectionMasteryHeader: React.FC<SectionMasteryHeaderProps> = ({
  title,
  subtitle,
  stats,
  onQuickPractice,
  practiceButtonText = 'Заучивать раздел',
}) => {
  const badge = getMasteryBadgeConfig(stats.averageMasteryPercent);

  return (
    <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-[#E5E1DA] space-y-3 shadow-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
              Шкала усвоения раздела
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.badgeBg} ${badge.textColor} ${badge.borderColor}`}>
              {stats.averageMasteryPercent}% выучено
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-serif text-[#1A1A1A] mt-0.5 font-bold">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs font-sans text-[#6B655C] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {onQuickPractice && (
          <button
            type="button"
            onClick={onQuickPractice}
            className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            {practiceButtonText}
          </button>
        )}
      </div>

      {/* Main Multi-color or Segmented Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-3 bg-[#E5E1DA] rounded-full overflow-hidden flex shadow-inner">
          {/* Mastered (Green) */}
          <div
            className="bg-emerald-600 h-full transition-all duration-500"
            style={{ width: `${stats.totalWords > 0 ? (stats.masteredCount / stats.totalWords) * 100 : 0}%` }}
            title={`Выучено на отлично (≥80%): ${stats.masteredCount} слов`}
          />
          {/* Learning (Amber) */}
          <div
            className="bg-amber-500 h-full transition-all duration-500"
            style={{ width: `${stats.totalWords > 0 ? (stats.learningCount / stats.totalWords) * 100 : 0}%` }}
            title={`В процессе изучения (20-79%): ${stats.learningCount} слов`}
          />
          {/* New (Stone) */}
          <div
            className="bg-stone-300 h-full transition-all duration-500"
            style={{ width: `${stats.totalWords > 0 ? (stats.newCount / stats.totalWords) * 100 : 0}%` }}
            title={`Новые / не начаты: ${stats.newCount} слов`}
          />
        </div>

        {/* Detailed Breakdown Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans text-[#6B655C] pt-1">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <strong className="text-[#1A1A1A]">{stats.masteredCount}</strong> выучено
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <strong className="text-[#1A1A1A]">{stats.learningCount}</strong> повторяется
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />
              <strong className="text-[#1A1A1A]">{stats.newCount}</strong> новых
            </span>
          </div>

          <span className="text-[10px] text-[#8C7D6B] font-mono">
            Всего: {stats.totalWords} слов
          </span>
        </div>
      </div>
    </div>
  );
};
