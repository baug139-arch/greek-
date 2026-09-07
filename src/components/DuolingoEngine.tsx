import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  Heart, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  Puzzle, 
  Keyboard as KeyboardIcon,
  Shuffle, 
  HelpCircle, 
  Headphones, 
  Sparkles,
  ArrowLeftRight,
  ArrowRightCircle,
  Eye,
  Check,
  RefreshCw,
  Lightbulb,
  ChevronRight,
  Bookmark,
  BookOpen,
  Clock,
  Brain,
  Play,
  X
} from 'lucide-react';
import { GreekWord, ExerciseItem, ExerciseType, BiblicalPhrase, StudentSettings, TrainingMode, TrainingDirection } from '../types';
import { speakErasmian, speakRussian, playSuccessChime, playErrorBuzz, playFanfare } from '../utils/audio';
import { matchGreekInput, matchRussianInput } from '../utils/greekUtils';
import { getMnemonicForWord } from '../utils/mnemonics';
import { EditableMnemonic } from "./EditableMnemonic";
import { checkAnswerFlexible } from "../utils/textUtils";
import { GreekKeyboard } from './GreekKeyboard';
import { SRS_3_STAGES, formatIntervalCountdown } from '../utils/srsEngine';

const GREEK_DISTRACTOR_CHARS = ['α', 'ε', 'ι', 'ο', 'υ', 'ν', 'ς', 'τ', 'ρ', 'λ', 'μ', 'κ', 'π', 'σ', 'η', 'ω'];

export function createLettersForWord(word: string): { id: string; char: string }[] {
  if (!word) return [];
  // Remove punctuation, hyphens, and whitespace
  const clean = word.replace(/[,\.;·!«»—\s\-]/g, '');
  const characters = Array.from(clean);
  
  const hasUpperCase = characters.some(c => c !== c.toLowerCase());

  // Pick 2-3 distractor characters that are not overwhelmingly redundant
  const distractors: string[] = [];
  const distractorCount = Math.min(3, Math.max(2, Math.floor(characters.length / 3)));
  for (let i = 0; i < distractorCount; i++) {
    let randomChar = GREEK_DISTRACTOR_CHARS[Math.floor(Math.random() * GREEK_DISTRACTOR_CHARS.length)];
    if (hasUpperCase && Math.random() > 0.5) {
      randomChar = randomChar.toUpperCase();
    }
    distractors.push(randomChar);
  }

  const all = [...characters, ...distractors];
  return all
    .map((char, idx) => ({
      id: `letter_${idx}_${char}_${Math.random().toString(36).substring(2, 7)}`,
      char,
    }))
    .sort(() => Math.random() - 0.5);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface DuolingoEngineProps {
  title: string;
  sectionId?: string;
  words: GreekWord[];
  phrases?: BiblicalPhrase[];
  studentSettings?: StudentSettings;
  initialMode?: TrainingMode;
  initialDirection?: TrainingDirection;
  initialChunkIndex?: number;
  initialStageIndex?: number;
  unmasteredWords?: GreekWord[];
  customMnemonics?: Record<string, string>;
  completedChunkRounds?: Record<string, number>;
  completedChunkTimes?: Record<string, number>;
  onUpdateMnemonic?: (wordId: string, mnemonic: string) => void;
  onComplete: (
    scorePercent: number, 
    xpGained: number, 
    mistakes: { word: GreekWord; given: string }[],
    completedChunkInfo?: { sectionId: string; chunkIndex: number },
    testedWords?: GreekWord[],
    roundCompleted?: number
  ) => void;
  onExit: () => void;
}

const WordContextSnippet: React.FC<{ word?: GreekWord }> = ({ word }) => {
  if (!word?.exampleVerse) return null;
  const { reference, greekText, translationRu, highlightWord } = word.exampleVerse;
  const isFormDifferent = Boolean(highlightWord && highlightWord !== word.lemma && highlightWord !== word.greek);

  return (
    <div className="p-2 sm:p-2.5 bg-[#FAF8F5] border border-[#E5E1DA] text-left text-[11px] sm:text-xs font-serif mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 rounded-xs shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] sm:text-[10px] font-sans text-[#8C7D6B] font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2D4A32]" />
          <span>Контекст ({reference})</span>
        </span>
        {isFormDifferent && (
          <span className="text-[#2D4A32] lowercase bg-[#C5D9C8]/60 px-1 py-0.2 rounded-xs font-sans font-normal text-[9px] sm:text-[10px]">
            форма в тексте: <strong>{highlightWord}</strong>
          </span>
        )}
      </div>
      <p className="font-serif italic text-[#1A1A1A] text-xs sm:text-sm leading-snug">
        «{greekText}»
      </p>
      <p className="text-[#5C5549] text-[10px] sm:text-xs font-sans">
        «{translationRu}»
      </p>
    </div>
  );
};

export const DuolingoEngine: React.FC<DuolingoEngineProps> = ({
  title,
  sectionId = 'default_section',
  words,
  phrases = [],
  studentSettings,
  initialMode = 'all',
  initialDirection = 'bidirectional',
  initialChunkIndex = 0,
  initialStageIndex,
  unmasteredWords = [],
  customMnemonics,
  completedChunkRounds,
  completedChunkTimes,
  onUpdateMnemonic,
  onComplete,
  onExit,
}) => {
  const [currentMode, setCurrentMode] = useState<TrainingMode>(initialMode);
  const [currentDirection, setCurrentDirection] = useState<TrainingDirection>(initialDirection);
  
  // Batching / Micro-lesson Chunking
  const batchSizeConfig = studentSettings?.batchSize ?? 8;
  const effectiveBatchSize = batchSizeConfig > 0 ? batchSizeConfig : words.length;
  
  // Total chunks for words pool
  const totalChunks = words.length > 0 && effectiveBatchSize > 0 
    ? Math.ceil(words.length / effectiveBatchSize) 
    : 1;

  const [currentChunkIndex, setCurrentChunkIndex] = useState(initialChunkIndex);

  // Automatically determine default stage from student's SRS progress on this chunk
  const defaultChunkRound = useMemo(() => {
    if (initialStageIndex !== undefined && initialStageIndex !== null) {
      return initialStageIndex;
    }
    const chunkKey = `${sectionId}_${currentChunkIndex}`;
    const raw = completedChunkRounds?.[chunkKey];
    if (raw === undefined || raw === 0) return 0; // 1-й этап: Полное заучивание
    if (raw === 1) return 1; // 2-й этап: Закрепление через 45 мин
    return 2; // 3-й этап: Экспресс-контроль
  }, [initialStageIndex, completedChunkRounds, sectionId, currentChunkIndex]);

  const [selectedStageOverride, setSelectedStageOverride] = useState<number | null>(
    initialStageIndex !== undefined && initialStageIndex !== null ? initialStageIndex : null
  );

  useEffect(() => {
    if (initialStageIndex !== undefined && initialStageIndex !== null) {
      setSelectedStageOverride(initialStageIndex);
    }
  }, [initialStageIndex]);

  const currentChunkRound = selectedStageOverride !== null ? selectedStageOverride : defaultChunkRound;

  // Check if current session is an interim warmup (started before cooldown interval elapsed)
  const isWarmupSession = useMemo(() => {
    if (!sectionId || currentChunkIndex === undefined) return false;
    const chunkKey = `${sectionId}_${currentChunkIndex}`;
    const rawRound = completedChunkRounds?.[chunkKey] ?? 0;
    if (rawRound === 0 || rawRound >= 3) return false;
    const lastTime = completedChunkTimes?.[chunkKey];
    if (!lastTime) return false;
    const stageConfig = SRS_3_STAGES[rawRound - 1] || SRS_3_STAGES[0];
    const elapsed = Date.now() - lastTime;
    return elapsed < stageConfig.intervalMs;
  }, [sectionId, currentChunkIndex, completedChunkRounds, completedChunkTimes]);

  const warmupRemainingText = useMemo(() => {
    if (!isWarmupSession || !sectionId || currentChunkIndex === undefined) return '';
    const chunkKey = `${sectionId}_${currentChunkIndex}`;
    const rawRound = completedChunkRounds?.[chunkKey] ?? 1;
    const lastTime = completedChunkTimes?.[chunkKey] || Date.now();
    const stageConfig = SRS_3_STAGES[rawRound - 1] || SRS_3_STAGES[0];
    const remainingMs = Math.max(0, stageConfig.intervalMs - (Date.now() - lastTime));
    return formatIntervalCountdown(remainingMs);
  }, [isWarmupSession, sectionId, currentChunkIndex, completedChunkRounds, completedChunkTimes]);
  // Track words carrying over for reinforcement in next chunks
  const pendingReviewWordsRef = useRef<GreekWord[]>(unmasteredWords || []);

  // Active subset of words: strictly current chunk words
  const currentChunkWords = useMemo(() => {
    if (!words || words.length === 0) return [];
    if (effectiveBatchSize <= 0) return words;
    
    // Words belonging strictly to this chunk
    const chunkWords = words.slice(currentChunkIndex * effectiveBatchSize, (currentChunkIndex + 1) * effectiveBatchSize);
    
    // Any carried over mistake/review words from PREVIOUS chunks (not future words)
    const combined = [...chunkWords];
    if (pendingReviewWordsRef.current) {
      pendingReviewWordsRef.current.forEach((pw) => {
        // only include if not already in chunk
        if (!combined.some((cw) => cw.id === pw.id)) {
          combined.push(pw);
        }
      });
    }
    return combined;
  }, [words, currentChunkIndex, effectiveBatchSize]);

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [xpEarned, setXpEarned] = useState(0);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [typoWarning, setTypoWarning] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Flashcard specific state
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showFlashcardContext, setShowFlashcardContext] = useState(false);
  const [flashcardAnswer, setFlashcardAnswer] = useState<'know' | 'dont_know' | null>(null);
  
  // Exercise states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  
  // Match pairs state
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [selectedGreek, setSelectedGreek] = useState<string | null>(null);
  const [selectedRussian, setSelectedRussian] = useState<string | null>(null);
  const [pairOptions, setPairOptions] = useState<{ greekList: string[]; russianList: string[] }>({
    greekList: [],
    russianList: [],
  });

  // Word builder state
  const [selectedLetters, setSelectedLetters] = useState<{ id: string; char: string }[]>([]);
  const [availableLetters, setAvailableLetters] = useState<{ id: string; char: string }[]>([]);

  // Session summary
  const [isFinished, setIsFinished] = useState(false);
  const [isChunkFinished, setIsChunkFinished] = useState(false);
  const [mistakesList, setMistakesList] = useState<{ word: GreekWord; given: string }[]>([]);
  const [showPhoneticHint, setShowPhoneticHint] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const lastCheckedTimestampRef = useRef<number>(0);
  const typingInputRef = useRef<HTMLInputElement>(null);

  const audioSpeed = studentSettings?.audioSpeed ?? 0.82;
  const voiceEngine = studentSettings?.voiceEngine ?? 'latin_phonetic';
  const showTranslit = studentSettings?.showTransliteration ?? true;
  const showIpa = studentSettings?.showPhoneticIpa ?? true;
  const soundEffects = studentSettings?.soundEffectsEnabled ?? true;
  const autoPlay = studentSettings?.autoPlayAudio ?? true;
  const fontSize = studentSettings?.greekFontSize ?? 'normal';

  const greekFontClass = 
    fontSize === 'huge' ? 'text-5xl sm:text-6xl' :
    fontSize === 'large' ? 'text-4xl sm:text-5xl' :
    'text-3xl sm:text-4xl';

  // Helper to generate exercises based on mode, direction, word pool, and repetition round
  const generateExercisesForPool = (
    targetPool: GreekWord[], 
    mode: TrainingMode, 
    direction: TrainingDirection, 
    round: number = 0
  ): ExerciseItem[] => {
    if (!targetPool || targetPool.length === 0) return [];

    const generated: ExerciseItem[] = [];
    const pool = [...targetPool];

    // =========================================================================
    // MODE 1: FLASHCARDS (Флеш-карточки)
    // =========================================================================
    if (mode === 'flashcards') {
      pool.forEach((w, idx) => {
        let side: 'greek_first' | 'ru_first' = 'greek_first';
        if (direction === 'ru_to_greek') {
          side = 'ru_first';
        } else if (direction === 'bidirectional') {
          side = idx % 2 === 0 ? 'greek_first' : 'ru_first';
        }

        generated.push({
          id: `fc_${mode}_${idx}_${w.id}`,
          type: 'flashcard',
          word: w,
          promptRu: side === 'greek_first' 
            ? 'Греческий ➔ Русский: Прочтите слово и проверьте перевод' 
            : 'Русский ➔ Греческий: Вспомните греческое слово',
          correctAnswer: w.translationRu,
          flashcardSide: side,
        });
      });
    }

    // =========================================================================
    // MODE 2: CONSTRUCTOR / BUILDER (Конструктор слова из греческих букв: РУС ➔ ГРЕК)
    // =========================================================================
    else if (mode === 'builder') {
      shuffleArray(pool).forEach((w, idx) => {
        generated.push({
          id: `word_builder_${idx}_${w.id}`,
          type: 'word_builder',
          word: w,
          promptRu: `Соберите слово по буквам: «${w.translationRu}»`,
          correctAnswer: w.greek || w.lemma,
          letters: createLettersForWord(w.greek || w.lemma),
          hint: `Греческое слово: [${w.transliterationRu}] — «${w.translationRu}»`,
        });
      });
    }

    // =========================================================================
    // MODE 3: TYPING / SPELLING (Письмо: ГРЕК ➔ РУС)
    // =========================================================================
    else if (mode === 'typing') {
      shuffleArray(pool).forEach((w, idx) => {
        generated.push({
          id: `typing_gr_ru_${idx}_${w.id}`,
          type: 'typing_input',
          word: w,
          direction: 'greek_to_ru',
          promptRu: `Введите русский перевод греческого слова:`,
          correctAnswer: w.translationRu,
          hint: `Греческое слово: ${w.greek} (${w.transliterationRu})`,
        });
      });
    }

    // =========================================================================
    // MODE 4: QUIZ / MULTIPLE CHOICE (Тест и выбор ответа)
    // =========================================================================
    else if (mode === 'quiz') {
      shuffleArray(pool).forEach((w, idx) => {
        const isRuToGreek = direction === 'ru_to_greek' || (direction === 'bidirectional' && idx % 2 !== 0);

        if (isRuToGreek) {
          const distractors = pool
            .filter((item) => item.id !== w.id)
            .map((item) => item.greek)
            .slice(0, 3);
          const allOptions = [w.greek, ...distractors].sort(() => Math.random() - 0.5);

          generated.push({
            id: `quiz_rev_${idx}_${w.id}`,
            type: 'reverse_choice',
            word: w,
            promptRu: `Как пишется по-гречески: «${w.translationRu}»?`,
            options: allOptions,
            correctAnswer: w.greek,
          });
        } else {
          const distractors = pool
            .filter((item) => item.id !== w.id)
            .map((item) => item.translationRu)
            .slice(0, 3);
          const allOptions = [w.translationRu, ...distractors].sort(() => Math.random() - 0.5);

          generated.push({
            id: `quiz_mc_${idx}_${w.id}`,
            type: 'multiple_choice',
            word: w,
            promptRu: `Выберите перевод слова: ${w.greek}`,
            options: allOptions,
            correctAnswer: w.translationRu,
          });
        }
      });
    }

    // =========================================================================
    // MODE 5: AUDIO / LISTENING (Аудирование: ГРЕК ➔ РУС)
    // =========================================================================
    else if (mode === 'audio') {
      shuffleArray(pool).forEach((w, idx) => {
        const distractors = pool
          .filter((item) => item.id !== w.id)
          .map((item) => item.translationRu)
          .slice(0, 3);
        const allOptions = [w.translationRu, ...distractors].sort(() => Math.random() - 0.5);

        generated.push({
          id: `audio_ru_${idx}_${w.id}`,
          type: 'audio_quiz',
          word: w,
          promptRu: 'Послушайте эразмово произношение и выберите русский перевод:',
          options: allOptions,
          correctAnswer: w.translationRu,
        });
      });
    }

    // =========================================================================
    // MODE 6: MATCH PAIRS (Сопоставление)
    // =========================================================================
    else if (mode === 'match') {
      if (pool.length >= 2) {
        generated.push({
          id: `pairs_batch_all`,
          type: 'match_pairs',
          promptRu: 'Соедините греческие слова с их русским переводом',
          correctAnswer: 'all_matched',
          pairs: shuffleArray(pool).map((w) => ({
            greek: w.greek,
            translation: w.translationRu,
          })),
        });
      } else {
        // Fallback to flashcards if not enough words for matching
        pool.forEach((w, idx) => {
          generated.push({
            id: `fc_fallback_${idx}_${w.id}`,
            type: 'flashcard',
            word: w,
            promptRu: 'Недостаточно слов для сопоставления. Ознакомьтесь с карточкой.',
            correctAnswer: w.translationRu,
            flashcardSide: 'greek_first',
          });
        });
      }
    }

    // =========================================================================
    // MODE 7: ALL COMBINED (Динамический микс по ступеням заучивания)
    // =========================================================================
    else {
      // -----------------------------------------------------------------------
      // 1-й ЭТАП (Первичное знакомство, round 0): 6 упражнений (Глубокое изучение)
      // Карточки -> Тест -> Конструктор -> Письмо -> Аудио -> Матчинг
      // -----------------------------------------------------------------------
      if (round === 0) {
        // 1. Flashcards for all (по порядку, для первого структурированного знакомства)
        pool.forEach((w, idx) => {
          generated.push({
            id: `all_r0_fc_${idx}_${w.id}`,
            type: 'flashcard',
            word: w,
            promptRu: '1. Карточки: ознакомление со словом и произношением',
            correctAnswer: w.translationRu,
            flashcardSide: 'greek_first',
          });
        });

        // 2. Multiple choice for all (Тест - перемешанный порядок)
        shuffleArray(pool).forEach((w, idx) => {
          if (direction === 'greek_to_ru' || (direction === 'bidirectional' && idx % 2 === 0)) {
            const distractors = pool
              .filter((item) => item.id !== w.id)
              .map((item) => item.translationRu)
              .slice(0, 3);
            const allOptions = [w.translationRu, ...distractors].sort(() => Math.random() - 0.5);

            generated.push({
              id: `all_r0_mc_${idx}_${w.id}`,
              type: 'multiple_choice',
              word: w,
              promptRu: '2. Тест: выберите правильный русский перевод',
              options: allOptions,
              correctAnswer: w.translationRu,
            });
          } else {
            const distractors = pool
              .filter((item) => item.id !== w.id)
              .map((item) => item.greek)
              .slice(0, 3);
            const allOptions = [w.greek, ...distractors].sort(() => Math.random() - 0.5);

            generated.push({
              id: `all_r0_rev_${idx}_${w.id}`,
              type: 'reverse_choice',
              word: w,
              promptRu: `2. Тест: как пишется по-гречески: «${w.translationRu}»?`,
              options: allOptions,
              correctAnswer: w.greek,
            });
          }
        });

        // 3. Word Letter Builder for all (Greek) (Конструктор - перемешанный порядок)
        shuffleArray(pool).forEach((w, idx) => {
          generated.push({
            id: `all_r0_word_builder_${idx}_${w.id}`,
            type: 'word_builder',
            word: w,
            promptRu: `3. Конструктор: соберите греческое слово: «${w.translationRu}»`,
            correctAnswer: w.greek || w.lemma,
            letters: createLettersForWord(w.greek || w.lemma),
            hint: `Греческое слово: [${w.transliterationRu}] — «${w.translationRu}»`,
          });
        });

        // 4. Typing Input for all (Russian) (Письмо - перемешанный порядок)
        shuffleArray(pool).forEach((w, idx) => {
          generated.push({
            id: `all_r0_typing_${idx}_${w.id}`,
            type: 'typing_input',
            word: w,
            direction: 'greek_to_ru',
            promptRu: `4. Письмо: введите русский перевод слова`,
            correctAnswer: w.translationRu,
            hint: `Греческое слово: ${w.greek} (${w.transliterationRu})`,
          });
        });

        // 5. Audio listening for all (Аудио - перемешанный порядок)
        shuffleArray(pool).forEach((w, idx) => {
          const audioDistractors = pool
            .filter((item) => item.id !== w.id)
            .map((item) => item.translationRu)
            .slice(0, 3);
          generated.push({
            id: `all_r0_audio_${idx}_${w.id}`,
            type: 'audio_quiz',
            word: w,
            promptRu: '5. Аудио: восприятие на слух (Эразмово чтение)',
            options: [w.translationRu, ...audioDistractors].sort(() => Math.random() - 0.5),
            correctAnswer: w.translationRu,
          });
        });
      }

      // -----------------------------------------------------------------------
      // 2-й ЭТАП (1-е повторение через 45 мин, round 1): 3 упражнения (Освежение)
      // Тест -> Аудио -> Письмо -> Финальный матчинг
      // -----------------------------------------------------------------------
      else if (round === 1) {
        // 1. Multiple choice / Reverse choice (Тест - перемешанный порядок)
        shuffleArray(pool).forEach((w, idx) => {
          const isReverse = idx % 2 !== 0;
          if (isReverse) {
            const distractors = pool
              .filter((item) => item.id !== w.id)
              .map((item) => item.greek)
              .slice(0, 3);
            const allOptions = [w.greek, ...distractors].sort(() => Math.random() - 0.5);

            generated.push({
              id: `all_r1_rev_${idx}_${w.id}`,
              type: 'reverse_choice',
              word: w,
              promptRu: `Закрепление (45 мин) • Тест: «${w.translationRu}» ➔ Греческий`,
              options: allOptions,
              correctAnswer: w.greek,
            });
          } else {
            const distractors = pool
              .filter((item) => item.id !== w.id)
              .map((item) => item.translationRu)
              .slice(0, 3);
            const allOptions = [w.translationRu, ...distractors].sort(() => Math.random() - 0.5);

            generated.push({
              id: `all_r1_mc_${idx}_${w.id}`,
              type: 'multiple_choice',
              word: w,
              promptRu: `Закрепление (45 мин) • Тест: ${w.greek} ➔ Русский`,
              options: allOptions,
              correctAnswer: w.translationRu,
            });
          }
        });

        // 2. Audio listening for all (Аудио - перемешанный порядок)
        shuffleArray(pool).forEach((w, idx) => {
          const audioDistractors = pool
            .filter((item) => item.id !== w.id)
            .map((item) => item.translationRu)
            .slice(0, 3);
          generated.push({
            id: `all_r1_audio_${idx}_${w.id}`,
            type: 'audio_quiz',
            word: w,
            promptRu: 'Закрепление (45 мин) • Восприятие на слух',
            options: [w.translationRu, ...audioDistractors].sort(() => Math.random() - 0.5),
            correctAnswer: w.translationRu,
          });
        });

        // 3. Typing Input for all (Письмо - перемешанный порядок)
        shuffleArray(pool).forEach((w, idx) => {
          generated.push({
            id: `all_r1_typing_${idx}_${w.id}`,
            type: 'typing_input',
            word: w,
            direction: 'greek_to_ru',
            promptRu: `Закрепление (45 мин) • Введите русский перевод слова`,
            correctAnswer: w.translationRu,
            hint: `Греческое слово: ${w.greek} (${w.transliterationRu})`,
          });
        });
      }

      // -----------------------------------------------------------------------
      // 3-й ЭТАП (2-е / 3-е повторение, 24 ч и 3 дня, round >= 2): 2 упражнения (Экспресс-контроль)
      // Быстрый тест -> Письмо -> Финальный матчинг
      // -----------------------------------------------------------------------
      else {
        // 1. Quick Quiz (50% грек->рус, 50% рус->грек - перемешанный порядок)
        shuffleArray(pool).forEach((w, idx) => {
          const isReverse = idx % 2 !== 0;
          if (isReverse) {
            const distractors = pool
              .filter((item) => item.id !== w.id)
              .map((item) => item.greek)
              .slice(0, 3);
            const allOptions = [w.greek, ...distractors].sort(() => Math.random() - 0.5);

            generated.push({
              id: `all_r2_rev_${idx}_${w.id}`,
              type: 'reverse_choice',
              word: w,
              promptRu: `Экспресс-контроль • Выберите греческое слово: «${w.translationRu}»`,
              options: allOptions,
              correctAnswer: w.greek,
            });
          } else {
            const distractors = pool
              .filter((item) => item.id !== w.id)
              .map((item) => item.translationRu)
              .slice(0, 3);
            const allOptions = [w.translationRu, ...distractors].sort(() => Math.random() - 0.5);

            generated.push({
              id: `all_r2_mc_${idx}_${w.id}`,
              type: 'multiple_choice',
              word: w,
              promptRu: `Экспресс-контроль • Перевод слова: ${w.greek}`,
              options: allOptions,
              correctAnswer: w.translationRu,
            });
          }
        });

        // 2. Typing Input for all (Активное извлечение из памяти - перемешанный порядок)
        shuffleArray(pool).forEach((w, idx) => {
          generated.push({
            id: `all_r2_typing_${idx}_${w.id}`,
            type: 'typing_input',
            word: w,
            direction: 'greek_to_ru',
            promptRu: `Экспресс-контроль • Вспомните перевод слова: ${w.greek}`,
            correctAnswer: w.translationRu,
            hint: `Греческое слово: ${w.greek} (${w.transliterationRu})`,
          });
        });
      }

      // Финальный блиц-матчинг всех пар порции для закрепления (перемешанные пары)
      if (pool.length >= 2) {
        generated.push({
          id: `all_pairs_batch_final`,
          type: 'match_pairs',
          promptRu: 'Итоговый блиц: соедините пары слов с переводом',
          correctAnswer: 'all_matched',
          pairs: shuffleArray(pool).map((w) => ({
            greek: w.greek,
            translation: w.translationRu,
          })),
        });
      }
    }

    return generated;
  };

  const currentEx = exercises[currentIndex];

  useEffect(() => {
    if (isChunkFinished || isFinished) return;

    const generated = generateExercisesForPool(currentChunkWords, currentMode, currentDirection, currentChunkRound);
    setExercises(generated);
    setCurrentIndex(0);
    setIsFinished(false);
    setIsChunkFinished(false);
    setMistakesList([]);
    setHearts(3);
    setXpEarned(0);
    setTypoWarning(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setSelectedOption(null);
    setTypedInput('');
    setIsCardFlipped(false);
    setShowFlashcardContext(false);
    setSelectedLetters([]);
    setAvailableLetters([]);
    setMatchedPairs([]);
    setSelectedGreek(null);
    setSelectedRussian(null);
  }, [currentChunkIndex, currentMode, currentDirection, currentChunkRound, words, effectiveBatchSize, isChunkFinished, isFinished]);

  useEffect(() => {
    if (!currentEx) return;

    setTypoWarning(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setSelectedOption(null);
    setTypedInput('');
    setIsCardFlipped(false);
    setShowFlashcardContext(false);
    setFlashcardAnswer(null);
    setSelectedLetters([]);
    setSelectedGreek(null);
    setSelectedRussian(null);
    setMatchedPairs([]);

    if (currentEx.type === 'word_builder' && currentEx.letters) {
      setAvailableLetters([...currentEx.letters].sort(() => Math.random() - 0.5));
    }
    
    if (currentEx.type === 'match_pairs' && currentEx.pairs) {
      const gList = currentEx.pairs.map(p => p.greek).sort(() => Math.random() - 0.5);
      const rList = currentEx.pairs.map(p => p.translation).sort(() => Math.random() - 0.5);
      setPairOptions({ greekList: gList, russianList: rList });
    }

    if (autoPlay && currentEx.word) {
      if (currentEx.type === 'multiple_choice' || currentEx.type === 'audio_quiz') {
        speakErasmian(currentEx.word.greek, audioSpeed, voiceEngine);
      } else if (currentEx.type === 'flashcard') {
        if (currentEx.flashcardSide === 'ru_first') {
          speakRussian(currentEx.word.translationRu, 1.0);
        } else {
          speakErasmian(currentEx.word.greek, audioSpeed, voiceEngine);
        }
      } else if (currentEx.type === 'typing_input' && currentEx.direction === 'greek_to_ru') {
        speakErasmian(currentEx.word.greek, audioSpeed, voiceEngine);
      }
    }
  }, [currentEx, autoPlay, audioSpeed, voiceEngine]);

  const handleFlashcardKnow = () => {
    if (showFlashcardContext) {
      handleNextFlashcard();
      return;
    }
    setFlashcardAnswer('know');
    setShowFlashcardContext(true);
    setIsCardFlipped(true);
    setXpEarned((prev) => prev + 5);
    if (soundEffects) playSuccessChime();

    if (currentEx?.word) {
      speakErasmian(currentEx.word.greek, audioSpeed, voiceEngine);
    }
  };

  const handleFlashcardDontKnow = () => {
    if (!currentEx) return;
    if (showFlashcardContext) {
      handleNextFlashcard();
      return;
    }
    setFlashcardAnswer('dont_know');
    setShowFlashcardContext(true);
    setIsCardFlipped(true);

    // Requeue to the end of the current exercise list without adding to spaced-repetition mistakes
    const retryCard: ExerciseItem = {
      ...currentEx,
      id: `${currentEx.id}_retry_${Date.now()}`,
    };
    setExercises((prev) => [...prev, retryCard]);

    if (currentEx.word) {
      speakErasmian(currentEx.word.greek, audioSpeed, voiceEngine);
    }
  };

  const handleNextFlashcard = () => {
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleNext();
    }
  };

  // Next Question or Next Chunk or Finish Session
  const handleNext = () => {
    // Loop protection: Mistakes are re-queued at most ONCE!
    // If current exercise is already a retry attempt, do NOT append it again.
    let newLength = exercises.length;
    if (!isCorrect && currentEx.type !== 'flashcard' && !currentEx.id.includes('_retry_')) {
      const retryEx = { ...currentEx, id: `${currentEx.id}_retry_${Date.now()}` };
      setExercises((prev) => [...prev, retryEx]);
      newLength++;
    }

    if (currentIndex + 1 < newLength ) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Collect words from this chunk that had mistakes
      const chunkMistakeWords = mistakesList.map((m) => m.word);
      const totalScoredEx = exercises.filter((e) => e.type !== 'flashcard').length;
      const mistakesCount = mistakesList.length;
      const scorePercent = totalScoredEx > 0
        ? Math.max(0, Math.round(((totalScoredEx - mistakesCount) / totalScoredEx) * 100))
        : 100;

      // Current chunk finished
      if (currentChunkIndex + 1 < totalChunks ) {
        // Carry unmastered/mistake words into pending review for subsequent chunks
        if (chunkMistakeWords.length > 0 && pendingReviewWordsRef.current) {
          const nextList = [...pendingReviewWordsRef.current];
          chunkMistakeWords.forEach((mw) => {
            if (!nextList.some((p) => p.id === mw.id)) {
              nextList.push(mw);
            }
          });
          pendingReviewWordsRef.current = nextList;
        }

        // Notify parent about chunk completion
        if (onComplete) {
          onComplete(
            scorePercent,
            xpEarned + (hearts > 0 ? 15 : 5),
            mistakesList,
            {
              sectionId,
              chunkIndex: currentChunkIndex,
            },
            currentChunkWords,
            currentChunkRound
          );
        }

        // Show interim step for next chunk
        setIsChunkFinished(true);
        if (soundEffects) playSuccessChime();
      } else {
        // Complete full session
        setIsFinished(true);
        if (soundEffects) playFanfare();
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });

        onComplete(
          scorePercent,
          xpEarned + (hearts > 0 ? 15 : 5),
          mistakesList,
          {
            sectionId,
            chunkIndex: currentChunkIndex,
          },
          currentChunkWords,
          currentChunkRound
        );
      }
    }
  };

  const handleStartNextChunk = () => {
    setCurrentChunkIndex((prev) => prev + 1);
    setSelectedStageOverride(null);
    setIsChunkFinished(false);
    setIsFinished(false);
    setMistakesList([]);
  };

  const handleRestartCurrentStage = () => {
    const generated = generateExercisesForPool(currentChunkWords, currentMode, currentDirection, currentChunkRound);
    setExercises(generated);
    setCurrentIndex(0);
    setIsFinished(false);
    setIsChunkFinished(false);
    setMistakesList([]);
    setHearts(3);
    setXpEarned(0);
    setTypoWarning(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setSelectedOption(null);
    setTypedInput('');
    setIsCardFlipped(false);
    setShowFlashcardContext(false);
    setSelectedLetters([]);
    setSelectedGreek(null);
    setSelectedRussian(null);
    setMatchedPairs([]);
  };

  const handleSwitchModeAndDirection = (m: TrainingMode, d: TrainingDirection) => {
    let targetDir = d;
    if (m === 'audio' || m === 'typing') {
      targetDir = 'greek_to_ru';
    } else if (m === 'builder') {
      targetDir = 'ru_to_greek';
    }
    setCurrentMode(m);
    setCurrentDirection(targetDir);
  };

  const handleGreekSelect = (greek: string) => {
    if (selectedGreek === greek) {
      setSelectedGreek(null);
      return;
    }
    setSelectedGreek(greek);
    
    if (selectedRussian) {
      const pair = currentEx.pairs?.find(p => p.greek === greek && p.translation === selectedRussian);
      if (pair) {
        if (soundEffects) playSuccessChime();
        setMatchedPairs(prev => {
          const next = [...prev, pair.greek];
          if (next.length === currentEx.pairs?.length) {
             setIsCorrect(true);
             setIsAnswerChecked(true);
          }
          return next;
        });
        setSelectedGreek(null);
        setSelectedRussian(null);
      } else {
        if (soundEffects) playErrorBuzz();
        setHearts((prev) => Math.max(0, prev - 1));
        setSelectedGreek(null);
        setSelectedRussian(null);
      }
    }
  };

  const handleRussianSelect = (russian: string) => {
    if (selectedRussian === russian) {
      setSelectedRussian(null);
      return;
    }
    setSelectedRussian(russian);
    
    if (selectedGreek) {
      const pair = currentEx.pairs?.find(p => p.greek === selectedGreek && p.translation === russian);
      if (pair) {
        if (soundEffects) playSuccessChime();
        setMatchedPairs(prev => {
          const next = [...prev, pair.greek];
          if (next.length === currentEx.pairs?.length) {
             setIsCorrect(true);
             setIsAnswerChecked(true);
          }
          return next;
        });
        setSelectedGreek(null);
        setSelectedRussian(null);
      } else {
        if (soundEffects) playErrorBuzz();
        setHearts((prev) => Math.max(0, prev - 1));
        setSelectedGreek(null);
        setSelectedRussian(null);
      }
    }
  };

  const handleOptionSelectInstant = (option: string) => {
    if (isAnswerChecked || !currentEx) return;
    lastCheckedTimestampRef.current = Date.now();
    setSelectedOption(option);

    const correct = option === currentEx.correctAnswer;
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      if (soundEffects) playSuccessChime();
      setXpEarned((prev) => prev + 5);
    } else {
      if (soundEffects) playErrorBuzz();
      if (currentEx.word) {
        setMistakesList((prev) => {
          if (!prev.some((m) => m.word.id === currentEx.word!.id)) {
            return [...prev, { word: currentEx.word!, given: option }];
          }
          return prev;
        });
      }
      setHearts((prev) => Math.max(0, prev - 1));
    }
  };

  const handleCheckAnswer = () => {
    if (!currentEx || isAnswerChecked) return;
    lastCheckedTimestampRef.current = Date.now();

    let correct = false;
    let givenAnswer = '';

    if (currentEx.type === 'multiple_choice' || currentEx.type === 'reverse_choice' || currentEx.type === 'audio_quiz') {
      correct = selectedOption === currentEx.correctAnswer;
      givenAnswer = selectedOption || '';
    } else if (currentEx.type === 'typing_input') {
      const result = checkAnswerFlexible(typedInput, currentEx);
      correct = result.isCorrect;
      if (result.typoWarning) {
        setTypoWarning(result.typoWarning);
      }
      givenAnswer = typedInput;
    } else if (currentEx.type === 'word_builder') {
      const builtWord = selectedLetters.map((l) => l.char).join('');
      const normalize = (str: string) => str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      correct = normalize(builtWord) === normalize(currentEx.correctAnswer);
      givenAnswer = builtWord;
    } else if (currentEx.type === 'match_pairs') {
      correct = matchedPairs.length === (currentEx.pairs?.length || 0);
    }

    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      if (soundEffects) playSuccessChime();
      setXpEarned((prev) => prev + 5);
    } else {
      if (soundEffects) playErrorBuzz();
      if (currentEx.word) {
        setMistakesList((prev) => {
          if (!prev.some(m => m.word.id === currentEx.word.id)) {
             return [...prev, { word: currentEx.word, given: givenAnswer }];
          }
          return prev;
        });
      }
      setHearts((prev) => Math.max(0, prev - 1));
    }
  };

  const handleOverrideAsCorrect = () => {
    setIsCorrect(true);
    setHearts((prev) => Math.min(5, prev + 1));
    setXpEarned((prev) => prev + 5);
    if (currentEx?.word) {
      setMistakesList((prev) => prev.filter((m) => m.word.id !== currentEx.word!.id));
    }
    if (soundEffects) playSuccessChime();
  };

  // Auto-check for word_builder when assembled word matches correct answer
  useEffect(() => {
    if (
      currentEx &&
      currentEx.type === 'word_builder' &&
      !isAnswerChecked &&
      selectedLetters.length > 0
    ) {
      const builtWord = selectedLetters.map((l) => l.char).join('');
      const normalize = (str: string) =>
        str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalize(builtWord) === normalize(currentEx.correctAnswer)) {
        handleCheckAnswer();
      }
    }
  }, [selectedLetters, currentEx, isAnswerChecked]);

  // Hint: Next letter for word_builder
  const handleHintNextLetter = () => {
    if (!currentEx || isAnswerChecked) return;
    const targetStr = currentEx.correctAnswer || currentEx.word?.lemma || currentEx.word?.greek || '';
    const cleanTarget: string[] = Array.from(targetStr.replace(/[,\.;·!«»—\s]/g, ''));

    if (cleanTarget.length === 0) return;

    const normalize = (str: string) =>
      str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    let matchIndex = 0;
    while (
      matchIndex < selectedLetters.length &&
      matchIndex < cleanTarget.length &&
      normalize(selectedLetters[matchIndex].char) === normalize(cleanTarget[matchIndex])
    ) {
      matchIndex++;
    }

    let currentSelected = [...selectedLetters];
    let currentAvailable = [...availableLetters];

    if (matchIndex < currentSelected.length) {
      const wrongLetters = currentSelected.slice(matchIndex);
      currentSelected = currentSelected.slice(0, matchIndex);
      currentAvailable = [...currentAvailable, ...wrongLetters];
    }

    if (matchIndex < cleanTarget.length) {
      const neededChar = cleanTarget[matchIndex];
      const availIdx = currentAvailable.findIndex(
        (l) =>
          normalize(l.char) === normalize(neededChar) ||
          l.char === neededChar ||
          matchGreekInput(l.char, neededChar)
      );

      if (availIdx !== -1) {
        const neededLetter = currentAvailable[availIdx];
        currentAvailable.splice(availIdx, 1);
        currentSelected.push(neededLetter);
      } else {
        currentSelected.push({ id: `hint_${Date.now()}_${neededChar}`, char: neededChar });
      }
      if (soundEffects) playSuccessChime();
    }

    setSelectedLetters(currentSelected);
    setAvailableLetters(currentAvailable);
  };

  // Option: "I don't know" for word_builder
  const handleIDontKnow = () => {
    if (!currentEx || isAnswerChecked) return;

    const targetStr = currentEx.correctAnswer || currentEx.word?.lemma || currentEx.word?.greek || '';
    const cleanTarget = Array.from(targetStr.replace(/[,\.;·!«»—\s]/g, ''));

    const fullLetters = cleanTarget.map((char, idx) => ({
      id: `dont_know_${idx}_${char}`,
      char,
    }));

    setSelectedLetters(fullLetters);
    setAvailableLetters([]);
    setIsCorrect(false);
    setIsAnswerChecked(true);

    if (soundEffects) playErrorBuzz();

    if (currentEx.word) {
      setMistakesList((prev) => {
        if (!prev.some((m) => m.word.id === currentEx.word.id)) {
          return [...prev, { word: currentEx.word, given: 'Не знаю' }];
        }
        return prev;
      });
    }
    setHearts((prev) => Math.max(0, prev - 1));
  };

  // Keyboard shortcut listener for instantaneous 1-4 option choice, Space/Enter for Next / Flip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      if (isChunkFinished || isFinished) return;

      // Flashcard controls:
      // Before answer: Space (flip), 1 or Left (dont know), 2 or Enter or Right (know)
      // After answer (Context shown): Space / Enter / ArrowRight (Next)
      if (currentEx?.type === 'flashcard') {
        if (showFlashcardContext) {
          if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight' || e.key === '1' || e.key === '2') {
            e.preventDefault();
            handleNextFlashcard();
            return;
          }
        } else {
          if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            setIsCardFlipped((prev) => !prev);
            return;
          }
          if (e.key === '1' || e.key === 'ArrowLeft') {
            e.preventDefault();
            handleFlashcardDontKnow();
            return;
          }
          if (e.key === '2' || e.key === 'Enter' || e.key === 'ArrowRight') {
            e.preventDefault();
            handleFlashcardKnow();
            return;
          }
        }
        return;
      }

      // Space / Enter for advancing checked answer
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (isAnswerChecked) {
          if (Date.now() - lastCheckedTimestampRef.current > 350) {
            handleNext();
          }
        }
        return;
      }

      // Keys 1, 2, 3, 4 for instantaneous option selection in quizzes
      if (
        !isAnswerChecked &&
        currentEx &&
        (currentEx.type === 'multiple_choice' ||
          currentEx.type === 'reverse_choice' ||
          currentEx.type === 'audio_quiz') &&
        currentEx.options
      ) {
        const keyNum = parseInt(e.key, 10);
        if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= currentEx.options.length) {
          e.preventDefault();
          const chosen = currentEx.options[keyNum - 1];
          handleOptionSelectInstant(chosen);
          if (currentEx.type === 'reverse_choice') {
            speakErasmian(chosen, audioSpeed);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAnswerChecked,
    currentEx,
    isCardFlipped,
    showFlashcardContext,
    isChunkFinished,
    isFinished,
    audioSpeed,
  ]);

  if (!currentEx && !isFinished && !isChunkFinished) {
    return (
      <div className="p-8 text-center font-serif text-[#1A1A1A]">
        Подготовка упражнений...
      </div>
    );
  }

  const progressPercent = exercises.length > 0 ? ((currentIndex + 1) / exercises.length) * 100 : 0;
  const overallWordProgress = words.length > 0 
    ? Math.min(100, Math.round(((currentChunkIndex * effectiveBatchSize + currentIndex + 1) / (words.length * (currentMode === 'all' ? 2 : 1))) * 100))
    : progressPercent;

  // Interim Chunk Completion Screen
  if (isChunkFinished) {
    const chunkWordsCount = currentChunkWords.length;
    const nextStart = (currentChunkIndex + 1) * effectiveBatchSize + 1;
    const nextEnd = Math.min(words.length, (currentChunkIndex + 2) * effectiveBatchSize);
    const totalScored = exercises.filter((e) => e.type !== 'flashcard').length;
    const scorePercent = totalScored > 0
      ? Math.max(0, Math.round(((totalScored - mistakesList.length) / totalScored) * 100))
      : 100;

    const stageTitle = currentChunkRound === 0
      ? '1-й этап: Полное заучивание завершено! 🎉'
      : currentChunkRound === 1
      ? '2-й этап: Закрепление (45 мин) завершено! 🌿'
      : '3-й этап: Экспресс-контроль завершен! 🏆';

    const stageSubtitle = currentChunkRound === 0
      ? 'Вы успешно освоили блок из 5 слов во всех форматах (карточки, конструктор, письмо, тест, аудио).'
      : currentChunkRound === 1
      ? 'Слова успешно освежены и подтверждены после интервальной паузы.'
      : 'Слова надежно перенесены в долговременную память!';

    return (
      <div className="flex-1 w-full overflow-y-auto p-2.5 sm:p-6 md:p-8 bg-[#FDFCFB] flex flex-col justify-start items-center min-h-0">
        {/* Top sticky mobile exit bar */}
        <div className="w-full max-w-2xl flex items-center justify-between pb-2 mb-2 border-b border-[#E5E1DA]">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#1A1A1A] text-[#1A1A1A] text-xs font-sans font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4 text-[#8C7D6B]" />
            <span>Выход в меню</span>
          </button>
          <span className="text-[11px] font-sans text-[#8C7D6B] font-bold">
            Порция {currentChunkIndex + 1} из {totalChunks}
          </span>
        </div>

        <div className="w-full max-w-2xl my-auto p-4 sm:p-8 bg-[#F9F7F2] border border-[#1A1A1A] text-center shadow-lg font-serif animate-fadeIn relative rounded-xs">
          {/* Top-Right Close Cross */}
          <button
            type="button"
            onClick={onExit}
            className="absolute right-2.5 top-2.5 p-1.5 text-[#6B655C] hover:text-[#1A1A1A] hover:bg-[#E5E1DA] rounded-full transition-colors cursor-pointer"
            title="Закрыть и выйти в главное меню"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#8C7D6B] font-bold block mb-1">
            Порция {currentChunkIndex + 1} из {totalChunks} • {currentChunkRound === 0 ? '1-й этап' : currentChunkRound === 1 ? '2-й этап' : '3-й этап'}
          </span>
          <h2 className="text-xl sm:text-3xl text-[#1A1A1A] mb-1.5 sm:mb-2 font-serif italic font-bold pr-6">
            {stageTitle}
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#6B655C] mb-4 sm:mb-5">
            {stageSubtitle}
          </p>

          {/* Score Metric */}
          <div className="mb-4 sm:mb-5 text-left">
            <div className="border border-[#E5E1DA] p-3 sm:p-4 bg-white rounded-xs shadow-2xs flex items-center justify-between">
              <span className="text-xs font-sans uppercase text-[#8C7D6B] font-bold block">Точность ответов</span>
              <span className="text-2xl sm:text-3xl font-serif text-[#1A1A1A] font-bold">{scorePercent}%</span>
            </div>
          </div>

          {/* Spaced repetition interval note / Warmup note */}
          {isWarmupSession ? (
            <div className="border border-amber-300 bg-amber-50 p-3 sm:p-4 rounded-xs text-left mb-4 sm:mb-5 space-y-1.5 sm:space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-sans font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>⏱ Внезачетная разминка завершена</span>
              </div>
              <p className="text-[11px] font-sans text-amber-950/85 leading-relaxed">
                Вы отлично освежили слова в памяти! По методике интервального повторения, официальный зачетный переход на следующий этап откроется через <strong>{warmupRemainingText}</strong>.
              </p>
            </div>
          ) : (
            <div className="border border-[#A2C7A8] bg-[#F0F4F1] p-3 sm:p-4 rounded-xs text-left mb-4 sm:mb-5 space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#2D4A32]">
                <Brain className="w-4 h-4 text-[#2D4A32] shrink-0" />
                {currentChunkRound === 0 ? (
                  <span>⏳ 2-й этап закрепит эти слова через 45 минут</span>
                ) : currentChunkRound === 1 ? (
                  <span>⏳ 3-й этап (Экспресс-контроль) откроется через 24 часа</span>
                ) : (
                  <span>✅ Слова перешли в долговременную память (Статус: Выучено)</span>
                )}
              </div>
              <p className="text-[11px] font-sans text-[#3A4A3E] leading-relaxed">
                {currentChunkRound === 0 ? (
                  <>
                    По методике интервального повторения Эббингауза, мозгу требуется время для закрепления. Эта порция переведена в режим ожидания. <strong>Повторение станет доступно в кабинете через 45 минут.</strong> Сейчас вы можете сделать паузу или начать учить следующую порцию новых слов.
                  </>
                ) : currentChunkRound === 1 ? (
                  <>
                    Интервальный контроль пройден! Финальное повторение откроется завтра в кабинете студента.
                  </>
                ) : (
                  <>
                    Все 3 этапа интервального повторения успешно пройдены. Слова зафиксированы в долговременной памяти.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Learned Words in this chunk preview */}
          <div className="border border-[#E5E1DA] bg-white p-3 sm:p-4 text-left mb-4 sm:mb-5">
            <div className="flex justify-between items-center text-xs font-sans text-[#8C7D6B] font-bold mb-2 sm:mb-3">
              <span>Изученные слова ({currentChunkWords.length}):</span>
              <span>Порция {currentChunkIndex + 1}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 max-h-40 sm:max-h-48 overflow-y-auto pr-1">
              {currentChunkWords.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-[#E5E1DA] rounded-xs text-xs font-sans"
                >
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-serif text-sm sm:text-base font-bold text-[#1A1A1A]">{w.greek}</span>
                      <span className="text-[10px] text-[#8C7D6B]">[{w.transliterationRu}]</span>
                    </div>
                    <div className="text-[#2C3E50] italic text-[11px]">{w.translationRu}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakErasmian(w.greek, 0.85)}
                    className="p-1.5 border border-[#E5E1DA] hover:border-[#1A1A1A] bg-white hover:bg-[#F9F7F2] text-[#1A1A1A] transition-colors cursor-pointer rounded-xs shrink-0"
                    title="Озвучить на греческом"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mistakes Section if any */}
          {mistakesList.length > 0 && (
            <div className="border border-[#E5E1DA] bg-white p-3 text-left mb-4 sm:mb-5">
              <span className="text-[11px] font-sans uppercase tracking-wider text-[#8C5E14] font-bold block mb-2">
                Были ошибки при прохождении ({mistakesList.length}):
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {mistakesList.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-[#FFF9F2] border border-[#F0DFCD]">
                    <span className="font-serif font-bold text-[#1A1A1A]">{m.word.greek}</span>
                    <span className="text-[#8C5E14] italic">{m.word.translationRu}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons: Return to Hub (Primary), Next Chunk (Optional), Restart Stage */}
          <div className="pt-3 sm:pt-4 border-t border-[#E5E1DA] flex flex-col sm:flex-row justify-between items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleRestartCurrentStage}
              className="w-full sm:w-auto px-3.5 py-2.5 border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs font-sans text-[#6B655C] hover:text-[#1A1A1A] transition-colors cursor-pointer flex items-center justify-center gap-1.5 order-3 sm:order-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Повторить этап</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
              <button
                type="button"
                onClick={onExit}
                className="px-5 py-2.5 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#FAF8F5] text-xs font-sans uppercase tracking-wider font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <X className="w-4 h-4 text-[#8C7D6B]" />
                <span>В главное меню</span>
              </button>

              {currentChunkIndex + 1 < totalChunks && (
                <button
                  type="button"
                  onClick={handleStartNextChunk}
                  className="px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Порция {currentChunkIndex + 2} ({nextStart}–{nextEnd})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Finished Session Screen (Final Chunk completed)
  if (isFinished) {
    const totalScored = exercises.filter((e) => e.type !== 'flashcard').length;
    const finalScore = totalScored > 0
      ? Math.max(0, Math.round(((totalScored - mistakesList.length) / totalScored) * 100))
      : 100;

    return (
      <div className="flex-1 w-full overflow-y-auto p-2.5 sm:p-6 md:p-8 bg-[#FDFCFB] flex flex-col justify-start items-center min-h-0">
        {/* Top sticky mobile exit bar */}
        <div className="w-full max-w-2xl flex items-center justify-between pb-2 mb-2 border-b border-[#E5E1DA]">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#1A1A1A] text-[#1A1A1A] text-xs font-sans font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4 text-[#8C7D6B]" />
            <span>Выход в меню</span>
          </button>
          <span className="text-[11px] font-sans text-[#2D4A32] font-bold">
            Тема завершена ✓
          </span>
        </div>

        <div className="w-full max-w-2xl my-auto p-4 sm:p-8 bg-[#F9F7F2] border border-[#1A1A1A] text-center shadow-lg font-serif animate-fadeIn relative rounded-xs">
          {/* Top-Right Close Cross */}
          <button
            type="button"
            onClick={onExit}
            className="absolute right-2.5 top-2.5 p-1.5 text-[#6B655C] hover:text-[#1A1A1A] hover:bg-[#E5E1DA] rounded-full transition-colors cursor-pointer"
            title="Закрыть и выйти в главное меню"
          >
            <X className="w-5 h-5" />
          </button>

          <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#8C7D6B] font-bold block mb-1">
            Все порции темы пройдены! 🌿
          </span>
          <h2 className="text-xl sm:text-3xl text-[#1A1A1A] mb-1.5 sm:mb-2 font-serif italic font-bold pr-6">
            {finalScore >= 80 ? 'Ἄριστα! (Превосходно)' : 'Качественная практика!'}
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#6B655C] mb-4 sm:mb-5">
            Результаты тренировки записаны в ваш профиль и зафиксированы в интервальной системе повторения.
          </p>

          <div className="mb-4 sm:mb-5 text-left">
            <div className="border border-[#E5E1DA] p-3 sm:p-4 bg-white rounded-xs shadow-2xs flex items-center justify-between">
              <span className="text-xs font-sans uppercase text-[#8C7D6B] font-bold block">Точность</span>
              <span className="text-2xl sm:text-3xl font-serif text-[#1A1A1A] font-bold">{finalScore}%</span>
            </div>
          </div>

          {/* Spaced repetition interval note */}
          {isWarmupSession ? (
            <div className="border border-amber-300 bg-amber-50 p-3 sm:p-4 rounded-xs text-left mb-4 sm:mb-5 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-sans font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>⏱ Внезачетная разминка завершена</span>
              </div>
              <p className="text-[11px] font-sans text-amber-950/85 leading-relaxed">
                Вы отлично освежили слова в памяти! Полноценное зачетное повторение откроется в кабинете через <strong>{warmupRemainingText}</strong>, когда истечет интервал закрепления.
              </p>
            </div>
          ) : (
            <div className="border border-[#A2C7A8] bg-[#F0F4F1] p-3 sm:p-4 rounded-xs text-left mb-4 sm:mb-5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#2D4A32]">
                <Brain className="w-4 h-4 text-[#2D4A32] shrink-0" />
                <span>Интервальный контроль (Ebbinghaus Spaced Repetition)</span>
              </div>
              <p className="text-[11px] font-sans text-[#3A4A3E] leading-relaxed">
                Этап завершен. Следующее зачетное повторение станет доступно в личном кабинете после необходимой для закрепления памяти паузы.
              </p>
            </div>
          )}

          {/* Mistakes Review */}
          <div className="text-left mb-4 sm:mb-5">
            <span className="text-xs font-sans uppercase tracking-wider text-[#8C7D6B] font-bold block mb-2">
              Результаты по словам:
            </span>
            {mistakesList.length === 0 ? (
              <p className="text-xs font-sans text-[#2D4A32] italic bg-[#C5D9C8] p-3 border border-[#2D4A32]/20">
                ✓ Потрясающе! Все упражнения пройдены без единой ошибки.
              </p>
            ) : (
              <div className="border border-[#E5E1DA] bg-white p-3 space-y-1.5 max-h-36 overflow-y-auto">
                {mistakesList.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-[#E5E1DA] text-xs font-sans"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-serif text-base font-bold text-[#1A1A1A]">
                        {m.word.greek}
                      </span>
                      <span className="text-[#6B655C]">({m.word.transliterationRu})</span>
                    </div>
                    <span className="text-[#8C5E14] italic">{m.word.translationRu}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-3 sm:pt-4 border-t border-[#E5E1DA] gap-2.5">
            <button
              type="button"
              onClick={handleRestartCurrentStage}
              className="w-full sm:w-auto px-3.5 py-2.5 border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs font-sans text-[#6B655C] hover:text-[#1A1A1A] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Повторить этап</span>
            </button>

            <button
              type="button"
              onClick={onExit}
              className="w-full sm:w-auto px-8 py-3 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] font-sans uppercase tracking-widest text-xs transition-colors cursor-pointer font-bold shadow-2xs flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Вернуться в меню курса</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const modeLabels: Record<TrainingMode, { title: string; icon: React.ReactNode }> = {
    all: { title: 'Общий тренажер', icon: <Sparkles className="w-3.5 h-3.5" /> },
    flashcards: { title: 'Карточки', icon: <Layers className="w-3.5 h-3.5" /> },
    builder: { title: 'Конструктор', icon: <Puzzle className="w-3.5 h-3.5" /> },
    typing: { title: 'Письмо', icon: <KeyboardIcon className="w-3.5 h-3.5" /> },
    quiz: { title: 'Тест', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    audio: { title: 'Аудио', icon: <Headphones className="w-3.5 h-3.5" /> },
    match: { title: 'Сопоставление', icon: <Shuffle className="w-3.5 h-3.5" /> },
  };

  const directionLabels: Record<TrainingDirection, { title: string; symbol: string }> = {
    bidirectional: { title: 'Двусторонний', symbol: '🔄 GR ↔ RU' },
    greek_to_ru: { title: 'Греческий ➔ Русский', symbol: '🇬🇷 ➔ 🇷🇺' },
    ru_to_greek: { title: 'Русский ➔ Греческий', symbol: '🇷🇺 ➔ 🇬🇷' },
  };

  const currentBatchLabel = totalChunks > 1
    ? `Порция ${currentChunkIndex + 1}/${totalChunks} (слова ${currentChunkIndex * effectiveBatchSize + 1}–${Math.min(words.length, (currentChunkIndex + 1) * effectiveBatchSize)})`
    : `Все слова (${words.length})`;

  return (
    <div className="flex-1 flex flex-col justify-between p-2 sm:p-4 md:p-6 bg-[#FDFCFB] overflow-y-auto font-serif min-h-0 pt-[max(env(safe-area-inset-top),44px)] sm:pt-4 pb-[max(env(safe-area-inset-bottom),10px)]">
      {/* Top Bar: Mode badge, Progress, Direction Toggle, Hearts */}
      <header className="border-b border-[#E5E1DA] pb-1 sm:pb-3 mb-1 sm:mb-2 shrink-0">
        <div className="flex flex-col gap-1 sm:gap-2">
          {/* Top Row: Exit Button, Progress Bar & Exercise Counter */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full">
            <button
              type="button"
              onClick={onExit}
              className="text-[10px] sm:text-xs font-sans uppercase tracking-wider text-[#6B655C] hover:text-[#1A1A1A] px-2 sm:px-2.5 py-1 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] rounded transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
              title="Выйти из тренировки"
            >
              <X className="w-3.5 h-3.5 text-[#8C7D6B]" />
              <span>Выход</span>
            </button>

            <div className="flex-1 max-w-lg space-y-0.5">
              <div className="h-1.5 sm:h-2 bg-[#E5E1DA] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2D4A32] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-sans text-[#8C7D6B]">
                <span className="font-medium truncate max-w-[120px] sm:max-w-xs">{currentBatchLabel}</span>
                <span className="font-bold text-[#1A1A1A]">{currentIndex + 1} / {exercises.length}</span>
              </div>
            </div>

            {/* Mobile Filters Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              className={`sm:hidden px-2 py-1 border rounded text-[10px] font-sans flex items-center gap-1 font-bold transition-colors cursor-pointer shadow-2xs ${
                showMobileFilters 
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' 
                  : 'bg-white text-[#4A443D] border-[#E5E1DA]'
              }`}
              title="Настройки режима и этапа"
            >
              <span>⚙</span>
              <span>Режим</span>
            </button>

          </div>

          {/* Interim Warmup Status Banner */}
          {isWarmupSession && (
            <div className="bg-amber-50/90 border border-amber-200/80 text-amber-900 text-[10px] sm:text-xs px-2.5 py-1 rounded-sm flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Внезачетная разминка (интервал закрепления ещё не истёк)</span>
              </div>
              <span className="font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] whitespace-nowrap">
                Зачёт через {warmupRemainingText}
              </span>
            </div>
          )}

          {/* Bottom Row: Stage Selector (when mode is 'all'), Mode & Direction Selectors */}
          <div className={`items-center justify-between gap-1 sm:gap-2 font-sans pt-1 border-t border-[#E5E1DA]/50 ${
            showMobileFilters ? 'flex flex-wrap' : 'hidden sm:flex'
          }`}>
            {/* Stage Selector for All-in-one practice */}
            {currentMode === 'all' ? (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-white border border-[#E5E1DA] p-0.5 rounded text-[9px] sm:text-[10px] font-sans shadow-2xs">
                <span className="text-[#8C7D6B] font-bold px-1 hidden xs:inline">Этап:</span>
                <button
                  type="button"
                  onClick={() => setSelectedStageOverride(0)}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded font-bold transition-all cursor-pointer ${
                    currentChunkRound === 0 
                      ? 'bg-[#2D4A32] text-white shadow-2xs' 
                      : 'text-[#5C5549] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
                  }`}
                  title="1-й этап: Полное заучивание (Карточки, Тест, Конструктор, Письмо, Аудио, Блиц)"
                >
                  1. Полный
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStageOverride(1)}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded font-bold transition-all cursor-pointer ${
                    currentChunkRound === 1 
                      ? 'bg-[#8C5E14] text-white shadow-2xs' 
                      : 'text-[#5C5549] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
                  }`}
                  title="2-й этап: Закрепление через 45 мин (Тест, Аудио, Письмо, Блиц)"
                >
                  2. 45 мин
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStageOverride(2)}
                  className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded font-bold transition-all cursor-pointer ${
                    currentChunkRound >= 2 
                      ? 'bg-[#1E3A8A] text-white shadow-2xs' 
                      : 'text-[#5C5549] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'
                  }`}
                  title="3-й этап: Экспресс-контроль (Быстрый тест, Письмо, Блиц)"
                >
                  3. Экспресс
                </button>
              </div>
            ) : <div />}

            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap ml-auto">
              {/* Mode Selector Dropdown / Pills */}
              <div className="flex items-center border border-[#E5E1DA] bg-white text-[10px] sm:text-[11px] p-0.5 rounded shadow-2xs">
                {(['all', 'flashcards', 'builder', 'typing', 'quiz', 'audio', 'match'] as TrainingMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSwitchModeAndDirection(m, currentDirection)}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center gap-1 rounded transition-colors cursor-pointer ${
                      currentMode === m
                        ? 'bg-[#1A1A1A] text-white font-bold'
                        : 'text-[#6B655C] hover:text-[#1A1A1A]'
                    }`}
                    title={modeLabels[m].title}
                  >
                    {modeLabels[m].icon}
                    <span className="hidden md:inline">{modeLabels[m].title}</span>
                  </button>
                ))}
              </div>

              {/* Direction Selector */}
              <div className="flex items-center border border-[#E5E1DA] bg-white text-[10px] sm:text-[11px] p-0.5 rounded shadow-2xs">
                {(['bidirectional', 'greek_to_ru', 'ru_to_greek'] as TrainingDirection[]).map((d) => {
                  const isFixedMode = currentMode === 'audio' || currentMode === 'builder' || currentMode === 'typing';
                  const activeDir = isFixedMode
                    ? (currentMode === 'builder' ? 'ru_to_greek' : 'greek_to_ru')
                    : currentDirection;

                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={isFixedMode}
                      onClick={() => handleSwitchModeAndDirection(currentMode, d)}
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors cursor-pointer ${
                        activeDir === d
                          ? 'bg-[#1A1A1A] text-white font-bold'
                          : isFixedMode
                          ? 'text-[#C5BEB3] opacity-40 cursor-not-allowed'
                          : 'text-[#6B655C] hover:text-[#1A1A1A]'
                      }`}
                      title={
                        isFixedMode
                          ? `Режим «${modeLabels[currentMode].title}» фиксирован: ${activeDir === 'greek_to_ru' ? 'Греческий ➔ Русский' : 'Русский ➔ Греческий'}`
                          : directionLabels[d].title
                      }
                    >
                      <span>{directionLabels[d].symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Exercise View */}
      <main className={`max-w-2xl mx-auto w-full flex-1 flex flex-col min-h-0 ${currentEx.type === 'match_pairs' ? 'justify-start my-0 py-0.5' : 'justify-center my-0 sm:my-auto py-0.5 sm:py-1'}`}>
        {/* Exercise Prompt */}
        <div className={`text-center flex flex-col min-h-0 ${currentEx.type === 'match_pairs' ? 'flex-1 mb-0.5 justify-between' : 'mb-1 sm:mb-2.5'}`}>
          <span className="text-[10px] sm:text-xs font-sans text-[#8C7D6B] uppercase tracking-wider block mb-0.5 sm:mb-1 font-bold shrink-0">
            {currentEx.promptRu}
          </span>

          {/* =============================================================== */}
          {/* 1. Flashcard Component (With 3D Flip & Self-Testing) */}
          {/* =============================================================== */}
          {currentEx.type === 'flashcard' && currentEx.word && (
            <div className="max-w-lg mx-auto space-y-1.5 sm:space-y-3 w-full">
              {showFlashcardContext ? (
                /* Full Context Card after answering Know / Don't Know */
                <div className="border-2 border-[#1A1A1A] p-3 sm:p-5 bg-[#F9F7F2] text-center shadow-xs min-h-[140px] sm:min-h-56 flex flex-col justify-between rounded-xs animate-fadeIn">
                  <div>
                    {/* Status Badge */}
                    <div className="flex justify-center mb-2">
                      {flashcardAnswer === 'know' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAF2EC] border border-[#2D4A32]/30 text-[#2D4A32] font-sans text-xs font-bold rounded-xs shadow-2xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>Знаю</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF0F0] border border-[#9E3B3B]/30 text-[#9E3B3B] font-sans text-xs font-bold rounded-xs shadow-2xs">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Не знаю (повторим в конце урока)</span>
                        </span>
                      )}
                    </div>

                    {/* Greek Header */}
                    <div className="flex justify-center items-center gap-2 sm:gap-3 py-1">
                      <span className={`font-serif text-[#1A1A1A] font-bold ${greekFontClass}`}>
                        {currentEx.word.article ? `${currentEx.word.article} ` : ''}
                        {currentEx.word.greek}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakErasmian(currentEx.word!.greek, audioSpeed, voiceEngine)}
                        className="p-1.5 sm:p-2 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer rounded-xs"
                        title="Прослушать произношение Эразма"
                      >
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    {/* Phonetics */}
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-sans text-[#6B655C]">
                      {showTranslit && <span>[{currentEx.word.transliterationRu}]</span>}
                      {currentEx.word.partOfSpeechRu && <span>• {currentEx.word.partOfSpeechRu}</span>}
                      {showIpa && currentEx.word.erasmianIpa && (
                        <span className="font-mono text-[11px] text-[#8C7D6B]">IPA: {currentEx.word.erasmianIpa}</span>
                      )}
                    </div>

                    {/* Translation */}
                    <div className="my-2 py-1 border-t border-b border-[#E5E1DA]">
                      <h3 className="text-xl sm:text-2xl font-serif text-[#1A1A1A] font-bold">
                        {currentEx.word.translationRu}
                      </h3>
                      {currentEx.word.additionalMeaningsRu && currentEx.word.additionalMeaningsRu.length > 0 && (
                        <p className="text-[11px] sm:text-xs font-sans text-[#6B655C] mt-0.5">
                          Другие значения: {currentEx.word.additionalMeaningsRu.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Biblical Context Snippet */}
                    <WordContextSnippet word={currentEx.word} />

                    {/* Mnemonic association */}
                    <EditableMnemonic
                      word={currentEx.word}
                      customMnemonics={customMnemonics}
                      onUpdateMnemonic={onUpdateMnemonic}
                      isEngine={true}
                      className="mt-2"
                    />
                  </div>
                </div>
              ) : (
                /* Interactive Flip Card before evaluating */
                <div
                  onClick={() => {
                    const nextFlipped = !isCardFlipped;
                    setIsCardFlipped(nextFlipped);
                    if (nextFlipped) {
                      if (currentEx.flashcardSide === 'ru_first') {
                        speakErasmian(currentEx.word!.greek, audioSpeed, voiceEngine);
                      } else {
                        speakRussian(currentEx.word!.translationRu, 1.0);
                      }
                    }
                  }}
                  className="border-2 border-[#1A1A1A] p-2.5 sm:p-5 bg-[#F9F7F2] text-center shadow-xs cursor-pointer min-h-[130px] sm:min-h-52 flex flex-col justify-between hover:border-[#2C3E50] transition-all relative group rounded-xs"
                >
                  <span className="text-[9px] sm:text-[10px] font-sans uppercase tracking-wider text-[#8C7D6B] block">
                    {isCardFlipped ? 'Оборотная сторона (Перевод)' : 'Лицевая сторона (Нажмите, чтобы перевернуть)'}
                  </span>

                  {/* Front / Back display based on side and flip state */}
                  {(!isCardFlipped && currentEx.flashcardSide !== 'ru_first') || (isCardFlipped && currentEx.flashcardSide === 'ru_first') ? (
                    /* Greek Face */
                    <div className="py-1.5 sm:py-3 space-y-1 sm:space-y-2">
                      <div className="flex justify-center items-center gap-2 sm:gap-3">
                        <span className={`font-serif text-[#1A1A1A] font-bold ${greekFontClass}`}>
                          {currentEx.word.article ? `${currentEx.word.article} ` : ''}
                          {currentEx.word.greek}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakErasmian(currentEx.word!.greek, audioSpeed, voiceEngine);
                          }}
                          className="p-1.5 sm:p-2 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer rounded-xs"
                          title="Прослушать произношение Эразма"
                        >
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>

                      {showTranslit && (
                        <p className="text-xs sm:text-sm font-sans text-[#6B655C] tracking-wide">
                          [{currentEx.word.transliterationRu}] • {currentEx.word.partOfSpeechRu}
                        </p>
                      )}

                      {showIpa && currentEx.word.erasmianIpa && (
                        <p className="text-[11px] sm:text-xs font-mono text-[#8C7D6B]">
                          IPA: {currentEx.word.erasmianIpa}
                        </p>
                      )}

                      {/* Mnemonic association */}
                      {currentEx.word && (
                        <EditableMnemonic word={currentEx.word} customMnemonics={customMnemonics} onUpdateMnemonic={onUpdateMnemonic} isEngine={true} className="mt-1 sm:mt-2" />
                      )}
                    </div>
                  ) : (
                    /* Russian Translation Face */
                    <div className="py-1.5 sm:py-3 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1A1A1A] font-bold">
                          {currentEx.word.translationRu}
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); speakRussian(currentEx.word!.translationRu, 1.0); }}
                          className="p-1.5 sm:p-2 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-[#F9F7F2] rounded-full transition-colors cursor-pointer"
                          title="Произнести по-русски"
                        >
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      {currentEx.word.additionalMeaningsRu && currentEx.word.additionalMeaningsRu.length > 0 && (
                        <p className="text-[11px] sm:text-xs font-sans text-[#6B655C]">
                          Другие значения: {currentEx.word.additionalMeaningsRu.join(', ')}
                        </p>
                      )}

                      {/* Mnemonic hint in Russian card view */}
                      {currentEx.word && (
                        <EditableMnemonic word={currentEx.word} customMnemonics={customMnemonics} onUpdateMnemonic={onUpdateMnemonic} className="!mt-2 sm:!mt-4" />
                      )}
                    </div>
                  )}

                  <span className="text-[10px] sm:text-xs font-sans text-[#8C7D6B] underline flex items-center justify-center gap-1 mt-1 sm:mt-2">
                    <RotateCcw className="w-3 h-3" /> Перевернуть карточку (Пробел / Клик)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* 2. Multiple Choice Component (Greek -> Russian) */}
          {/* =============================================================== */}
          {currentEx.type === 'multiple_choice' && currentEx.word && (
            <div className="space-y-2 sm:space-y-4 max-w-lg mx-auto w-full">
              <div className="p-2.5 sm:p-4 bg-[#F9F7F2] border border-[#E5E1DA] inline-block min-w-[200px] sm:min-w-[280px]">
                <div className="flex justify-center items-center gap-2 sm:gap-3">
                  <span className={`font-serif text-[#1A1A1A] font-bold ${greekFontClass}`}>
                    {currentEx.word.article ? `${currentEx.word.article} ` : ''}
                    {currentEx.word.greek}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakErasmian(currentEx.word!.greek, audioSpeed, voiceEngine)}
                    className="p-1 sm:p-1.5 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                {showTranslit && (
                  <p className="text-xs font-sans text-[#6B655C] mt-0.5">
                    [{currentEx.word.transliterationRu}]
                  </p>
                )}
                {isAnswerChecked && <WordContextSnippet word={currentEx.word} />}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 max-w-lg mx-auto font-serif">
                {currentEx.options?.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isAnswer = option === currentEx.correctAnswer;
                  
                  let btnStyle = 'border-[#E5E1DA] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]';
                  if (isSelected && !isAnswerChecked) {
                    btnStyle = 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs';
                  } else if (isAnswerChecked) {
                    if (isAnswer) {
                      btnStyle = 'border-[#2D4A32] bg-[#C5D9C8] text-[#2D4A32] font-bold';
                    } else if (isSelected && !isAnswer) {
                      btnStyle = 'border-[#9E3B3B] bg-[#F5DCDC] text-[#9E3B3B] line-through';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => handleOptionSelectInstant(option)}
                      className={`p-2.5 sm:p-3.5 border text-center transition-all cursor-pointer text-base sm:text-lg font-sans font-medium active:scale-95 relative flex items-center justify-center rounded-xs leading-snug shadow-2xs ${btnStyle}`}
                    >
                      <span className="absolute left-1.5 top-1.5 text-[9px] font-sans px-1 py-0.2 border border-current opacity-60 rounded-xs font-mono">
                        {idx + 1}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 3. Reverse Choice Component (Russian -> Greek) */}
          {/* =============================================================== */}
          {currentEx.type === 'reverse_choice' && (
            <div className="space-y-2 sm:space-y-4 max-w-lg mx-auto w-full">
              <div className="p-2.5 sm:p-4 bg-[#F9F7F2] border border-[#E5E1DA] inline-block min-w-[200px] sm:min-w-[280px]">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                  <h3 className="text-xl sm:text-3xl font-serif text-[#1A1A1A] font-bold">
                    {currentEx.word ? currentEx.word.translationRu : currentEx.promptRu}
                  </h3>
                  <button
                    type="button"
                    onClick={() => speakRussian(currentEx.word ? currentEx.word.translationRu : currentEx.promptRu, 1.0)}
                    className="p-1 sm:p-1.5 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-white rounded-full transition-colors cursor-pointer"
                    title="Произнести по-русски"
                  >
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                {isAnswerChecked && <WordContextSnippet word={currentEx.word} />}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 max-w-lg mx-auto font-serif">
                {currentEx.options?.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isAnswer = option === currentEx.correctAnswer;

                  let btnStyle = 'border-[#E5E1DA] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]';
                  if (isSelected && !isAnswerChecked) {
                    btnStyle = 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs';
                  } else if (isAnswerChecked) {
                    if (isAnswer) {
                      btnStyle = 'border-[#2D4A32] bg-[#C5D9C8] text-[#2D4A32] font-bold';
                    } else if (isSelected && !isAnswer) {
                      btnStyle = 'border-[#9E3B3B] bg-[#F5DCDC] text-[#9E3B3B] line-through';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => {
                        handleOptionSelectInstant(option);
                        speakErasmian(option, audioSpeed);
                      }}
                      className={`p-2.5 sm:p-3.5 border text-center transition-all cursor-pointer text-lg sm:text-2xl font-serif font-bold active:scale-95 relative flex items-center justify-center rounded-xs shadow-2xs ${btnStyle}`}
                    >
                      <span className="absolute left-1.5 top-1.5 text-[9px] font-sans px-1 py-0.2 border border-current opacity-60 rounded-xs font-mono">
                        {idx + 1}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 4. Match Pairs Component */}
          {/* =============================================================== */}
          {currentEx.type === 'match_pairs' && currentEx.pairs && (
            <div className="flex-1 flex flex-col justify-between max-w-xl mx-auto w-full min-h-0 py-0.5">
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3 text-center font-serif flex-1 min-h-0">
                {/* Greek Column */}
                <div className="flex flex-col justify-between gap-1 sm:gap-1.5 h-full min-h-0">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-wider text-[#8C7D6B] font-bold block shrink-0">
                    Греческие слова
                  </span>
                  <div className="flex-1 flex flex-col justify-between gap-1 sm:gap-1.5 min-h-0">
                    {pairOptions.greekList.map((greek, idx) => {
                      const isMatched = matchedPairs.includes(greek);
                      const isSelected = selectedGreek === greek;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isMatched || isAnswerChecked}
                          onClick={() => handleGreekSelect(greek)}
                          className={`flex-1 min-h-[30px] max-h-[52px] w-full px-1.5 sm:px-3 py-0.5 sm:py-1 border text-sm sm:text-base md:text-lg font-serif font-bold transition-all cursor-pointer rounded-xs flex items-center justify-center text-center select-none shadow-2xs ${
                            isMatched
                              ? 'bg-[#D1E7DD] border-[#2D4A32] text-[#2D4A32] opacity-80 cursor-default font-semibold shadow-none'
                              : isSelected
                              ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs'
                              : 'border-[#E5E1DA] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]'
                          }`}
                        >
                          <span className="truncate">{greek}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Russian Column */}
                <div className="flex flex-col justify-between gap-1 sm:gap-1.5 h-full min-h-0">
                  <span className="text-[10px] sm:text-xs font-sans uppercase tracking-wider text-[#8C7D6B] font-bold block shrink-0">
                    Русский перевод
                  </span>
                  <div className="flex-1 flex flex-col justify-between gap-1 sm:gap-1.5 min-h-0">
                    {pairOptions.russianList.map((ru, idx) => {
                      const isMatched = currentEx.pairs?.some(
                        (p) => matchedPairs.includes(p.greek) && p.translation === ru
                      );
                      const isSelected = selectedRussian === ru;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isMatched || isAnswerChecked}
                          onClick={() => handleRussianSelect(ru)}
                          className={`flex-1 min-h-[30px] max-h-[52px] w-full px-1.5 sm:px-3 py-0.5 sm:py-1 border text-xs sm:text-sm md:text-base font-sans font-medium transition-all cursor-pointer rounded-xs flex items-center justify-center text-center select-none leading-tight shadow-2xs ${
                            isMatched
                              ? 'bg-[#D1E7DD] border-[#2D4A32] text-[#2D4A32] opacity-80 cursor-default font-semibold shadow-none'
                              : isSelected
                              ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs font-bold'
                              : 'border-[#E5E1DA] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]'
                          }`}
                        >
                          <span className="line-clamp-2 leading-tight">{ru}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 5. Word Letter Builder Component (Конструктор слова) */}
          {/* =============================================================== */}
          {currentEx.type === 'word_builder' && (
            <div className="space-y-2 sm:space-y-3.5 max-w-xl mx-auto w-full">
              {/* Target Translation / Meaning Prompt Card */}
              <div className="p-2.5 sm:p-4 bg-[#F9F7F2] border border-[#E5E1DA] text-center space-y-1 shadow-2xs">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[9px] sm:text-[10px] font-sans uppercase tracking-wider text-[#8C7D6B] font-bold">
                    Соберите слово по буквам
                  </span>
                  {currentEx.word?.thematicGroupNameRu && (
                    <span className="px-1.5 py-0.5 bg-[#E5E1DA] text-[#1A1A1A] text-[9px] font-bold rounded uppercase">
                      {currentEx.word.thematicGroupNameRu}
                    </span>
                  )}
                </div>
                <div className="flex justify-center items-center gap-2">
                  <h3 className="text-2xl sm:text-3xl font-serif text-[#1A1A1A] font-bold">
                    {currentEx.word ? currentEx.word.translationRu : currentEx.correctAnswer}
                  </h3>
                  <button
                    type="button"
                    onClick={() => speakRussian(currentEx.word ? currentEx.word.translationRu : currentEx.correctAnswer, 1.0)}
                    className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-white rounded-full transition-colors cursor-pointer"
                    title="Произнести по-русски"
                  >
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                {isAnswerChecked && showTranslit && currentEx.word?.transliterationRu && (
                  <p className="text-xs sm:text-sm font-sans text-[#6B655C] italic">
                    Транскрипция: [{currentEx.word.transliterationRu}]
                  </p>
                )}
                {isAnswerChecked && <WordContextSnippet word={currentEx.word} />}

                {/* Hints and Helper Toolbar for Word Builder */}
                {!isAnswerChecked && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1.5 border-t border-[#E5E1DA] font-sans text-[10px] sm:text-xs">
                    <button
                      type="button"
                      onClick={() => speakErasmian(currentEx.word?.greek || currentEx.correctAnswer, audioSpeed, voiceEngine)}
                      className="px-2.5 py-1 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs hover:bg-[#FAF8F5] rounded-xs font-medium"
                      title="Озвучить греческое слово"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#2C3E50]" />
                      <span>Произнести</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleHintNextLetter}
                      className="px-2.5 py-1 bg-white border border-[#E5E1DA] hover:border-[#D4A373] text-[#1A1A1A] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs hover:bg-[#FFFDF9] rounded-xs font-medium"
                      title="Подсказать следующую правильную букву"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-[#D4A373]" />
                      <span>Подсказать букву</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleIDontKnow}
                      className="px-2.5 py-1 bg-white border border-[#E5E1DA] hover:border-[#9E3B3B] text-[#9E3B3B] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs hover:bg-[#FDF8F8] rounded-xs font-medium"
                      title="Сдаться и посмотреть ответ"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#9E3B3B]" />
                      <span>Я не знаю</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Word Construction Slot Tray (Selected Letters) */}
              <div className="space-y-1.5">
                <div className="min-h-12 sm:min-h-16 p-1.5 sm:p-2.5 border-2 border-dashed border-[#8C7D6B] bg-white flex flex-wrap gap-1.5 sm:gap-2 items-center justify-center rounded-xs">
                  {selectedLetters.length === 0 ? (
                    <span className="text-xs sm:text-sm font-sans text-[#8C7D6B] italic select-none">
                      Нажимайте на греческие буквы ниже, чтобы составить слово...
                    </span>
                  ) : (
                    selectedLetters.map((letItem, idx) => (
                      <button
                        key={`${letItem.id}_${idx}`}
                        type="button"
                        disabled={isAnswerChecked}
                        onClick={() => {
                          setSelectedLetters((prev) => prev.filter((_, i) => i !== idx));
                          setAvailableLetters((prev) => [...prev, letItem]);
                        }}
                        className="w-10 h-12 sm:w-12 sm:h-14 bg-[#1A1A1A] text-white border border-[#1A1A1A] font-serif text-2xl sm:text-3xl font-bold flex items-center justify-center shadow-xs cursor-pointer hover:bg-[#9E3B3B] transition-all hover:scale-105 active:scale-95 rounded-xs"
                        title="Нажмите, чтобы вернуть букву в набор"
                      >
                        {letItem.char}
                      </button>
                    ))
                  )}
                </div>

                {/* Tray Controls: Backspace & Clear */}
                {selectedLetters.length > 0 && !isAnswerChecked && (
                  <div className="flex justify-end gap-1.5 text-xs font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        const last = selectedLetters[selectedLetters.length - 1];
                        setSelectedLetters((prev) => prev.slice(0, -1));
                        setAvailableLetters((prev) => [...prev, last]);
                      }}
                      className="px-2.5 py-1 border border-[#E5E1DA] hover:border-[#1A1A1A] bg-white text-[#6B655C] hover:text-[#1A1A1A] transition-colors cursor-pointer flex items-center gap-1 rounded-xs font-medium"
                    >
                      <span>⌫ Стереть</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvailableLetters((prev) => [...prev, ...selectedLetters]);
                        setSelectedLetters([]);
                      }}
                      className="px-2.5 py-1 border border-[#E5E1DA] hover:border-[#9E3B3B] bg-white text-[#8C7D6B] hover:text-[#9E3B3B] transition-colors cursor-pointer flex items-center gap-1 rounded-xs font-medium"
                    >
                      <span>↺ Очистить</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Available Greek Letter Bank */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] sm:text-xs font-sans uppercase tracking-wider text-[#8C7D6B] block text-center font-bold">
                  Доступные буквы:
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center max-w-md mx-auto">
                  {availableLetters.map((letItem) => (
                    <button
                      key={letItem.id}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => {
                        setSelectedLetters((prev) => [...prev, letItem]);
                        setAvailableLetters((prev) => prev.filter((l) => l.id !== letItem.id));
                        if (soundEffects) playSuccessChime();
                      }}
                      className="w-11 h-13 sm:w-14 sm:h-16 bg-white border-2 border-[#1A1A1A] hover:bg-[#FAF8F5] hover:border-[#2C3E50] text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A] shadow-xs cursor-pointer transition-all active:scale-90 flex items-center justify-center rounded-xs"
                    >
                      {letItem.char}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 5b. Biblical Phrase Builder (Legacy / Fallback if phrase exists) */}
          {/* =============================================================== */}
          {currentEx.type === 'phrase_builder' && (
            <div className="space-y-3 sm:space-y-5 max-w-xl mx-auto w-full">
              {currentEx.phrase && (
                <div className="p-3 sm:p-4 bg-[#F9F7F2] border border-[#E5E1DA] text-center space-y-1">
                  <span className="text-[9px] sm:text-[10px] font-sans uppercase tracking-wider text-[#8C7D6B] block">
                    {currentEx.phrase.reference}
                  </span>
                  <div className="flex justify-center items-center gap-2">
                    <p className="text-base sm:text-lg font-serif italic text-[#1A1A1A]">
                      «{currentEx.phrase.translationRu}»
                    </p>
                    <button
                      type="button"
                      onClick={() => speakRussian(currentEx.phrase!.translationRu, 1.0)}
                      className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-white rounded transition-colors cursor-pointer"
                      title="Произнести по-русски"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Letters Tray */}
              <div className="min-h-12 sm:min-h-16 p-2 border-2 border-dashed border-[#8C7D6B] bg-white flex flex-wrap gap-1.5 sm:gap-2 items-center justify-center rounded-xs">
                {selectedLetters.length === 0 ? (
                  <span className="text-xs font-sans text-[#8C7D6B] italic">
                    Нажимайте на слова ниже, чтобы собрать фразу...
                  </span>
                ) : (
                  selectedLetters.map((tok, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => {
                        setSelectedLetters((prev) => prev.filter((_, i) => i !== idx));
                        setAvailableLetters((prev) => [...prev, tok]);
                      }}
                      className="px-2.5 py-1 bg-[#1A1A1A] text-white border border-[#1A1A1A] text-sm sm:text-base font-serif cursor-pointer hover:bg-[#9E3B3B] transition-colors rounded-xs"
                    >
                      {tok.char}
                    </button>
                  ))
                )}
              </div>

              {/* Available Letters Tray */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                {availableLetters.map((tok) => (
                  <button
                    key={tok.id}
                    type="button"
                    disabled={isAnswerChecked}
                    onClick={() => {
                      setSelectedLetters((prev) => [...prev, tok]);
                      setAvailableLetters((prev) => prev.filter((t) => t.id !== tok.id));
                      speakErasmian(tok.char, audioSpeed);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-sm sm:text-base font-serif text-[#1A1A1A] shadow-2xs cursor-pointer transition-all active:scale-95 rounded-xs"
                  >
                    {tok.char}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 6. Typing Input (Writing & Keyboard) */}
          {/* =============================================================== */}
          {currentEx.type === 'typing_input' && (
            <div className="space-y-2 sm:space-y-3 max-w-lg mx-auto w-full">
              <div className="p-2.5 sm:p-3.5 bg-[#F9F7F2] border border-[#E5E1DA] text-center space-y-1">
                {currentEx.direction === 'ru_to_greek' ? (
                  <>
                    <span className="text-[10px] sm:text-xs font-sans uppercase tracking-wider text-[#8C7D6B] block">
                      Русский перевод
                    </span>
                    <div className="flex justify-center items-center gap-2">
                      <h3 className="text-2xl sm:text-3xl font-serif text-[#1A1A1A] font-bold">
                        {currentEx.word?.translationRu}
                      </h3>
                      {currentEx.word?.translationRu && (
                        <button
                          type="button"
                          onClick={() => speakRussian(currentEx.word!.translationRu, 1.0)}
                          className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-white rounded-full transition-colors cursor-pointer"
                          title="Произнести по-русски"
                        >
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] sm:text-xs font-sans uppercase tracking-wider text-[#8C7D6B] block">
                      Греческий оригинал
                    </span>
                    <h3 className={`font-serif text-[#1A1A1A] font-bold ${greekFontClass}`}>
                      {currentEx.word?.greek}
                    </h3>
                  </>
                )}
                {isAnswerChecked && <WordContextSnippet word={currentEx.word} />}
              </div>

              <div className="space-y-1.5">
                <input
                  ref={typingInputRef}
                  type="text"
                  value={typedInput}
                  readOnly={isAnswerChecked}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="text"
                  enterKeyHint={isAnswerChecked ? 'next' : 'done'}
                  onChange={(e) => setTypedInput(e.target.value)}
                  onClick={(e) => {
                    if (!isAnswerChecked) {
                      e.currentTarget.focus();
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (!isAnswerChecked) {
                      e.currentTarget.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isAnswerChecked) {
                        if (typedInput.trim()) {
                          handleCheckAnswer();
                        }
                      } else {
                        if (Date.now() - lastCheckedTimestampRef.current > 350) {
                          handleNext();
                        }
                      }
                    }
                  }}
                  placeholder={
                    currentEx.direction === 'ru_to_greek'
                      ? 'Введите греческое слово...'
                      : 'Введите русский перевод...'
                  }
                  className={`w-full p-2.5 sm:p-3 border-2 text-center text-lg sm:text-xl outline-none font-serif transition-colors touch-manipulation select-text rounded-xs ${
                    isAnswerChecked
                      ? isCorrect
                        ? 'border-[#2D4A32] bg-[#C5D9C8]/30 text-[#2D4A32]'
                        : 'border-[#9E3B3B] bg-[#F5DCDC]/30 text-[#9E3B3B]'
                      : 'border-[#1A1A1A] bg-white text-[#1A1A1A] focus:border-[#2C3E50] focus:ring-1 focus:ring-[#2C3E50]'
                  }`}
                  autoFocus
                />

                {/* Optional On-Screen Greek Keyboard for ru_to_greek mode */}
                {currentEx.direction === 'ru_to_greek' && !isAnswerChecked && (
                  <GreekKeyboard
                    onInsertChar={(char) => setTypedInput((prev) => prev + char)}
                    onBackspace={() => setTypedInput((prev) => prev.slice(0, -1))}
                    onClear={() => setTypedInput('')}
                  />
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* 7. Audio Quiz Component */}
          {/* =============================================================== */}
          {currentEx.type === 'audio_quiz' && currentEx.word && (
            <div className="space-y-2 sm:space-y-4 max-w-lg mx-auto w-full">
              <div className="p-2.5 sm:p-5 bg-[#F9F7F2] border border-[#E5E1DA] inline-block min-w-[200px] sm:min-w-[280px]">
                <button
                  type="button"
                  onClick={() => speakErasmian(currentEx.word!.greek, audioSpeed, voiceEngine)}
                  className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] font-sans text-xs uppercase tracking-wider flex items-center gap-2 mx-auto cursor-pointer rounded-xs shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Повторить аудио 🔊</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5 max-w-lg mx-auto font-serif">
                {currentEx.options?.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isAnswer = option === currentEx.correctAnswer;

                  let btnStyle = 'border-[#E5E1DA] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]';
                  if (isSelected && !isAnswerChecked) {
                    btnStyle = 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs';
                  } else if (isAnswerChecked) {
                    if (isAnswer) {
                      btnStyle = 'border-[#2D4A32] bg-[#C5D9C8] text-[#2D4A32] font-bold';
                    } else if (isSelected && !isAnswer) {
                      btnStyle = 'border-[#9E3B3B] bg-[#F5DCDC] text-[#9E3B3B] line-through';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswerChecked}
                      onClick={() => handleOptionSelectInstant(option)}
                      className={`p-2.5 sm:p-3.5 border text-center transition-all cursor-pointer text-base sm:text-lg font-sans font-medium active:scale-95 relative flex items-center justify-center rounded-xs leading-snug shadow-2xs ${btnStyle}`}
                    >
                      <span className="absolute left-1.5 top-1.5 text-[9px] font-sans px-1 py-0.2 border border-current opacity-60 rounded-xs font-mono">
                        {idx + 1}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Bar: Action & Check Button / Feedback Panel */}
      <footer className={`border-t border-[#E5E1DA] shrink-0 ${currentEx.type === 'match_pairs' ? 'pt-1 sm:pt-2 mt-0.5 sm:mt-1' : 'pt-2 sm:pt-3 mt-1 sm:mt-2'}`}>
        <div className="max-w-2xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-3">
          {/* Left: Feedback Info or Hint */}
          <div className="flex-1 text-left w-full sm:w-auto">
            {!isAnswerChecked && currentEx.type === 'match_pairs' && (
              <div className="text-center sm:text-left text-[11px] sm:text-xs font-sans text-[#8C7D6B]">
                <span>Соединено: </span>
                <span className="font-bold text-[#1A1A1A]">{matchedPairs.length}</span>
                <span> из </span>
                <span className="font-bold text-[#1A1A1A]">{currentEx.pairs?.length || 0}</span>
                <span> пар</span>
              </div>
            )}
            {currentEx.type === 'flashcard' && (
              showFlashcardContext ? (
                <div className="flex items-center space-x-2">
                  {flashcardAnswer === 'know' ? (
                    <div className="flex items-center space-x-2 text-[#2D4A32]">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-xs uppercase tracking-wider block font-sans">
                          Знаю!
                        </span>
                        {currentEx.word && (
                          <span className="text-xs text-[#6B655C] italic font-serif">
                            {currentEx.word.greek} — {currentEx.word.translationRu}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-[#9E3B3B]">
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-xs uppercase tracking-wider block font-sans">
                          Повторим в конце урока
                        </span>
                        {currentEx.word && (
                          <span className="text-xs text-[#6B655C] italic font-serif">
                            {currentEx.word.greek} — {currentEx.word.translationRu}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#6B655C] text-xs font-sans">
                  <Brain className="w-4 h-4 text-[#8C7D6B] shrink-0" />
                  <span className="hidden sm:inline">
                    {isCardFlipped
                      ? 'Оборотная сторона. Оцените, насколько хорошо вы помните слово:'
                      : 'Нажмите карточку или пробел для переворота, либо выберите ответ:'}
                  </span>
                  <span className="sm:hidden">
                    {isCardFlipped ? 'Оцените знание слова:' : 'Кликните или выберите:'}
                  </span>
                </div>
              )
            )}

            {isAnswerChecked && (
              <div className="flex items-center space-x-2">
                {isCorrect ? (
                  <div className="flex items-center space-x-2 text-[#2D4A32]">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-xs uppercase tracking-wider block font-sans flex items-center gap-2">
                        Верно!
                        {typoWarning && (
                          <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-[#D97706] rounded text-[9px] font-bold">
                            {typoWarning}
                          </span>
                        )}
                      </span>
                      {currentEx.word && (
                        <span className="text-xs text-[#6B655C] italic font-serif">
                          {currentEx.word.greek} — {currentEx.word.translationRu}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2 text-[#9E3B3B]">
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 sm:space-y-1">
                      <span className="font-bold text-xs uppercase tracking-wider block font-sans">
                        Правильный ответ: {currentEx.correctAnswer}
                      </span>
                      {currentEx.word && (
                        <div className="space-y-0.5 mt-0.5">
                          <p className="text-xs text-[#6B655C] italic font-serif">
                            {currentEx.word.greek} [{currentEx.word.transliterationRu}] — {currentEx.word.translationRu}
                          </p>
                          {currentEx.word.erasmianNotes && (
                            <p className="text-[10px] sm:text-[11px] text-[#8C7D6B] font-sans">
                              📖 {currentEx.word.erasmianNotes}
                            </p>
                          )}
                          {currentEx.word && (
                            <EditableMnemonic word={currentEx.word} customMnemonics={customMnemonics} onUpdateMnemonic={onUpdateMnemonic} isEngine={true} className="mt-1 sm:mt-2" />
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleOverrideAsCorrect}
                        className="mt-1 sm:mt-2 text-xs font-sans font-semibold text-[#2D4A32] bg-[#E8F2EA] hover:bg-[#D1E5D5] border border-[#A2C7A8] px-2.5 py-1 rounded-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#2D4A32]" />
                        <span>Мой ответ был верным (засчитать)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Check / Continue Button */}
          <div className="w-full sm:w-auto">
            {currentEx.type === 'flashcard' ? (
              showFlashcardContext ? (
                <button
                  type="button"
                  onClick={handleNextFlashcard}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-[#2D4A32] text-white hover:bg-[#1E3322] font-sans uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs rounded-xs font-bold active:scale-[0.98]"
                >
                  <span>Далее</span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="hidden sm:inline text-[10px] opacity-80 font-normal ml-0.5">(↵ / Пробел)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleFlashcardDontKnow}
                    className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-[#FAF5F5] text-[#9E3B3B] border-2 border-[#9E3B3B] font-sans uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs rounded-xs font-bold active:scale-[0.98]"
                    title="Повторить слово в конце этого урока (горячая клавиша 1 или ←)"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span>Не знаю</span>
                    <span className="hidden sm:inline text-[10px] opacity-70 font-normal ml-0.5">(1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFlashcardKnow}
                    className="flex-1 sm:flex-initial px-5 sm:px-8 py-2.5 sm:py-3 bg-[#2D4A32] text-white hover:bg-[#1E3322] font-sans uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs rounded-xs font-bold active:scale-[0.98]"
                    title="Знаю это слово (горячая клавиша 2, Enter или →)"
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>Знаю</span>
                    <span className="hidden sm:inline text-[10px] opacity-80 font-normal ml-0.5">(2 / ↵)</span>
                  </button>
                </div>
              )
            ) : !isAnswerChecked ? (
              <button
                type="button"
                onClick={handleCheckAnswer}
                disabled={
                  currentEx.type === 'multiple_choice' || currentEx.type === 'reverse_choice' || currentEx.type === 'audio_quiz'
                    ? !selectedOption
                    : currentEx.type === 'word_builder' || currentEx.type === 'phrase_builder'
                    ? selectedLetters.length === 0
                    : currentEx.type === 'typing_input'
                    ? !typedInput.trim()
                    : matchedPairs.length === 0
                }
                className={`w-full sm:w-auto px-5 sm:px-8 ${currentEx.type === 'match_pairs' ? 'py-2 sm:py-3' : 'py-2.5 sm:py-3'} font-sans uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs font-bold ${
                  selectedOption || typedInput.trim() || selectedLetters.length > 0 || matchedPairs.length > 0
                    ? 'bg-[#1A1A1A] text-white hover:bg-[#2C3E50]'
                    : 'bg-[#E5E1DA] text-[#8C7D6B] cursor-not-allowed'
                }`}
              >
                <span>Проверить ответ</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-white font-sans uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xs font-bold ${
                  isCorrect ? 'bg-[#2D4A32] hover:bg-[#1E3322]' : 'bg-[#9E3B3B] hover:bg-[#7D2E2E]'
                }`}
              >
                <span>Продолжить</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
