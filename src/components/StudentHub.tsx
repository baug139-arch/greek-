import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  Sparkles, 
  Volume2, 
  Play, 
  CheckCircle, 
  Calendar, 
  Filter, 
  ArrowRight,
  TrendingUp,
  Award,
  Search,
  Star,
  Zap,
  CreditCard,
  Puzzle,
  Edit3,
  CheckSquare,
  Shuffle,
  Headphones,
  ArrowLeftRight,
  Clock,
  Check,
  RotateCcw,
  Bell,
  Archive
} from 'lucide-react';
import { 
  Student, 
  GreekWord, 
  ThematicGroupInfo, 
  ChapterInfo, 
  HomeworkAssignment, 
  TrainingMode, 
  TrainingDirection, 
  WordMasteryProgress,
  TeacherCustomList
} from '../types';
import { THEMATIC_GROUPS, CHAPTERS_DATA, GREEK_VOCABULARY, BIBLICAL_PHRASES } from '../data/greekVocabulary';
import { ALL_FREQUENCY_TIERS, FREQUENCY_ALL_WORDS, getWordsByTierId } from '../data/frequencyVocabulary';
import { JOHN_GOSPEL_CHAPTERS, getJohnChapterWords } from '../data/johnGospelVocabulary';
import { getWordsForCourse, getWordsForAssignment, sampleRandomWords } from '../utils/courseUtils';
import { ExamReviewModal } from './ExamReviewModal';
import { speakErasmian, speakRussian } from '../utils/audio';
import { getMnemonicForWord } from '../utils/mnemonics';
import { WordMasteryBar } from './WordMasteryBar';
import { SectionMasteryHeader } from './SectionMasteryHeader';
import { EditableMnemonic } from './EditableMnemonic';
import { calculateSectionMasteryStats, getWordSkills, formatCooldownRemaining, getChunkSRSStatus } from '../utils/srsEngine';

interface StudentHubProps {
  currentStudent: Student;
  customLists?: TeacherCustomList[];
  isGuest?: boolean;
  onOpenAuthModal?: () => void;
  onStartPractice: (
    title: string, 
    words: GreekWord[], 
    phrases?: typeof BIBLICAL_PHRASES,
    trainingMode?: TrainingMode,
    direction?: TrainingDirection,
    sectionId?: string,
    initialChunkIndex?: number,
    unmasteredWords?: GreekWord[],
    initialStageIndex?: number
  ) => void;
  onStartExam?: (assignment: HomeworkAssignment, words: GreekWord[]) => void;
  onStartComposition?: (assignment: HomeworkAssignment) => void;
  onStartMorphology?: (assignment: HomeworkAssignment) => void;
  onStartManualMorphology?: (assignment: HomeworkAssignment) => void;
  onStartFreeMorphology?: (pos: 'all' | 'noun' | 'verb' | 'adjective' | 'mistakes') => void;
  onOpenErasmianGuide: () => void;
  onUpdateMnemonic?: (wordId: string, mnemonic: string) => void;
  onAcknowledgeHomework?: (assignmentId: string) => void;
}

export const StudentHub: React.FC<StudentHubProps> = ({
  currentStudent,
  customLists = [],
  isGuest = false,
  onOpenAuthModal,
  onStartPractice,
  onStartExam,
  onStartComposition,
  onStartMorphology,
  onStartManualMorphology,
  onStartFreeMorphology,
  onOpenErasmianGuide,
  onUpdateMnemonic,
  onAcknowledgeHomework,
}) => {
  const [activeTab, setActiveTab] = useState<'reading_john' | 'frequency' | 'thematic' | 'my_dictionary'>('reading_john');
  const [selectedExamToReview, setSelectedExamToReview] = useState<HomeworkAssignment | null>(null);
  const [showArchive, setShowArchive] = useState<boolean>(false);
  
  // Active Training Mode & Direction Selected by Student
  const [selectedTrainingMode, setSelectedTrainingMode] = useState<TrainingMode>('all');
  const [selectedDirection, setSelectedDirection] = useState<TrainingDirection>('bidirectional');

  // Mode: John Gospel Chapters 1-21
  const [selectedJohnChapter, setSelectedJohnChapter] = useState<number>(1);
  const [johnSearch, setJohnSearch] = useState<string>('');

  // Mode 1: Frequency Filter (35 Tiers)
  const [selectedTierId, setSelectedTierId] = useState<string>(ALL_FREQUENCY_TIERS[0]?.id || 'tier_500_plus');
  const [freqSearch, setFreqSearch] = useState<string>('');

  // Mode 2: Selected Thematic Group
  const [selectedThematicId, setSelectedThematicId] = useState<string>('nature_astronomy');

  // Search in dictionary
  const [dictSearch, setDictSearch] = useState<string>('');

  // Live timer tick for real-time countdown updates on portion chips
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Helpers to get words
  const currentTier = ALL_FREQUENCY_TIERS.find((t) => t.id === selectedTierId) || ALL_FREQUENCY_TIERS[0];
  const tierWords = getWordsByTierId(selectedTierId);
  const filteredTierWords = freqSearch
    ? tierWords.filter(
        (w) =>
          w.greek.toLowerCase().includes(freqSearch.toLowerCase()) ||
          w.translationRu.toLowerCase().includes(freqSearch.toLowerCase())
      )
    : tierWords;

  const currentJohnBlock = JOHN_GOSPEL_CHAPTERS.find((ch) => ch.chapterNumber === selectedJohnChapter) || JOHN_GOSPEL_CHAPTERS[0];
  const johnChapterWords = getJohnChapterWords(selectedJohnChapter);
  const filteredJohnWords = johnSearch
    ? johnChapterWords.filter(
        (w) =>
          w.greek.toLowerCase().includes(johnSearch.toLowerCase()) ||
          w.translationRu.toLowerCase().includes(johnSearch.toLowerCase())
      )
    : johnChapterWords;

  const getThematicWords = () => {
    return GREEK_VOCABULARY.filter((w) => w.thematicGroup === selectedThematicId);
  };
  const currentThematicInfo = THEMATIC_GROUPS.find((g) => g.id === selectedThematicId) || THEMATIC_GROUPS[0];

  // Active vs Reviewed Homework assignments
  const allHomeworks = currentStudent.assignedHomework || [];
  const activeHomeworks = allHomeworks.filter((hw) => !hw.studentReviewed);
  const reviewedHomeworks = allHomeworks.filter((hw) => !!hw.studentReviewed);

  // Calculate Overall Multi-Aspect Progress (3 Aspects: Reading, Writing, Listening)
  const studentMasteryEntries = Object.values(currentStudent.wordMastery || {});
  let avgReading = 0;
  let avgWriting = 0;
  let avgListening = 0;

  if (studentMasteryEntries.length > 0) {
    let totalR = 0, totalW = 0, totalL = 0;
    studentMasteryEntries.forEach((m) => {
      const s = getWordSkills(m as WordMasteryProgress);
      totalR += s.reading;
      totalW += s.writing;
      totalL += s.listening;
    });
    avgReading = Math.round(totalR / studentMasteryEntries.length);
    avgWriting = Math.round(totalW / studentMasteryEntries.length);
    avgListening = Math.round(totalL / studentMasteryEntries.length);
  }

  return (
    <div className="space-y-8">
      {/* Student Welcome Header & Skills Progress */}
      <div className="border border-[#1A1A1A] p-6 sm:p-8 bg-[#F9F7F2] relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-xl">
            {isGuest ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8C7D6B] font-bold">
                    Гостевой доступ
                  </span>
                  <span className="text-xs font-sans px-2.5 py-0.5 bg-[#FAF8F5] border border-[#E5E1DA] text-[#2C3E50] font-bold rounded flex items-center gap-1">
                    🌿 Режим свободной практики
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A]">
                  Библейский греческий <span className="font-serif italic text-2xl text-[#8C7D6B]">(Койне)</span>
                </h2>

                {/* Guest Callout Box */}
                <div className="bg-white border border-[#E5E1DA] p-3.5 rounded space-y-2.5 max-w-md shadow-2xs">
                  <div className="text-xs font-sans text-[#4A443D] leading-relaxed">
                    Вы можете свободно тренировать слова, проходить карточки и тесты. Чтобы <strong className="text-[#1A1A1A]">сохранять прогресс</strong> и сдавать работы преподавателю — войдите в аккаунт студента.
                  </div>
                  {onOpenAuthModal && (
                    <button
                      type="button"
                      onClick={onOpenAuthModal}
                      className="w-full py-2 px-3 bg-[#1A1A1A] hover:bg-[#2C3E50] text-white text-xs font-sans font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Войти через Google для синхронизации</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8C7D6B] font-bold">
                    Студент курса койне
                  </span>
                  <span className="text-xs font-sans px-2 py-0.5 bg-[#E5E1DA] text-[#1A1A1A] rounded">
                    Стрик: {currentStudent.streakDays || 1}{' '}
                    {(currentStudent.streakDays || 1) % 10 === 1 && (currentStudent.streakDays || 1) % 100 !== 11
                      ? 'день'
                      : [2, 3, 4].includes((currentStudent.streakDays || 1) % 10) && ![12, 13, 14].includes((currentStudent.streakDays || 1) % 100)
                      ? 'дня'
                      : 'дней'}{' '}
                    🔥
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif text-[#1A1A1A]">
                  Приветствуем, {currentStudent.name}{' '}
                  <span className="font-serif italic text-2xl text-[#8C7D6B]">
                    ({currentStudent.greekAlias})
                  </span>
                </h2>

                {/* Multi-Aspect Skills Balance (3 Грани владения словом) */}
                <div className="bg-white border border-[#E5E1DA] p-3 rounded space-y-2 max-w-md shadow-2xs font-sans">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-[#8C7D6B]">
                    <span>Баланс навыков (3 грани владения)</span>
                    <span className="text-[9px] lowercase font-normal text-[#6B655C]">
                      {studentMasteryEntries.length} слов в базе
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-[#F4F8FA] border border-[#D0E1E9] p-2 rounded">
                      <span className="text-[10px] block text-[#2C3E50] font-semibold">👁️ Чтение</span>
                      <span className="text-base font-bold text-[#2C3E50]">{avgReading}%</span>
                      <div className="w-full h-1 bg-[#D0E1E9] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[#2C3E50]" style={{ width: `${avgReading}%` }} />
                      </div>
                    </div>

                    <div className="bg-[#FFFBF0] border border-[#F3E3B6] p-2 rounded">
                      <span className="text-[10px] block text-[#7D5A00] font-semibold">✍️ Письмо</span>
                      <span className="text-base font-bold text-[#7D5A00]">{avgWriting}%</span>
                      <div className="w-full h-1 bg-[#F3E3B6] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[#7D5A00]" style={{ width: `${avgWriting}%` }} />
                      </div>
                    </div>

                    <div className="bg-[#F9F5FF] border border-[#E4D5F7] p-2 rounded">
                      <span className="text-[10px] block text-[#5B2C6F] font-semibold">🎧 Слух</span>
                      <span className="text-base font-bold text-[#5B2C6F]">{avgListening}%</span>
                      <div className="w-full h-1 bg-[#E4D5F7] rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[#5B2C6F]" style={{ width: `${avgListening}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <p className="text-xs font-sans text-[#6B655C] leading-relaxed">
              Выберите режим заучивания библейской лексики. Все упражнения разбиваются на удобные порции (батчи) и синхронизированы с Эразмовым произношением.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={onOpenErasmianGuide}
              className="px-4 py-3 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs font-sans uppercase tracking-wider text-[#1A1A1A] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#8C7D6B]" />
              <span>Правила Эразма</span>
            </button>
            <button
              type="button"
              onClick={() => {
                // Launch John 1 rare words practice immediately
                const wordsToPractice = GREEK_VOCABULARY.filter(
                  (w) => w.chapters.includes('john_1') && w.ntFrequency < 50
                );
                onStartPractice(
                  'Иоанна 1: Слова < 50 раз в НЗ', 
                  wordsToPractice, 
                  BIBLICAL_PHRASES,
                  selectedTrainingMode,
                  selectedDirection,
                  'john_1_rare',
                  0,
                  []
                );
              }}
              className="px-6 py-3 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Быстрый старт: Ин 1</span>
            </button>
          </div>
        </div>

        {/* Decorative Greek letter watermark */}
        <div className="absolute -bottom-6 -right-6 text-[140px] leading-none opacity-5 font-serif select-none pointer-events-none">
          Ω
        </div>
      </div>

      {/* Assigned Homeworks / Exams from Teacher (Only for authenticated students) */}
      {!isGuest && allHomeworks.length > 0 && (
        activeHomeworks.length > 0 ? (
          <div className="border-2 border-[#1A1A1A] p-5 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E1DA] pb-2">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-[#FAF8F5] border border-[#E5E1DA] text-[#1A1A1A] rounded">
                  <Calendar className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-sans uppercase tracking-wider font-bold text-[#1A1A1A]">
                  Задания и контрольные от преподавателя ({activeHomeworks.length})
                </h3>
              </div>
              <span className="text-xs font-sans text-[#8C7D6B]">
                Magister System
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {activeHomeworks.map((hw) => {
              const isExam = hw.assignmentType === 'exam';
              const isComposition = hw.assignmentType === 'greek_composition';
              const isMorphology = hw.assignmentType === 'morphology';
              const isManualMorphology = hw.assignmentType === 'manual_morphology';
              const isPendingGrade = (isExam || isComposition || isManualMorphology) && hw.completed && (hw.teacherGradeStatus === 'pending' || hw.teacherGrade === undefined);
              const isGraded = (isExam || isComposition || isManualMorphology) && hw.teacherGrade !== undefined;

              // Multi-round & chunk calculations for Practice assignments
              const courseWords = getWordsForAssignment(hw, customLists);
              const batchSize = currentStudent.settings?.batchSize || 8;
              const totalChunks = Math.max(1, Math.ceil(courseWords.length / batchSize));

              const requiredRounds = hw.requiredRounds || 1;
              const completedRounds = hw.completedRounds || 0;
              const currentRound = hw.currentRound || Math.min(requiredRounds, completedRounds + 1);
              const completedChunksInRound = hw.completedChunkIndicesForCurrentRound || [];

              // Next uncompleted chunk in the active round
              let nextChunkIndex = 0;
              for (let i = 0; i < totalChunks; i++) {
                if (!completedChunksInRound.includes(i)) {
                  nextChunkIndex = i;
                  break;
                }
              }

              // Cooldown timer calculation
              const cooldownHours = hw.cooldownHours ?? (requiredRounds > 1 ? 4 : 0);
              const cooldownMs = cooldownHours * 60 * 60 * 1000;
              const isRoundJustFinished = completedChunksInRound.length === 0 && completedRounds > 0 && completedRounds < requiredRounds;
              const lastTime = hw.lastRoundCompletedTime || 0;
              const elapsedMs = Date.now() - lastTime;
              const isCoolingDown = isRoundJustFinished && cooldownHours > 0 && elapsedMs < cooldownMs;
              const remainingCooldownMs = isCoolingDown ? (cooldownMs - elapsedMs) : 0;

              const formatCooldown = (ms: number): string => {
                if (ms <= 0) return '';
                const totalMinutes = Math.ceil(ms / (60 * 1000));
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                if (hours > 0) {
                  return `${hours} ч ${minutes > 0 ? `${minutes} мин` : ''}`.trim();
                }
                return `${minutes} мин`;
              };

              return (
                <div 
                  key={hw.id}
                  className={`p-4 rounded border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                    isComposition
                      ? 'bg-[#F4F9F5] border-[#C5D9C8]'
                      : isExam
                      ? 'bg-[#FFFDF5] border-[#FDE68A]'
                      : isManualMorphology
                      ? 'bg-[#FEFCE8] border-[#FDE047]'
                      : isMorphology
                      ? 'bg-[#FFF7ED] border-[#FDBA74]'
                      : hw.completed
                      ? 'bg-[#F4F9F5] border-[#C5D9C8]'
                      : isCoolingDown
                      ? 'bg-[#FFFDF5] border-[#FDE68A]'
                      : 'bg-[#FAF8F5] border-[#E5E1DA]'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] font-sans uppercase font-bold rounded ${
                        isComposition
                          ? 'bg-[#2C3E50] text-white'
                          : isExam
                          ? 'bg-[#9E3B3B] text-white'
                          : isManualMorphology
                          ? 'bg-[#7D5A00] text-white'
                          : isMorphology
                          ? 'bg-[#D97706] text-white'
                          : 'bg-[#1A1A1A] text-white'
                      }`}>
                        {isComposition
                          ? '✍️ Греческий перевод'
                          : isExam
                          ? '📝 Контрольная работа'
                          : isManualMorphology
                          ? '🔍 Ручной морфоразбор'
                          : isMorphology
                          ? '🧩 Морфология'
                          : '⚡ Практика'}
                      </span>

                      {requiredRounds > 1 && !isExam && !isComposition && !isMorphology && !isManualMorphology && (
                        <span className="px-2 py-0.5 text-[10px] font-sans font-bold bg-[#E2ECE3] text-[#2D4A32] border border-[#C5D9C8] rounded">
                          🔁 Круг {hw.completed ? requiredRounds : currentRound} из {requiredRounds}
                        </span>
                      )}

                      {hw.dueDate ? (
                        <span className="text-[11px] font-sans text-[#6B655C] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8C7D6B]" />
                          Срок: {hw.dueDate}
                        </span>
                      ) : (
                        <span className="text-[11px] font-sans text-[#8C7D6B]">
                          (Без дедлайна)
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-serif font-bold text-[#1A1A1A]">
                      {hw.title}
                    </h4>

                    {hw.selectedModules && hw.selectedModules.length > 1 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-sans text-[#6B655C]">
                        <span className="font-bold text-[#1A1A1A] bg-[#FAF8F5] border border-[#E5E1DA] px-1.5 py-0.5 rounded">
                          📚 {hw.selectedModules.length} модуля ({courseWords.length} слов):
                        </span>
                        <span className="text-[#2C3E50]">
                          {hw.selectedModules.map((m) => m.title.split(':')[0]).join(', ')}
                        </span>
                      </div>
                    )}

                    {isComposition && hw.customPromptRu && (
                      <p className="text-xs font-serif italic text-[#2D4A32] font-semibold">
                        Задание: «{hw.customPromptRu}»
                      </p>
                    )}

                    {isManualMorphology && hw.manualMorphologyWords && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-sans text-[#7D5A00]">
                          Морфологический разбор {hw.manualMorphologyWords.length} слов с выбором грамматических признаков и комментарием.
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hw.manualMorphologyWords.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-white border border-[#E5E1DA] rounded text-xs font-serif font-bold text-[#1A1A1A]"
                            >
                              {item.greekWord || (item as any).word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {isExam && hw.examConfig?.wordCount && (
                      <p className="text-[11px] font-sans text-[#7D5A00]">
                        {hw.examConfig.wordCount} случайных слов из {hw.selectedModules && hw.selectedModules.length > 1 ? `${hw.selectedModules.length} модулей (${courseWords.length} слов в пуле)` : 'курса'}. Ручной ввод переводов.
                      </p>
                    )}

                    {isMorphology && hw.morphologyConfig && (
                      <p className="text-[11px] font-sans text-[#92400E]">
                        Разбор форм: {hw.morphologyConfig.targetPos === 'all' ? 'Существительные и глаголы' : hw.morphologyConfig.targetPos === 'noun' ? 'Существительные' : 'Глаголы'} ({hw.morphologyConfig.wordCount} шт.)
                      </p>
                    )}

                    {/* Multi-round & Portions Info for Practice */}
                    {!isComposition && !isExam && !isMorphology && !isManualMorphology && !hw.completed && (
                      <div className="pt-1 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-sans text-[#6B655C] flex-wrap">
                          <span className="font-bold text-[#1A1A1A]">
                            Порция {nextChunkIndex + 1} из {totalChunks}:
                          </span>
                          <span>
                            Слова {nextChunkIndex * batchSize + 1}–{Math.min((nextChunkIndex + 1) * batchSize, courseWords.length)} из {courseWords.length}
                          </span>
                          {completedChunksInRound.length > 0 && (
                            <span className="text-[11px] text-[#2D4A32] font-medium">
                              (в этом круге пройдено {completedChunksInRound.length} из {totalChunks})
                            </span>
                          )}
                        </div>

                        {/* Chunk Progress Indicators */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Array.from({ length: totalChunks }).map((_, idx) => {
                            const isDone = completedChunksInRound.includes(idx);
                            const isCurrent = idx === nextChunkIndex && !isCoolingDown;
                            return (
                              <div
                                key={idx}
                                className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold flex items-center gap-1 ${
                                  isDone
                                    ? 'bg-[#C5D9C8] text-[#2D4A32] border border-[#A8C5AC]'
                                    : isCurrent
                                    ? 'bg-[#1A1A1A] text-white ring-1 ring-[#1A1A1A]'
                                    : 'bg-white text-[#8C7D6B] border border-[#E5E1DA]'
                                }`}
                              >
                                {isDone ? '✓ ' : ''}Порция {idx + 1}
                              </div>
                            );
                          })}
                        </div>

                        {/* Cooldown notice if applicable */}
                        {isCoolingDown && (
                          <div className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#92400E] space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                              <span>⏳ Круг {completedRounds} завершен! Интервал для консолидации памяти</span>
                            </p>
                            <p className="text-[11px] text-[#78350F]">
                              По методике интервального повторения мозгу требуется пауза перед следующим кругом. Круг {completedRounds + 1} откроется через <strong>{formatCooldown(remainingCooldownMs)}</strong>.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions according to status */}
                  <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0">
                    {isPendingGrade ? (
                      <span className="px-3 py-1.5 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded text-xs font-sans font-bold flex items-center gap-1.5">
                        ⏳ Сдано на проверку
                      </span>
                    ) : isGraded ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExamToReview(hw);
                          if (onAcknowledgeHomework) {
                            onAcknowledgeHomework(hw.id);
                          }
                        }}
                        className="px-4 py-2 bg-[#2D4A32] text-white hover:bg-[#1E3322] text-xs font-sans uppercase font-bold tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Оценка: {hw.teacherGrade}% (Посмотреть)</span>
                      </button>
                    ) : isComposition ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onStartComposition) {
                            onStartComposition(hw);
                          }
                        }}
                        className="px-4 py-2 bg-[#2C3E50] text-white hover:bg-[#1A252F] text-xs font-sans uppercase font-bold tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Написать на греческом</span>
                      </button>
                    ) : isExam ? (
                      <button
                        type="button"
                        onClick={() => {
                          const examCourseWords = getWordsForAssignment(hw, customLists);
                          const count = hw.examConfig?.wordCount || 20;
                          const examWords = sampleRandomWords(examCourseWords, count);
                          if (onStartExam) {
                            onStartExam(hw, examWords);
                          }
                        }}
                        className="px-4 py-2 bg-[#9E3B3B] text-white hover:bg-[#7E2D2D] text-xs font-sans uppercase font-bold tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Начать контрольную ({hw.examConfig?.wordCount || 20} слов)</span>
                      </button>
                    ) : isManualMorphology ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onStartManualMorphology) {
                            onStartManualMorphology(hw);
                          }
                        }}
                        className="px-4 py-2 bg-[#7D5A00] text-white hover:bg-[#604400] text-xs font-sans uppercase font-bold tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Начать разбор ({hw.manualMorphologyWords?.length || 0} слов)</span>
                      </button>
                    ) : isMorphology ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onStartMorphology) {
                            onStartMorphology(hw);
                          }
                        }}
                        className="px-4 py-2 bg-[#D97706] text-white hover:bg-[#B45309] text-xs font-sans uppercase font-bold tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Начать разбор ({hw.morphologyConfig?.wordCount || 10} форм)</span>
                      </button>
                    ) : hw.completed ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-[#C5D9C8] text-[#2D4A32] rounded text-xs font-sans font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Выполнено {requiredRounds > 1 ? `(${requiredRounds}/${requiredRounds} кр.)` : ''}</span>
                        </span>
                        {onAcknowledgeHomework && (
                          <button
                            type="button"
                            onClick={() => onAcknowledgeHomework(hw.id)}
                            className="px-2.5 py-1.5 bg-white border border-[#C5D9C8] hover:border-[#2D4A32] text-[#2D4A32] rounded text-xs font-sans font-bold cursor-pointer transition-colors"
                            title="Скрыть выполненное задание с главного экрана в архив"
                          >
                            В архив
                          </button>
                        )}
                      </div>
                    ) : isCoolingDown ? (
                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-2 bg-[#E5E1DA] text-[#8C7D6B] text-xs font-sans uppercase font-bold tracking-wider rounded cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Пауза ({formatCooldown(remainingCooldownMs)})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const studiedSoFar = courseWords.slice(0, nextChunkIndex * batchSize);
                          const weakWords = studiedSoFar.filter((w) => {
                            const m = currentStudent.wordMastery[w.id];
                            return m && (m.consecutiveCorrect < 2 || m.factor < 2.0);
                          });
                          const roundPrefix = requiredRounds > 1 ? `Круг ${currentRound}/${requiredRounds}, ` : '';
                          const portionTitle = `${hw.title} — ${roundPrefix}Порция ${nextChunkIndex + 1}/${totalChunks}`;
                          onStartPractice(
                            portionTitle,
                            courseWords,
                            BIBLICAL_PHRASES,
                            hw.trainingMode || selectedTrainingMode,
                            hw.direction || selectedDirection,
                            `hw_${hw.id}`,
                            nextChunkIndex,
                            weakWords
                          );
                        }}
                        className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase font-bold tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {completedChunksInRound.length === 0 && completedRounds === 0
                            ? `Начать: Порция 1/${totalChunks}`
                            : completedChunksInRound.length === 0 && completedRounds > 0
                            ? `Начать Круг ${currentRound}/${requiredRounds}: Порция 1`
                            : `Продолжить: Порция ${nextChunkIndex + 1}/${totalChunks}`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Collapsible Archive inside active section if there are reviewed homeworks */}
          {reviewedHomeworks.length > 0 && (
            <div className="pt-3 border-t border-[#E5E1DA]">
              <button
                type="button"
                onClick={() => setShowArchive((prev) => !prev)}
                className="text-xs font-sans font-semibold text-[#8C7D6B] hover:text-[#1A1A1A] flex items-center gap-1.5 cursor-pointer py-1 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{showArchive ? 'Скрыть архив проверенных работ' : `Архив проверенных заданий (${reviewedHomeworks.length})`}</span>
              </button>
              {showArchive && (
                <div className="mt-2 space-y-2">
                  {reviewedHomeworks.map((hw) => (
                    <div
                      key={hw.id}
                      className="p-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-[#1A1A1A]">{hw.title}</span>
                          {hw.teacherGrade !== undefined && (
                            <span className="px-2 py-0.5 bg-[#F4F9F5] text-[#2D4A32] font-bold rounded border border-[#C5D9C8]">
                              Оценка: {hw.teacherGrade}%
                            </span>
                          )}
                        </div>
                        {hw.gradedDate && (
                          <span className="text-[11px] text-[#8C7D6B] block">
                            Проверено: {hw.gradedDate}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedExamToReview(hw)}
                        className="px-3 py-1 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] rounded font-sans text-xs cursor-pointer transition-colors shrink-0"
                      >
                        Посмотреть
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* All homeworks have been reviewed / completed */
        <div className="border border-[#E5E1DA] p-4 bg-[#FAF8F5] rounded-lg shadow-2xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#2D4A32]" />
              <span className="text-xs font-sans text-[#2D4A32] font-bold">
                Все задания и контрольные от преподавателя выполнены и проверены
              </span>
            </div>
            {reviewedHomeworks.length > 0 && (
              <button
                type="button"
                onClick={() => setShowArchive((prev) => !prev)}
                className="text-xs font-sans text-[#8C7D6B] hover:text-[#1A1A1A] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{showArchive ? 'Скрыть архив' : `Архив проверенных заданий (${reviewedHomeworks.length})`}</span>
              </button>
            )}
          </div>
          {showArchive && reviewedHomeworks.length > 0 && (
            <div className="mt-2 space-y-2 pt-2 border-t border-[#E5E1DA]">
              {reviewedHomeworks.map((hw) => (
                <div
                  key={hw.id}
                  className="p-3 bg-white border border-[#E5E1DA] rounded flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif font-bold text-[#1A1A1A]">{hw.title}</span>
                      {hw.teacherGrade !== undefined && (
                        <span className="px-2 py-0.5 bg-[#F4F9F5] text-[#2D4A32] font-bold rounded border border-[#C5D9C8]">
                          Оценка: {hw.teacherGrade}%
                        </span>
                      )}
                    </div>
                    {hw.gradedDate && (
                      <span className="text-[11px] text-[#8C7D6B] block">
                        Проверено: {hw.gradedDate}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedExamToReview(hw)}
                    className="px-3 py-1 bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] rounded font-sans text-xs cursor-pointer transition-colors shrink-0"
                  >
                    Посмотреть
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    )}

      {/* Free Practice / Gym */}
      <div className="bg-white border-2 border-[#E5E1DA] p-6 shadow-xs relative overflow-hidden">
        {/* Aesthetic background element */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#F4F9F5] rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏋️</span>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Свободная тренировка</h3>
            </div>
            <p className="text-sm font-sans text-[#6B655C]">
              Практикуйте морфологию (разбор форм существительных, глаголов и причастий) в любое время, чтобы закреплять навыки и углублять понимание языка.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => onStartFreeMorphology && onStartFreeMorphology('noun')}
              className="px-4 py-2.5 bg-[#FAF8F5] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#D97706] hover:bg-[#FFFBEB] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
            >
              <span>🧩 Существительные</span>
              <span className="text-[10px] opacity-70 font-medium normal-case">Тренировка падежей</span>
            </button>
            <button
              onClick={() => onStartFreeMorphology && onStartFreeMorphology('verb')}
              className="px-4 py-2.5 bg-[#FAF8F5] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#D97706] hover:bg-[#FFFBEB] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
            >
              <span>🧩 Глаголы</span>
              <span className="text-[10px] opacity-70 font-medium normal-case">Тренировка времен</span>
            </button>
            <button
              onClick={() => onStartFreeMorphology && onStartFreeMorphology('adjective')}
              className="px-4 py-2.5 bg-[#FAF8F5] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#D97706] hover:bg-[#FFFBEB] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
            >
              <span>🧩 Прилагательные</span>
              <span className="text-[10px] opacity-70 font-medium normal-case">Тренировка согласования</span>
            </button>
            <button
              onClick={() => onStartFreeMorphology && onStartFreeMorphology('all')}
              className="px-4 py-2.5 bg-[#D97706] text-white hover:bg-[#B45309] border border-[#D97706] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
            >
              <span>🔥 Микс</span>
              <span className="text-[10px] opacity-90 font-medium normal-case">Всё вместе</span>
            </button>
            {currentStudent.morphologyMistakes && currentStudent.morphologyMistakes.length > 0 && (
              <button
                onClick={() => onStartFreeMorphology && onStartFreeMorphology('mistakes')}
                className="px-4 py-2.5 bg-[#E11D48] text-white hover:bg-[#BE123C] border border-[#E11D48] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
              >
                <span>⚠️ Работа над ошибками</span>
                <span className="text-[10px] opacity-90 font-medium normal-case">{currentStudent.morphologyMistakes.length} слов(а)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Training Mode & Direction Selector Bar */}
      <div className="bg-[#FAF8F5] border border-[#E5E1DA] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold shrink-0">
            Режим тренажера:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all' as TrainingMode, label: 'Общий', icon: Zap },
              { id: 'flashcards' as TrainingMode, label: 'Карточки', icon: CreditCard },
              { id: 'builder' as TrainingMode, label: 'Конструктор', icon: Puzzle },
              { id: 'typing' as TrainingMode, label: 'Письмо', icon: Edit3 },
              { id: 'quiz' as TrainingMode, label: 'Тест', icon: CheckSquare },
              { id: 'audio' as TrainingMode, label: 'Аудио', icon: Headphones },
              { id: 'match' as TrainingMode, label: 'Сопоставление', icon: Shuffle },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedTrainingMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setSelectedTrainingMode(mode.id);
                    if (mode.id === 'audio' || mode.id === 'typing') {
                      setSelectedDirection('greek_to_ru');
                    } else if (mode.id === 'builder') {
                      setSelectedDirection('ru_to_greek');
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-sans transition-all flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-xs'
                      : 'bg-white text-[#4A443D] border-[#E5E1DA] hover:border-[#1A1A1A]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold shrink-0">
            Направление:
          </span>
          <div className="flex gap-1.5">
            {[
              { id: 'bidirectional' as TrainingDirection, label: '🔄 2 стороны' },
              { id: 'greek_to_ru' as TrainingDirection, label: '🇬🇷 ➔ 🇷🇺' },
              { id: 'ru_to_greek' as TrainingDirection, label: '🇷🇺 ➔ 🇬🇷' },
            ].map((dir) => {
              const isFixedMode = selectedTrainingMode === 'audio' || selectedTrainingMode === 'builder' || selectedTrainingMode === 'typing';
              const activeDir = isFixedMode
                ? (selectedTrainingMode === 'builder' ? 'ru_to_greek' : 'greek_to_ru')
                : selectedDirection;
              const isSelected = activeDir === dir.id;

              return (
                <button
                  key={dir.id}
                  type="button"
                  disabled={isFixedMode}
                  onClick={() => setSelectedDirection(dir.id)}
                  className={`px-2.5 py-1.5 text-xs font-sans transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-xs'
                      : isFixedMode
                      ? 'bg-white text-[#C5BEB3] border-[#E5E1DA] opacity-40 cursor-not-allowed'
                      : 'bg-white text-[#4A443D] border-[#E5E1DA] hover:border-[#1A1A1A]'
                  }`}
                  title={
                    isFixedMode
                      ? `Режим зафиксирован в направлении ${activeDir === 'greek_to_ru' ? 'Греческий ➔ Русский' : 'Русский ➔ Греческий'}`
                      : ''
                  }
                >
                  {dir.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mode Selector Navigation Tabs */}
      <div className="border-b border-[#E5E1DA] flex space-x-2 sm:space-x-8 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('reading_john')}
          className={`pb-3 text-xs sm:text-sm font-sans uppercase tracking-widest whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'reading_john'
              ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
              : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
          }`}
        >
          Заучивание для чтения (Иоанна 1–21)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('frequency')}
          className={`pb-3 text-xs sm:text-sm font-sans uppercase tracking-widest whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'frequency'
              ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
              : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
          }`}
        >
          По частотности (35 разделов)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('thematic')}
          className={`pb-3 text-xs sm:text-sm font-sans uppercase tracking-widest whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'thematic'
              ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
              : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
          }`}
        >
          Тематические группы
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_dictionary')}
          className={`pb-3 text-xs sm:text-sm font-sans uppercase tracking-widest whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            activeTab === 'my_dictionary'
              ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
              : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
          }`}
        >
          Мой стек слов ({Object.keys(currentStudent.wordMastery).length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE: READING VOCABULARY BY JOHN GOSPEL CHAPTERS (1-21) */}
      {/* ========================================================================= */}
      {activeTab === 'reading_john' && (
        <div className="space-y-6">
          {/* Chapter Selector Grid (1 to 21) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8C7D6B] font-bold">
                Выберите главу Евангелия от Иоанна (1 – 21):
              </span>
              <span className="text-xs font-sans text-[#6B655C]">
                Выбрана: {currentJohnBlock.chapterTitleRu}
              </span>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-21 gap-1.5 overflow-x-auto pb-1">
              {JOHN_GOSPEL_CHAPTERS.map((block) => {
                const isSelected = selectedJohnChapter === block.chapterNumber;
                const hasWords = block.words.length > 0;
                const chapterWordIds = block.words.map((w) => w.id);
                const stats = calculateSectionMasteryStats(chapterWordIds, currentStudent.wordMastery);

                return (
                  <button
                    key={block.chapterId}
                    type="button"
                    onClick={() => {
                      setSelectedJohnChapter(block.chapterNumber);
                      setJohnSearch('');
                    }}
                    className={`py-2 px-1 text-center border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-xs'
                        : hasWords
                        ? 'bg-[#FDFCFB] text-[#1A1A1A] border-[#1A1A1A]/40 hover:border-[#1A1A1A]'
                        : 'bg-white text-[#8C7D6B] border-[#E5E1DA] hover:border-[#1A1A1A]'
                    }`}
                  >
                    {/* Micro Mastery indicator line under button */}
                    {hasWords && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all"
                        style={{ width: `${stats.averageMasteryPercent}%` }}
                      />
                    )}
                    <div className="text-[9px] font-sans opacity-70">Ин</div>
                    <div className="text-sm font-serif font-bold">{block.chapterNumber}</div>
                    <div className="text-[8px] font-sans opacity-75">
                      {hasWords ? `${stats.averageMasteryPercent}%` : '—'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Mastery Header for Selected John Chapter with Next Portion Smart Progress */}
          {johnChapterWords.length > 0 && (() => {
            const batchSize = currentStudent.settings?.batchSize || 8;
            const totalChapterChunks = Math.ceil(johnChapterWords.length / batchSize);
            const sectionKey = `john_${currentJohnBlock.chapterNumber}`;
            const completedChunkList = currentStudent.completedChunks?.[sectionKey] || [];
            
            // Find next uncompleted chunk index (or 0 if all done)
            let nextChunkIndex = 0;
            for (let i = 0; i < totalChapterChunks; i++) {
              if (!completedChunkList.includes(i)) {
                nextChunkIndex = i;
                break;
              }
            }

            // Find unmastered words strictly from ALREADY COMPLETED chunks of this section
            const alreadyStudiedWords = johnChapterWords.slice(0, nextChunkIndex * batchSize);
            const weakWordsFromPreviousChunks = alreadyStudiedWords.filter((w) => {
              const m = currentStudent.wordMastery[w.id];
              return m && (m.consecutiveCorrect < 2 || m.factor < 2.0);
            });

            const nextChunkStart = nextChunkIndex * batchSize + 1;
            const nextChunkEnd = Math.min(johnChapterWords.length, (nextChunkIndex + 1) * batchSize);

            return (
              <div className="space-y-4">
                <SectionMasteryHeader
                  title={currentJohnBlock.chapterTitleRu}
                  subtitle={currentJohnBlock.descriptionRu}
                  stats={calculateSectionMasteryStats(
                    johnChapterWords.map((w) => w.id),
                    currentStudent.wordMastery
                  )}
                  onQuickPractice={() => {
                    const nextSRSStatus = getChunkSRSStatus(sectionKey, nextChunkIndex, currentStudent, true, nowMs);
                    const nextStage = nextSRSStatus.step === 0 ? 0 : nextSRSStatus.step === 1 ? 1 : 2;
                    onStartPractice(
                      `${currentJohnBlock.chapterTitleRu} — Порция ${nextChunkIndex + 1}/${totalChapterChunks}`,
                      johnChapterWords,
                      BIBLICAL_PHRASES.filter((p) => p.chapter === currentJohnBlock.chapterId),
                      selectedTrainingMode,
                      selectedDirection,
                      sectionKey,
                      nextChunkIndex,
                      weakWordsFromPreviousChunks,
                      nextStage
                    );
                  }}
                  practiceButtonText={
                    completedChunkList.length >= totalChapterChunks
                      ? `Повторить главу (все порции)`
                      : `Учить: Порция ${nextChunkIndex + 1}/${totalChapterChunks} (${nextChunkStart}–${nextChunkEnd}) ➔`
                  }
                />

                {/* Portions / Chunks Interactive Strip */}
                {totalChapterChunks > 1 && (
                  <div className="border border-[#E5E1DA] p-3.5 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
                          Порции слов главы ({batchSize} слов в порции):
                        </span>
                        <span className="text-[10px] font-sans text-[#2D4A32] font-bold bg-[#C5D9C8] px-1.5 py-0.2">
                          Пройдено: {completedChunkList.length} / {totalChapterChunks}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-[#6B655C]">
                        3 ступени повторения: <span className="font-semibold text-[#1A1A1A]">45 мин</span> ➔ <span className="font-semibold text-[#1A1A1A]">24 ч (1 день)</span> ➔ <span className="font-semibold text-[#1A1A1A]">3 дня</span> ➔ ✅ Выучено
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: totalChapterChunks }).map((_, cIdx) => {
                        const isDone = completedChunkList.includes(cIdx);
                        const isNext = cIdx === nextChunkIndex && !isDone;
                        const cStart = cIdx * batchSize + 1;
                        const cEnd = Math.min(johnChapterWords.length, (cIdx + 1) * batchSize);
                        const srsStatus = getChunkSRSStatus(sectionKey, cIdx, currentStudent, isNext, nowMs);

                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => {
                              const studiedSoFar = johnChapterWords.slice(0, cIdx * batchSize);
                              const weakPrior = studiedSoFar.filter((w) => {
                                const m = currentStudent.wordMastery[w.id];
                                return m && (m.consecutiveCorrect < 2 || m.factor < 2.0);
                              });
                              const targetStage = srsStatus.step === 0 ? 0 : srsStatus.step === 1 ? 1 : 2;
                              onStartPractice(
                                `${currentJohnBlock.chapterTitleRu} — Порция ${cIdx + 1}/${totalChapterChunks} (${cStart}–${cEnd})`,
                                johnChapterWords,
                                BIBLICAL_PHRASES.filter((p) => p.chapter === currentJohnBlock.chapterId),
                                selectedTrainingMode,
                                selectedDirection,
                                sectionKey,
                                cIdx,
                                weakPrior,
                                targetStage
                              );
                            }}
                            className={`px-3 py-1.5 text-xs font-sans border transition-all cursor-pointer flex items-center gap-1.5 rounded-xs shadow-2xs ${srsStatus.buttonClass}`}
                            title={srsStatus.tooltipText}
                          >
                            <span>Порция {cIdx + 1}</span>
                            {srsStatus.isNext && (
                              <span className="text-[9px] bg-amber-400 text-[#1A1A1A] px-1 py-0.2 font-bold rounded-xs">
                                СЛЕД
                              </span>
                            )}
                            {srsStatus.inCooldown && (
                              <span className="text-[9px] bg-[#E8DDCB] text-[#7A5A21] px-1 py-0.2 font-medium rounded-xs flex items-center gap-0.5" title={srsStatus.tooltipText}>
                                <Clock className="w-2.5 h-2.5" />
                                {srsStatus.remainingText}
                              </span>
                            )}
                            {srsStatus.isDue && (
                              <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 font-bold rounded-xs flex items-center gap-0.5 animate-pulse" title={srsStatus.tooltipText}>
                                <Bell className="w-2.5 h-2.5" />
                                Повторить ({srsStatus.step}/3)
                              </span>
                            )}
                            {srsStatus.isMastered && (
                              <span className="text-[9px] bg-[#2D4A32] text-white px-1 py-0.2 font-bold rounded-xs flex items-center gap-0.5" title={srsStatus.tooltipText}>
                                <CheckCircle className="w-2.5 h-2.5" />
                                Выучено
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Chapter Word List Card */}
          <div className="border border-[#E5E1DA] p-6 bg-white shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E5E1DA] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
                    Евангелие от Иоанна
                  </span>
                  <span className="text-[11px] font-sans px-2 py-0.5 bg-[#E5E1DA] text-[#1A1A1A] font-bold">
                    {currentJohnBlock.words.length} слов в блоке
                  </span>
                </div>
                <h3 className="text-xl font-serif text-[#1A1A1A] mt-1 font-bold">
                  Словарь: {currentJohnBlock.chapterTitleRu}
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-[#8C7D6B]" />
                  <input
                    type="text"
                    value={johnSearch}
                    onChange={(e) => setJohnSearch(e.target.value)}
                    placeholder="Поиск в главе..."
                    className="w-full pl-8 pr-3 py-2 border border-[#E5E1DA] bg-[#FDFCFB] text-xs font-sans"
                  />
                </div>

                <button
                  type="button"
                  disabled={johnChapterWords.length === 0}
                  onClick={() => {
                    onStartPractice(
                      currentJohnBlock.chapterTitleRu,
                      johnChapterWords,
                      BIBLICAL_PHRASES.filter((p) => p.chapter === currentJohnBlock.chapterId),
                      selectedTrainingMode,
                      selectedDirection,
                      `john_${currentJohnBlock.chapterNumber}`,
                      0,
                      []
                    );
                  }}
                  className={`px-5 py-2.5 text-xs font-sans uppercase tracking-widest transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                    johnChapterWords.length > 0
                      ? 'bg-[#1A1A1A] text-white hover:bg-[#2C3E50] cursor-pointer'
                      : 'bg-[#E5E1DA] text-[#8C7D6B] cursor-not-allowed'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Старт ({johnChapterWords.length})</span>
                </button>
              </div>
            </div>

            {/* Word cards list */}
            {filteredJohnWords.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredJohnWords.map((word) => {
                  const mastery = currentStudent.wordMastery[word.id];
                  return (
                    <div
                      key={word.id}
                      className="p-3.5 bg-[#FDFCFB] border border-[#E5E1DA] hover:border-[#1A1A1A] transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-serif text-xl font-bold text-[#1A1A1A]">
                              {word.greek}
                            </span>
                            <p className="text-[11px] font-sans text-[#8C7D6B] italic">
                              [{word.transliterationRu}]
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakErasmian(word.greek, 0.85)}
                            className="p-1.5 border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-white text-[#1A1A1A] transition-colors cursor-pointer"
                            title="Эразмово произношение"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-1.5">
  <p className="text-sm font-serif italic text-[#2C3E50]">
    {word.translationRu}
  </p>
  <button
    type="button"
    onClick={() => speakRussian(word.translationRu, 1.0)}
    className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-[#F9F7F2] rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
    title="Произнести по-русски"
  >
    <Volume2 className="w-3 h-3" />
  </button>
</div>
                        <EditableMnemonic 
                          word={word} 
                          customMnemonics={currentStudent.customMnemonics} 
                          onUpdateMnemonic={onUpdateMnemonic}
                        />
                      </div>

                      {/* Word Mastery Progress Bar for each word */}
                      <div className="pt-2 border-t border-[#E5E1DA]/60 space-y-1.5">
                        <WordMasteryBar mastery={mastery} />
                        <div className="flex justify-between items-center text-[10px] font-sans text-[#6B655C]">
                          <span className="bg-[#E5E1DA] px-1.5 py-0.2">{word.exampleVerse.reference}</span>
                          <span className="font-bold text-[#1A1A1A]">{word.ntFrequency} раз в НЗ</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-[#E5E1DA] space-y-2">
                <p className="text-sm font-serif italic text-[#1A1A1A]">
                  {johnChapterWords.length === 0
                    ? `Слова для главы «Иоанна ${selectedJohnChapter}» ещё не добавлены.`
                    : `По запросу «${johnSearch}» ничего не найдено.`}
                </p>
                {johnChapterWords.length === 0 && (
                  <p className="text-xs font-sans text-[#8C7D6B]">
                    Вы можете предоставить список слов для этой главы, и они мгновенно появятся здесь.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: FREQUENCY BASED (35 УРОВНЕЙ ЧАСТОТНОСТИ НОВОГО ЗАВЕТА) */}
      {/* ========================================================================= */}
      {activeTab === 'frequency' && (
        <div className="space-y-6">
          {/* Top 35 Tiers Carousel / Grid selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8C7D6B] font-bold">
                Выберите категорию частотности (35 разделов словаря):
              </span>
              <span className="text-xs font-sans text-[#6B655C]">
                Всего в базе: {ALL_FREQUENCY_TIERS.length} разделов
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {ALL_FREQUENCY_TIERS.map((tier, idx) => {
                const isSelected = selectedTierId === tier.id;
                const tierWordIds = getWordsByTierId(tier.id).map((w) => w.id);
                const stats = calculateSectionMasteryStats(tierWordIds, currentStudent.wordMastery);

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      setSelectedTierId(tier.id);
                      setFreqSearch('');
                    }}
                    className={`px-3 py-2 border whitespace-nowrap text-left transition-all cursor-pointer shrink-0 relative overflow-hidden ${
                      isSelected
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs'
                        : 'border-[#E5E1DA] bg-white text-[#4A443D] hover:border-[#1A1A1A]'
                    }`}
                  >
                    {/* Mastery micro bar */}
                    {tierWordIds.length > 0 && (
                      <div
                        className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all"
                        style={{ width: `${stats.averageMasteryPercent}%` }}
                      />
                    )}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[9px] font-sans uppercase tracking-widest opacity-60">
                        Раздел {idx + 1}
                      </span>
                      <span className="text-[9px] font-mono font-bold opacity-80">
                        {stats.averageMasteryPercent}%
                      </span>
                    </div>
                    <div className="text-xs font-serif font-bold truncate">
                      {tier.titleRu.replace('Слова, встречающиеся ', '')}
                    </div>
                    <div className="text-[10px] font-sans opacity-70">
                      {tier.countLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Mastery Header for Current Frequency Tier with Portions */}
          {tierWords.length > 0 && (() => {
            const batchSize = currentStudent.settings?.batchSize || 8;
            const totalTierChunks = Math.ceil(tierWords.length / batchSize);
            const sectionKey = `freq_${currentTier.id}`;
            const completedChunkList = currentStudent.completedChunks?.[sectionKey] || [];

            let nextChunkIndex = 0;
            for (let i = 0; i < totalTierChunks; i++) {
              if (!completedChunkList.includes(i)) {
                nextChunkIndex = i;
                break;
              }
            }

            // Find unmastered words strictly from ALREADY COMPLETED chunks
            const alreadyStudiedWords = tierWords.slice(0, nextChunkIndex * batchSize);
            const weakWordsFromTier = alreadyStudiedWords.filter((w) => {
              const m = currentStudent.wordMastery[w.id];
              return m && (m.consecutiveCorrect < 2 || m.factor < 2.0);
            });

            const nextChunkStart = nextChunkIndex * batchSize + 1;
            const nextChunkEnd = Math.min(tierWords.length, (nextChunkIndex + 1) * batchSize);

            return (
              <div className="space-y-4">
                <SectionMasteryHeader
                  title={currentTier.titleRu}
                  subtitle="Слова с точным греческим написанием и русским переводом. Эразмово произношение."
                  stats={calculateSectionMasteryStats(
                    tierWords.map((w) => w.id),
                    currentStudent.wordMastery
                  )}
                  onQuickPractice={() => {
                    const nextSRSStatus = getChunkSRSStatus(sectionKey, nextChunkIndex, currentStudent, true, nowMs);
                    const nextStage = nextSRSStatus.step === 0 ? 0 : nextSRSStatus.step === 1 ? 1 : 2;
                    onStartPractice(
                      `${currentTier.titleRu} — Порция ${nextChunkIndex + 1}/${totalTierChunks}`,
                      tierWords,
                      BIBLICAL_PHRASES,
                      selectedTrainingMode,
                      selectedDirection,
                      sectionKey,
                      nextChunkIndex,
                      weakWordsFromTier,
                      nextStage
                    );
                  }}
                  practiceButtonText={
                    completedChunkList.length >= totalTierChunks
                      ? `Повторить раздел (все порции)`
                      : `Учить: Порция ${nextChunkIndex + 1}/${totalTierChunks} (${nextChunkStart}–${nextChunkEnd}) ➔`
                  }
                />

                {/* Portions Strip */}
                {totalTierChunks > 1 && (
                  <div className="border border-[#E5E1DA] p-3.5 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
                          Порции раздела ({batchSize} слов в порции):
                        </span>
                        <span className="text-[10px] font-sans text-[#2D4A32] font-bold bg-[#C5D9C8] px-1.5 py-0.2">
                          Пройдено: {completedChunkList.length} / {totalTierChunks}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-[#6B655C]">
                        3 ступени повторения: <span className="font-semibold text-[#1A1A1A]">45 мин</span> ➔ <span className="font-semibold text-[#1A1A1A]">24 ч (1 день)</span> ➔ <span className="font-semibold text-[#1A1A1A]">3 дня</span> ➔ ✅ Выучено
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: totalTierChunks }).map((_, cIdx) => {
                        const isDone = completedChunkList.includes(cIdx);
                        const isNext = cIdx === nextChunkIndex && !isDone;
                        const cStart = cIdx * batchSize + 1;
                        const cEnd = Math.min(tierWords.length, (cIdx + 1) * batchSize);
                        const srsStatus = getChunkSRSStatus(sectionKey, cIdx, currentStudent, isNext, nowMs);

                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => {
                              const studiedSoFar = tierWords.slice(0, cIdx * batchSize);
                              const weakPrior = studiedSoFar.filter((w) => {
                                const m = currentStudent.wordMastery[w.id];
                                return m && (m.consecutiveCorrect < 2 || m.factor < 2.0);
                              });
                              const targetStage = srsStatus.step === 0 ? 0 : srsStatus.step === 1 ? 1 : 2;
                              onStartPractice(
                                `${currentTier.titleRu} — Порция ${cIdx + 1}/${totalTierChunks} (${cStart}–${cEnd})`,
                                tierWords,
                                BIBLICAL_PHRASES,
                                selectedTrainingMode,
                                selectedDirection,
                                sectionKey,
                                cIdx,
                                weakPrior,
                                targetStage
                              );
                            }}
                            className={`px-3 py-1.5 text-xs font-sans border transition-all cursor-pointer flex items-center gap-1.5 rounded-xs shadow-2xs ${srsStatus.buttonClass}`}
                            title={srsStatus.tooltipText}
                          >
                            <span>Порция {cIdx + 1}</span>
                            {srsStatus.isNext && (
                              <span className="text-[9px] bg-amber-400 text-[#1A1A1A] px-1 py-0.2 font-bold rounded-xs">
                                СЛЕД
                              </span>
                            )}
                            {srsStatus.inCooldown && (
                              <span className="text-[9px] bg-[#E8DDCB] text-[#7A5A21] px-1 py-0.2 font-medium rounded-xs flex items-center gap-0.5" title={srsStatus.tooltipText}>
                                <Clock className="w-2.5 h-2.5" />
                                {srsStatus.remainingText}
                              </span>
                            )}
                            {srsStatus.isDue && (
                              <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 font-bold rounded-xs flex items-center gap-0.5 animate-pulse" title={srsStatus.tooltipText}>
                                <Bell className="w-2.5 h-2.5" />
                                Повторить ({srsStatus.step}/3)
                              </span>
                            )}
                            {srsStatus.isMastered && (
                              <span className="text-[9px] bg-[#2D4A32] text-white px-1 py-0.2 font-bold rounded-xs flex items-center gap-0.5" title={srsStatus.tooltipText}>
                                <CheckCircle className="w-2.5 h-2.5" />
                                Выучено
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="border border-[#E5E1DA] p-6 bg-white shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E5E1DA] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
                    Выбранная категория
                  </span>
                  <span className="text-[11px] font-sans px-2 py-0.5 bg-[#E5E1DA] text-[#1A1A1A] font-bold">
                    {currentTier.countLabel}
                  </span>
                </div>
                <h3 className="text-xl font-serif text-[#1A1A1A] mt-1 font-bold">
                  Словарь: {currentTier.titleRu}
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-[#8C7D6B]" />
                  <input
                    type="text"
                    value={freqSearch}
                    onChange={(e) => setFreqSearch(e.target.value)}
                    placeholder="Поиск в категории..."
                    className="w-full pl-8 pr-3 py-2 border border-[#E5E1DA] bg-[#FDFCFB] text-xs font-sans"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onStartPractice(
                      currentTier.titleRu,
                      tierWords,
                      BIBLICAL_PHRASES,
                      selectedTrainingMode,
                      selectedDirection,
                      `freq_${currentTier.id}`,
                      0,
                      []
                    );
                  }}
                  className="px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Старт ({tierWords.length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredTierWords.map((word) => {
                const mastery = currentStudent.wordMastery[word.id];
                return (
                  <div
                    key={word.id}
                    className="p-3.5 bg-[#FDFCFB] border border-[#E5E1DA] hover:border-[#1A1A1A] transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-serif text-xl font-bold text-[#1A1A1A]">
                            {word.greek}
                          </span>
                          <p className="text-[11px] font-sans text-[#8C7D6B] italic">
                            [{word.transliterationRu}]
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakErasmian(word.greek, 0.85)}
                          className="p-1.5 border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-white text-[#1A1A1A] transition-colors cursor-pointer"
                          title="Эразмово произношение"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
  <p className="text-sm font-serif italic text-[#2C3E50]">
    {word.translationRu}
  </p>
  <button
    type="button"
    onClick={() => speakRussian(word.translationRu, 1.0)}
    className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-[#F9F7F2] rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
    title="Произнести по-русски"
  >
    <Volume2 className="w-3 h-3" />
  </button>
</div>
                      <EditableMnemonic 
                        word={word} 
                        customMnemonics={currentStudent.customMnemonics} 
                        onUpdateMnemonic={onUpdateMnemonic}
                      />
                    </div>

                    {/* Word Mastery Progress Bar */}
                    <div className="pt-2 border-t border-[#E5E1DA]/60 space-y-1.5">
                      <WordMasteryBar mastery={mastery} />
                      <div className="flex justify-between items-center text-[10px] font-sans text-[#6B655C]">
                        <span className="bg-[#E5E1DA] px-1.5 py-0.2">Эразмово</span>
                        <span className="font-bold text-[#1A1A1A]">{word.exampleVerse.reference}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredTierWords.length === 0 && (
              <div className="text-center py-8 text-xs font-sans text-[#8C7D6B]">
                Слова не найдены по вашему запросу «{freqSearch}»
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: THEMATIC CLUSTERS (СЕМАНТИЧЕСКИЕ ГРУППЫ) */}
      {/* ========================================================================= */}
      {activeTab === 'thematic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEMATIC_GROUPS.map((group) => (
              <div
                key={group.id}
                onClick={() => setSelectedThematicId(group.id)}
                className={`p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedThematicId === group.id
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                    : 'border-[#E5E1DA] bg-white hover:border-[#1A1A1A]'
                }`}
              >
                <div>
                  <span className="text-lg mb-2 block">{group.iconSymbol}</span>
                  <h4 className="text-sm font-serif italic font-bold">{group.nameRu}</h4>
                  <p className="text-[10px] font-serif opacity-70 mt-0.5">{group.nameGreek}</p>
                </div>
                <span className="text-[10px] font-sans uppercase tracking-widest mt-3 opacity-60">
                  Группа
                </span>
              </div>
            ))}
          </div>

          {/* Section Mastery Header for Thematic Group with Portions */}
          {getThematicWords().length > 0 && (() => {
            const themWords = getThematicWords();
            const batchSize = currentStudent.settings?.batchSize || 8;
            const totalThemeChunks = Math.ceil(themWords.length / batchSize);
            const sectionKey = `theme_${currentThematicInfo.id}`;
            const completedChunkList = currentStudent.completedChunks?.[sectionKey] || [];

            let nextChunkIndex = 0;
            for (let i = 0; i < totalThemeChunks; i++) {
              if (!completedChunkList.includes(i)) {
                nextChunkIndex = i;
                break;
              }
            }

            // Find unmastered words strictly from ALREADY COMPLETED chunks
            const alreadyStudiedWords = themWords.slice(0, nextChunkIndex * batchSize);
            const weakWordsFromTheme = alreadyStudiedWords.filter((w) => {
              const m = currentStudent.wordMastery[w.id];
              return m && (m.consecutiveCorrect < 2 || m.factor < 2.0);
            });

            const nextChunkStart = nextChunkIndex * batchSize + 1;
            const nextChunkEnd = Math.min(themWords.length, (nextChunkIndex + 1) * batchSize);

            return (
              <div className="space-y-4">
                <SectionMasteryHeader
                  title={currentThematicInfo.nameRu}
                  subtitle={`${currentThematicInfo.nameGreek} — ${currentThematicInfo.descriptionRu}`}
                  stats={calculateSectionMasteryStats(
                    themWords.map((w) => w.id),
                    currentStudent.wordMastery
                  )}
                  onQuickPractice={() => {
                    const nextSRSStatus = getChunkSRSStatus(sectionKey, nextChunkIndex, currentStudent, true, nowMs);
                    const nextStage = nextSRSStatus.step === 0 ? 0 : nextSRSStatus.step === 1 ? 1 : 2;
                    onStartPractice(
                      `Тема: ${currentThematicInfo.nameRu} — Порция ${nextChunkIndex + 1}/${totalThemeChunks}`,
                      themWords,
                      BIBLICAL_PHRASES,
                      selectedTrainingMode,
                      selectedDirection,
                      sectionKey,
                      nextChunkIndex,
                      weakWordsFromTheme,
                      nextStage
                    );
                  }}
                  practiceButtonText={
                    completedChunkList.length >= totalThemeChunks
                      ? `Повторить тему (все порции)`
                      : `Учить: Порция ${nextChunkIndex + 1}/${totalThemeChunks} (${nextChunkStart}–${nextChunkEnd}) ➔`
                  }
                />

                {/* Portions Strip */}
                {totalThemeChunks > 1 && (
                  <div className="border border-[#E5E1DA] p-3.5 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
                          Порции темы ({batchSize} слов в порции):
                        </span>
                        <span className="text-[10px] font-sans text-[#2D4A32] font-bold bg-[#C5D9C8] px-1.5 py-0.2">
                          Пройдено: {completedChunkList.length} / {totalThemeChunks}
                        </span>
                      </div>
                      <p className="text-[11px] font-sans text-[#6B655C]">
                        3 ступени повторения: <span className="font-semibold text-[#1A1A1A]">45 мин</span> ➔ <span className="font-semibold text-[#1A1A1A]">24 ч (1 день)</span> ➔ <span className="font-semibold text-[#1A1A1A]">3 дня</span> ➔ ✅ Выучено
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: totalThemeChunks }).map((_, cIdx) => {
                        const isDone = completedChunkList.includes(cIdx);
                        const isNext = cIdx === nextChunkIndex && !isDone;
                        const cStart = cIdx * batchSize + 1;
                        const cEnd = Math.min(themWords.length, (cIdx + 1) * batchSize);
                        const srsStatus = getChunkSRSStatus(sectionKey, cIdx, currentStudent, isNext, nowMs);

                        return (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => {
                              const studiedSoFar = themWords.slice(0, cIdx * batchSize);
                              const weakPrior = studiedSoFar.filter((w) => {
                                const m = currentStudent.wordMastery[w.id];
                                return m && (m.consecutiveCorrect < 2 || m.factor < 2.0);
                              });
                              const targetStage = srsStatus.step === 0 ? 0 : srsStatus.step === 1 ? 1 : 2;
                              onStartPractice(
                                `Тема: ${currentThematicInfo.nameRu} — Порция ${cIdx + 1}/${totalThemeChunks} (${cStart}–${cEnd})`,
                                themWords,
                                BIBLICAL_PHRASES,
                                selectedTrainingMode,
                                selectedDirection,
                                sectionKey,
                                cIdx,
                                weakPrior,
                                targetStage
                              );
                            }}
                            className={`px-3 py-1.5 text-xs font-sans border transition-all cursor-pointer flex items-center gap-1.5 rounded-xs shadow-2xs ${srsStatus.buttonClass}`}
                            title={srsStatus.tooltipText}
                          >
                            <span>Порция {cIdx + 1}</span>
                            {srsStatus.isNext && (
                              <span className="text-[9px] bg-amber-400 text-[#1A1A1A] px-1 py-0.2 font-bold rounded-xs">
                                СЛЕД
                              </span>
                            )}
                            {srsStatus.inCooldown && (
                              <span className="text-[9px] bg-[#E8DDCB] text-[#7A5A21] px-1 py-0.2 font-medium rounded-xs flex items-center gap-0.5" title={srsStatus.tooltipText}>
                                <Clock className="w-2.5 h-2.5" />
                                {srsStatus.remainingText}
                              </span>
                            )}
                            {srsStatus.isDue && (
                              <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 font-bold rounded-xs flex items-center gap-0.5 animate-pulse" title={srsStatus.tooltipText}>
                                <Bell className="w-2.5 h-2.5" />
                                Повторить ({srsStatus.step}/3)
                              </span>
                            )}
                            {srsStatus.isMastered && (
                              <span className="text-[9px] bg-[#2D4A32] text-white px-1 py-0.2 font-bold rounded-xs flex items-center gap-0.5" title={srsStatus.tooltipText}>
                                <CheckCircle className="w-2.5 h-2.5" />
                                Выучено
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="border border-[#E5E1DA] p-6 bg-white shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E1DA] pb-4">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
                  {currentThematicInfo.nameGreek}
                </span>
                <h3 className="text-xl font-serif text-[#1A1A1A] font-bold">
                  Словарь: {currentThematicInfo.nameRu}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  const words = getThematicWords();
                  onStartPractice(
                    `Тема: ${currentThematicInfo.nameRu}`,
                    words,
                    BIBLICAL_PHRASES,
                    selectedTrainingMode,
                    selectedDirection,
                    `theme_${currentThematicInfo.id}`,
                    0,
                    []
                  );
                }}
                className="px-6 py-3 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Старт ({getThematicWords().length})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {getThematicWords().map((word) => {
                const mastery = currentStudent.wordMastery[word.id];
                return (
                  <div
                    key={word.id}
                    className="p-3.5 bg-[#F9F7F2] border border-[#E5E1DA] hover:border-[#1A1A1A] transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-serif text-xl font-bold text-[#1A1A1A]">
                            {word.article ? `${word.article} ` : ''}
                            {word.greek}
                          </span>
                          <p className="text-[11px] font-sans text-[#8C7D6B] italic">
                            [{word.transliterationRu}]
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => speakErasmian(word.greek, 0.85)}
                          className="p-1.5 border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-white text-[#1A1A1A] transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-1">
  <p className="text-sm font-serif italic text-[#2C3E50]">
    «{word.translationRu}»
  </p>
  <button
    type="button"
    onClick={() => speakRussian(word.translationRu, 1.0)}
    className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-[#F9F7F2] rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
    title="Произнести по-русски"
  >
    <Volume2 className="w-3 h-3" />
  </button>
</div>
                      <EditableMnemonic 
                        word={word} 
                        customMnemonics={currentStudent.customMnemonics} 
                        onUpdateMnemonic={onUpdateMnemonic}
                      />
                    </div>

                    {/* Word Mastery Progress Bar */}
                    <div className="pt-2 border-t border-[#E5E1DA]/60 space-y-1.5">
                      <WordMasteryBar mastery={mastery} />
                      <div className="flex justify-between items-center text-[10px] font-sans text-[#6B655C]">
                        <span>{word.exampleVerse?.reference || 'НЗ'}</span>
                        <span className="bg-[#E5E1DA] px-1.5 py-0.2">В НЗ: {word.ntFrequency} раз</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSONAL DICTIONARY & SPACED REPETITION */}
      {/* ========================================================================= */}
      {activeTab === 'my_dictionary' && (
        <div className="border border-[#E5E1DA] p-6 bg-white shadow-xs space-y-4">
          {/* Global Dictionary SRS Mastery Overview */}
          <SectionMasteryHeader
            title="Общий прогресс по словарю Нового Завета"
            subtitle="Индивидуальный статус заучивания и стабильности памяти по алгоритму SRS"
            stats={calculateSectionMasteryStats(
              GREEK_VOCABULARY.map((w) => w.id),
              currentStudent.wordMastery
            )}
            onQuickPractice={() => {
              onStartPractice(
                'Интервальное повторение',
                GREEK_VOCABULARY,
                BIBLICAL_PHRASES,
                selectedTrainingMode,
                selectedDirection
              );
            }}
            practiceButtonText="Тренировка всех слов"
          />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E1DA] pb-4 pt-2">
            <div>
              <h3 className="text-xl font-serif text-[#1A1A1A] font-bold">
                Словарь корпуса ({GREEK_VOCABULARY.length} слов)
              </h3>
              <p className="text-xs font-sans text-[#6B655C] mt-0.5">
                Все слова корпуса Нового Завета с транскрипцией, шкалой усвоения и произношением.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-[#8C7D6B]" />
              <input
                type="text"
                value={dictSearch}
                onChange={(e) => setDictSearch(e.target.value)}
                placeholder="Поиск слова..."
                className="w-full pl-8 pr-3 py-2 border border-[#E5E1DA] bg-white text-xs font-sans"
              />
            </div>
          </div>

          <div className="divide-y divide-[#E5E1DA] border border-[#E5E1DA]">
            {GREEK_VOCABULARY.filter(
              (w) =>
                w.greek.includes(dictSearch) ||
                w.translationRu.toLowerCase().includes(dictSearch.toLowerCase()) ||
                w.transliterationRu.toLowerCase().includes(dictSearch.toLowerCase())
            ).map((word) => {
              const mastery = currentStudent.wordMastery[word.id];
              return (
                <div
                  key={word.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => speakErasmian(word.greek, 0.85)}
                      className="p-2 border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-white text-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-serif text-xl font-bold text-[#1A1A1A]">
                          {word.article ? `${word.article} ` : ''}
                          {word.greek}
                        </span>
                        <span className="text-xs font-sans text-[#8C7D6B]">
                          [{word.transliterationRu}]
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
  <p className="text-xs font-serif italic text-[#2C3E50]">
    {word.translationRu}
  </p>
  <button
    type="button"
    onClick={() => speakRussian(word.translationRu, 1.0)}
    className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-[#F9F7F2] rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
    title="Произнести по-русски"
  >
    <Volume2 className="w-3 h-3" />
  </button>
</div>
                      <EditableMnemonic 
                        word={word} 
                        customMnemonics={currentStudent.customMnemonics} 
                        onUpdateMnemonic={onUpdateMnemonic}
                        className="!text-[10px]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between sm:justify-end text-xs font-sans min-w-[240px]">
                    <span className="text-[10px] uppercase text-[#6B655C] bg-[#E5E1DA] px-2 py-0.5 whitespace-nowrap self-start sm:self-auto">
                      {word.thematicGroupNameRu}
                    </span>
                    <span className="text-[#1A1A1A] font-semibold whitespace-nowrap">
                      {word.ntFrequency} раз
                    </span>
                    <div className="w-36">
                      <WordMasteryBar mastery={mastery} showDetails={false} compact={true} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for student to view graded exam with marks (+, +-, -) and teacher comments */}
      {selectedExamToReview && (
        <ExamReviewModal
          assignment={selectedExamToReview}
          onClose={() => setSelectedExamToReview(null)}
          onAcknowledge={() => {
            if (onAcknowledgeHomework) {
              onAcknowledgeHomework(selectedExamToReview.id);
            }
          }}
        />
      )}
    </div>
  );
};
