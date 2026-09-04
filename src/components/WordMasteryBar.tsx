import React from 'react';
import { WordMasteryProgress } from '../types';
import { calculateRetentionPercent, getMasteryBadgeConfig, getWordSkills } from '../utils/srsEngine';

interface WordMasteryBarProps {
  mastery?: WordMasteryProgress;
  showDetails?: boolean;
  compact?: boolean;
  showSkillsBreakdown?: boolean;
}

export const WordMasteryBar: React.FC<WordMasteryBarProps> = ({
  mastery,
  showDetails = true,
  compact = false,
  showSkillsBreakdown = true,
}) => {
  const percent = calculateRetentionPercent(mastery);
  const badge = getMasteryBadgeConfig(percent);
  const skills = getWordSkills(mastery);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={`Память: ${percent}% (👁️${skills.reading}% ✍️${skills.writing}% 🎧${skills.listening}%)`}>
        <div className="w-12 h-1.5 bg-[#E5E1DA] rounded-full overflow-hidden flex">
          <div
            className={`h-full ${badge.barColor} transition-all duration-300`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-[9px] font-sans font-bold ${badge.textColor}`}>
          {percent}%
        </span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-sans">
        <div className="flex items-center gap-1">
          <span className={`px-1.5 py-0.2 rounded-xs border text-[9px] font-bold ${badge.badgeBg} ${badge.textColor} ${badge.borderColor}`}>
            {badge.label}
          </span>
          {mastery?.intervalDays && mastery.intervalDays > 0 && (
            <span className="text-[#8C7D6B] text-[9px]">
              интервал: {mastery.intervalDays} дн.
            </span>
          )}
        </div>
        <span className="font-bold text-[#1A1A1A]">
          {percent}%
        </span>
      </div>

      {/* Visual Overall Progress Bar */}
      <div className="w-full h-1.5 bg-[#E5E1DA] rounded-full overflow-hidden">
        <div
          className={`h-full ${badge.barColor} transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* 3 Aspect Skills Breakdown (Reading, Writing, Listening) */}
      {showSkillsBreakdown && (
        <div className="pt-0.5 grid grid-cols-3 gap-1 text-[8.5px] font-sans">
          <div
            className="flex items-center justify-between px-1 py-0.5 bg-[#F4F8FA] border border-[#D0E1E9] rounded-xs"
            title="👁️ Чтение (Греческий ➔ Русский)"
          >
            <span className="text-[#2C3E50]">👁️ Чтение</span>
            <span className="font-bold text-[#2C3E50]">{skills.reading}%</span>
          </div>

          <div
            className="flex items-center justify-between px-1 py-0.5 bg-[#FFFBF0] border border-[#F3E3B6] rounded-xs"
            title="✍️ Письмо / Конструктор (Русский ➔ Греческий)"
          >
            <span className="text-[#7D5A00]">✍️ Письмо</span>
            <span className="font-bold text-[#7D5A00]">{skills.writing}%</span>
          </div>

          <div
            className="flex items-center justify-between px-1 py-0.5 bg-[#F9F5FF] border border-[#E4D5F7] rounded-xs"
            title="🎧 Восприятие на слух"
          >
            <span className="text-[#5B2C6F]">🎧 Слух</span>
            <span className="font-bold text-[#5B2C6F]">{skills.listening}%</span>
          </div>
        </div>
      )}

      {showDetails && (
        <div className="flex justify-between items-center text-[8.5px] text-[#8C7D6B] pt-0.5">
          <span>
            {mastery?.correctCount || 0} верн. / {mastery?.errorCount || 0} ошиб.
          </span>
          <span>
            {mastery?.nextReviewDate ? `Повт.: ${mastery.nextReviewDate}` : 'Не повторялось'}
          </span>
        </div>
      )}
    </div>
  );
};
