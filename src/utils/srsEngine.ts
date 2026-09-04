import { WordMasteryProgress, WordSkillsProgress } from '../types';

/**
 * Calculates or derives the 3 aspect skills (Reading, Writing, Listening) for a word
 */
export function getWordSkills(mastery?: WordMasteryProgress): WordSkillsProgress {
  if (mastery?.skills) {
    return mastery.skills;
  }

  if (!mastery) {
    return { reading: 0, writing: 0, listening: 0 };
  }

  let basePercent = (mastery.level / 5) * 100;
  if (basePercent === 0 && mastery.correctCount > 0) {
    basePercent = Math.min(100, mastery.correctCount * 20);
  }

  if (basePercent === 0) {
    return { reading: 0, writing: 0, listening: 0 };
  }

  // Derive realistic aspect defaults for existing/legacy data
  return {
    reading: Math.round(basePercent),
    writing: Math.max(0, Math.round(basePercent * 0.75)),
    listening: Math.max(0, Math.round(basePercent * 0.85)),
  };
}

/**
 * SuperMemo SM-2 + Modern SRS Stability & Retention Calculation
 */

/**
 * Calculates current memory retention (0% to 100%) based on days elapsed since last review.
 * Formula based on Ebbinghaus Forgetting Curve: R = e^(-t / S)
 * where t = days elapsed, S = memory stability (interval).
 */
export function calculateRetentionPercent(mastery?: WordMasteryProgress): number {
  if (!mastery) return 0;

  const skills = getWordSkills(mastery);
  const avgSkill = Math.round((skills.reading + skills.writing + skills.listening) / 3);

  if (avgSkill === 0 && mastery.correctCount === 0 && mastery.errorCount === 0) {
    return 0;
  }

  // Base score comes directly from avgSkill if present
  let baseScore = avgSkill;

  // Fallback if skills are zero but level or correct answers exist
  if (baseScore === 0 && (mastery.level > 0 || mastery.correctCount > 0)) {
    baseScore = Math.max(10, (mastery.level / 5) * 100);
  }

  if (baseScore === 0) {
    if (mastery.errorCount > 0) return 5;
    return 0;
  }

  if (!mastery.lastReviewed) {
    return Math.max(5, baseScore);
  }

  let diffDays = 0;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (mastery.lastReviewed !== todayStr) {
    const last = new Date(mastery.lastReviewed).getTime();
    diffDays = Math.max(0, (now.getTime() - last) / (1000 * 60 * 60 * 24));
  }

  const interval = mastery.intervalDays || Math.max(1, mastery.level * 2);
  const stability = interval * (mastery.easeFactor || 2.5);

  // Ebbinghaus exponential decay
  const retentionFactor = Math.exp(-diffDays / Math.max(1, stability));

  // Blended retention score
  const score = Math.round(baseScore * 0.75 + retentionFactor * 0.25 * baseScore);
  return Math.min(100, Math.max(5, score));
}

/**
 * Returns level label and color configuration based on 0-100% mastery score
 */
export function getMasteryBadgeConfig(percent: number): {
  label: string;
  badgeBg: string;
  textColor: string;
  barColor: string;
  borderColor: string;
  level: number;
} {
  if (percent >= 85) {
    return {
      label: 'Мастер',
      badgeBg: 'bg-emerald-50',
      textColor: 'text-emerald-800',
      barColor: 'bg-emerald-600',
      borderColor: 'border-emerald-200',
      level: 5,
    };
  }
  if (percent >= 65) {
    return {
      label: 'Уверенно',
      badgeBg: 'bg-teal-50',
      textColor: 'text-teal-800',
      barColor: 'bg-teal-600',
      borderColor: 'border-teal-200',
      level: 4,
    };
  }
  if (percent >= 40) {
    return {
      label: 'Закрепление',
      badgeBg: 'bg-amber-50',
      textColor: 'text-amber-800',
      barColor: 'bg-amber-500',
      borderColor: 'border-amber-200',
      level: 3,
    };
  }
  if (percent >= 15) {
    return {
      label: 'Изучается',
      badgeBg: 'bg-blue-50',
      textColor: 'text-blue-800',
      barColor: 'bg-blue-500',
      borderColor: 'border-blue-200',
      level: 2,
    };
  }
  if (percent > 0) {
    return {
      label: 'Знакомство',
      badgeBg: 'bg-stone-100',
      textColor: 'text-stone-700',
      barColor: 'bg-stone-400',
      borderColor: 'border-stone-200',
      level: 1,
    };
  }
  return {
    label: 'Новое',
    badgeBg: 'bg-stone-50',
    textColor: 'text-stone-400',
    barColor: 'bg-stone-200',
    borderColor: 'border-stone-200',
    level: 0,
  };
}

/**
 * Calculates aggregate chapter/section mastery statistics
 */
export interface SectionProgressStats {
  totalWords: number;
  masteredCount: number; // >= 80%
  learningCount: number; // 20% - 79%
  newCount: number; // 0% - 19%
  averageMasteryPercent: number;
}

export function calculateSectionMasteryStats(
  wordIds: string[],
  wordMastery: Record<string, WordMasteryProgress>
): SectionProgressStats {
  if (!wordIds || wordIds.length === 0) {
    return {
      totalWords: 0,
      masteredCount: 0,
      learningCount: 0,
      newCount: 0,
      averageMasteryPercent: 0,
    };
  }

  let totalScore = 0;
  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;

  wordIds.forEach((id) => {
    const mastery = wordMastery[id];
    const score = calculateRetentionPercent(mastery);
    totalScore += score;

    if (score >= 80) {
      masteredCount++;
    } else if (score >= 20) {
      learningCount++;
    } else {
      newCount++;
    }
  });

  const averageMasteryPercent = Math.round(totalScore / wordIds.length);

  return {
    totalWords: wordIds.length,
    masteredCount,
    learningCount,
    newCount,
    averageMasteryPercent,
  };
}

/**
 * Calculates the required cognitive cooldown in ms before a repeat review
 * contributes to SRS level advancement and skill gains (3 Spaced Repetition Stages).
 * 
 * Stage 1: 45 minutes (working memory consolidation)
 * Stage 2: 24 hours (long-term memory transfer)
 * Stage 3: 72 hours / 3 days (long-term stabilization)
 */
export const SRS_3_STAGES = [
  { step: 1, label: '45 мин', intervalMs: 45 * 60 * 1000, desc: 'Закрепление в рабочей памяти' },
  { step: 2, label: '24 ч', intervalMs: 24 * 60 * 60 * 1000, desc: 'Перенос в долговременную память' },
  { step: 3, label: '3 дня', intervalMs: 72 * 60 * 60 * 1000, desc: 'Долговременное закрепление' },
] as const;

export function getCognitiveCooldownMs(level: number): number {
  switch (level) {
    case 0:
    case 1:
      return 45 * 60 * 1000; // 45 minutes for 1st repetition
    case 2:
      return 24 * 60 * 60 * 1000; // 24 hours (1 day) for 2nd repetition
    case 3:
      return 72 * 60 * 60 * 1000; // 72 hours (3 days) for 3rd repetition
    default:
      return 7 * 24 * 60 * 60 * 1000; // 7 days (maintenance for mastered words)
  }
}

/**
 * Format remaining cooldown duration in human-readable Russian string
 */
export function formatCooldownRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return 'Готово к повторению';
  const minutes = Math.ceil(remainingMs / (60 * 1000));
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) {
    return remMinutes > 0 ? `${hours} ч ${remMinutes} мин` : `${hours} ч`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} д ${remHours} ч` : `${days} д`;
}

export function formatIntervalCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return 'Пора повторить';
  const minutes = Math.ceil(remainingMs / (60 * 1000));
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 24) {
    return remMinutes > 0 ? `${hours} ч ${remMinutes} м` : `${hours} ч`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days} д ${remHours} ч` : `${days} д`;
}

export interface ChunkSRSStatus {
  step: number; // 0 (New), 1 (Completed 1st round, 45m), 2 (Completed 2nd round, 24h), 3 (Mastered)
  isDone: boolean; // Has been completed at least once
  isNext: boolean; // Next in sequential order for new learner
  isDue: boolean; // Cooldown expired, ready for SRS next step review (highlighted with 🔔)
  inCooldown: boolean; // Currently within cooldown interval
  isMastered: boolean; // Step >= 3 (100% Mastered)
  remainingMs: number;
  remainingText: string; // e.g. "32 мин", "14 ч", "2 д"
  badgeText: string; // "⏱ 32 мин", "🔔 Повторить (1/3)", "✅ Выучено" etc.
  tooltipText: string;
  buttonClass: string;
  badgeClass: string;
}

export function getChunkSRSStatus(
  sectionKey: string,
  chunkIndex: number,
  student: {
    completedChunks?: Record<string, number[]>;
    completedChunkTimes?: Record<string, number>;
    completedChunkRounds?: Record<string, number>;
  },
  isNextSequential: boolean,
  nowMs: number = Date.now()
): ChunkSRSStatus {
  const key = `${sectionKey}_${chunkIndex}`;
  const isCompletedAtLeastOnce = Boolean(student.completedChunks?.[sectionKey]?.includes(chunkIndex));
  const rawRound = student.completedChunkRounds?.[key];
  const step = rawRound !== undefined ? rawRound : (isCompletedAtLeastOnce ? 1 : 0);
  const lastTime = student.completedChunkTimes?.[key];

  if (!isCompletedAtLeastOnce || step === 0) {
    return {
      step: 0,
      isDone: false,
      isNext: isNextSequential,
      isDue: false,
      inCooldown: false,
      isMastered: false,
      remainingMs: 0,
      remainingText: '',
      badgeText: isNextSequential ? 'СЛЕД' : '',
      tooltipText: isNextSequential ? 'Следующая новая порция' : 'Новая порция',
      buttonClass: isNextSequential
        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold ring-2 ring-[#2D4A32]/30'
        : 'bg-white text-[#6B655C] border-[#E5E1DA] hover:border-[#1A1A1A]',
      badgeClass: 'bg-amber-400 text-[#1A1A1A]',
    };
  }

  // If already reached step 3 -> Mastered
  if (step >= 3) {
    return {
      step: 3,
      isDone: true,
      isNext: false,
      isDue: false,
      inCooldown: false,
      isMastered: true,
      remainingMs: 0,
      remainingText: '',
      badgeText: '✅ Выучено',
      tooltipText: 'Пройдены все 3 ступени повторения (45 мин → 24 ч → 3 дня). Порция полностью усвоена!',
      buttonClass: 'bg-[#C5D9C8] text-[#2D4A32] border-[#2D4A32]/40 font-semibold',
      badgeClass: 'bg-[#2D4A32] text-white',
    };
  }

  // Determine required cooldown for current step (Step 1: 45m, Step 2: 24h, Step 3: 72h)
  const currentStageConfig = SRS_3_STAGES[step - 1] || SRS_3_STAGES[0];
  const requiredMs = currentStageConfig.intervalMs;
  const elapsed = lastTime ? nowMs - lastTime : requiredMs + 1;
  const inCooldown = elapsed < requiredMs;
  const remainingMs = inCooldown ? requiredMs - elapsed : 0;
  const remainingText = inCooldown ? formatIntervalCountdown(remainingMs) : '';

  if (inCooldown) {
    return {
      step,
      isDone: true,
      isNext: false,
      isDue: false,
      inCooldown: true,
      isMastered: false,
      remainingMs,
      remainingText,
      badgeText: `⏱ ${remainingText}`,
      tooltipText: `Ступень ${step}/3 (${currentStageConfig.label}). До следующего зачетного повторения осталось ${remainingText}. (Сейчас доступна разминка)`,
      buttonClass: 'bg-[#FAF6F0] text-[#7A5A21] border-[#E8DDCB] hover:border-[#7A5A21]',
      badgeClass: 'bg-[#E8DDCB] text-[#7A5A21]',
    };
  } else {
    // Cooldown passed -> Ready for next repetition step
    return {
      step,
      isDone: true,
      isNext: false,
      isDue: true,
      inCooldown: false,
      isMastered: false,
      remainingMs: 0,
      remainingText: '',
      badgeText: `🔔 Повторить (${step}/3)`,
      tooltipText: `Интервал ${currentStageConfig.label} прошёл! Нажмите для закрепления (переход на шаг ${step + 1}/3).`,
      buttonClass: 'bg-amber-50 text-amber-900 border-amber-400 font-bold ring-2 ring-amber-400/40 hover:bg-amber-100',
      badgeClass: 'bg-amber-500 text-white font-bold',
    };
  }
}

/**
 * Checks whether a word is currently in its cognitive spacing cooldown window.
 */
export function checkWordCognitiveCooldown(
  mastery?: WordMasteryProgress,
  nowMs: number = Date.now()
): { inCooldown: boolean; remainingMs: number; requiredMs: number } {
  if (!mastery) {
    return { inCooldown: false, remainingMs: 0, requiredMs: getCognitiveCooldownMs(0) };
  }

  let lastTime = mastery.lastReviewedTime;
  if (!lastTime && mastery.lastReviewed) {
    lastTime = new Date(mastery.lastReviewed).getTime();
  }

  if (!lastTime || isNaN(lastTime)) {
    return { inCooldown: false, remainingMs: 0, requiredMs: getCognitiveCooldownMs(mastery.level) };
  }

  const requiredMs = getCognitiveCooldownMs(mastery.level || 0);
  const elapsed = nowMs - lastTime;

  if (elapsed < requiredMs) {
    return {
      inCooldown: true,
      remainingMs: requiredMs - elapsed,
      requiredMs,
    };
  }

  return { inCooldown: false, remainingMs: 0, requiredMs };
}

/**
 * Updates SM-2 Spaced Repetition parameters after a learning trial,
 * adjusting multi-aspect skills (Reading, Writing, Listening)
 */
export function updateWordSRS(
  prevMastery: WordMasteryProgress | undefined,
  isCorrect: boolean,
  quality: number = isCorrect ? 4 : 1, // 0-5 scale
  aspect?: 'reading' | 'writing' | 'listening',
  nowMs: number = Date.now()
): WordMasteryProgress & { wasCooldownThrottled?: boolean } {
  const currentSkills = getWordSkills(prevMastery);
  const updatedSkills: WordSkillsProgress = { ...currentSkills };

  const { inCooldown } = checkWordCognitiveCooldown(prevMastery, nowMs);

  // If user repeats a correct answer inside the cooldown window,
  // treat as practice/warmup rather than advancing SRS level.
  const isInstantRepeatSuccess = inCooldown && isCorrect;

  if (isInstantRepeatSuccess) {
    if (aspect) {
      updatedSkills[aspect] = Math.min(100, updatedSkills[aspect] + 1);
    } else {
      (['reading', 'writing', 'listening'] as const).forEach((asp) => {
        updatedSkills[asp] = Math.min(100, updatedSkills[asp] + 1);
      });
    }
  } else {
    if (aspect) {
      if (isCorrect) {
        updatedSkills[aspect] = Math.min(100, updatedSkills[aspect] + 25);
        (['reading', 'writing', 'listening'] as const).forEach((asp) => {
          if (asp !== aspect) {
            updatedSkills[asp] = Math.min(100, updatedSkills[asp] + 5);
          }
        });
      } else {
        updatedSkills[aspect] = Math.max(0, updatedSkills[aspect] - 20);
      }
    } else {
      (['reading', 'writing', 'listening'] as const).forEach((asp) => {
        if (isCorrect) {
          updatedSkills[asp] = Math.min(100, updatedSkills[asp] + 15);
        } else {
          updatedSkills[asp] = Math.max(0, updatedSkills[asp] - 15);
        }
      });
    }
  }

  const avgSkill = Math.round(
    (updatedSkills.reading + updatedSkills.writing + updatedSkills.listening) / 3
  );

  const current = prevMastery || {
    level: 0,
    errorCount: 0,
    correctCount: 0,
    lastReviewed: '',
    easeFactor: 2.5,
    intervalDays: 1,
    repetitionCount: 0,
  };

  const easeFactor = current.easeFactor ?? 2.5;
  const repetitionCount = current.repetitionCount ?? 0;
  const intervalDays = current.intervalDays ?? 1;

  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  if (newEaseFactor > 3.0) newEaseFactor = 3.0;

  let newRepetitions = repetitionCount;
  let newInterval = intervalDays;

  if (isCorrect && !isInstantRepeatSuccess) {
    newRepetitions = repetitionCount + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 3;
    } else if (newRepetitions === 3) {
      newInterval = 6;
    } else {
      newInterval = Math.round(intervalDays * newEaseFactor);
    }
  } else if (!isCorrect) {
    newRepetitions = 0;
    newInterval = 1;
  }

  const newLevel = isInstantRepeatSuccess
    ? (current.level || 0)
    : Math.min(
        5,
        avgSkill >= 85 ? 5 :
        avgSkill >= 65 ? 4 :
        avgSkill >= 40 ? 3 :
        avgSkill >= 15 ? 2 :
        avgSkill > 0 ? 1 : 0
      );

  const today = new Date(nowMs);
  const nextDate = new Date(nowMs);
  nextDate.setDate(today.getDate() + newInterval);

  return {
    level: newLevel,
    correctCount: current.correctCount + (isCorrect ? 1 : 0),
    errorCount: current.errorCount + (isCorrect ? 0 : 1),
    lastReviewed: today.toISOString().split('T')[0],
    lastReviewedTime: nowMs,
    nextReviewDate: nextDate.toISOString().split('T')[0],
    easeFactor: Number(newEaseFactor.toFixed(2)),
    intervalDays: newInterval,
    repetitionCount: newRepetitions,
    skills: updatedSkills,
    wasCooldownThrottled: isInstantRepeatSuccess,
  };
}
