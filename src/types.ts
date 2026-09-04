export type PartOfSpeech = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'preposition' 
  | 'conjunction' 
  | 'pronoun' 
  | 'adverb' 
  | 'particle';

export type Gender = 'masculine' | 'feminine' | 'neuter';

export type FrequencyCategory = 
  | '>500' 
  | '200-500' 
  | '100-200' 
  | '50-100' 
  | '20-50' 
  | '10-20' 
  | '<10';

export interface ExampleVerse {
  reference: string;
  greekText: string;
  translationRu: string;
  highlightWord: string;
}

export interface GreekWord {
  id: string;
  greek: string;
  lemma: string;
  transliterationRu: string;
  erasmianIpa: string;
  partOfSpeech: PartOfSpeech;
  gender?: Gender;
  article?: string; // ὁ, ἡ, τό
  translationRu: string;
  additionalMeaningsRu: string[];
  ntFrequency: number;
  frequencyCategory: FrequencyCategory;
  thematicGroup: string;
  thematicGroupNameRu: string;
  chapters: string[]; // e.g. ['john_1', '1john_1', 'romans_1']
  exampleVerse: ExampleVerse;
  erasmianNotes?: string;
  morphologyNotes?: string;
  mnemonicRu?: string;
}

export interface ThematicGroupInfo {
  id: string;
  nameRu: string;
  nameGreek: string;
  descriptionRu: string;
  iconSymbol: string;
  colorBg: string;
}

export interface ChapterInfo {
  id: string;
  bookRu: string;
  bookGreek: string;
  chapterNumber: number;
  titleRu: string;
  totalWordsInChapter: number;
  rareWordsCount: number; // words < 50 times in NT
  descriptionRu: string;
  textPassageGreek: string;
  textPassageRu: string;
}

export interface BiblicalPhrase {
  id: string;
  reference: string;
  greekText: string;
  translationRu: string;
  tokens: { id: string; greek: string; translation: string; order: number }[];
  chapter: string;
}

export type TrainingMode = 
  | 'all' 
  | 'flashcards' 
  | 'builder' 
  | 'typing' 
  | 'quiz' 
  | 'audio'
  | 'match';

export type TrainingDirection = 
  | 'bidirectional' 
  | 'greek_to_ru' 
  | 'ru_to_greek';

export type ExerciseType = 
  | 'flashcard' 
  | 'multiple_choice' 
  | 'reverse_choice' 
  | 'match_pairs' 
  | 'word_builder'
  | 'phrase_builder' 
  | 'typing_input'
  | 'audio_quiz';

export interface ExerciseItem {
  id: string;
  type: ExerciseType;
  word?: GreekWord;
  phrase?: BiblicalPhrase;
  promptRu: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  pairs?: { greek: string; translation: string }[]; // for match_pairs
  letters?: { id: string; char: string }[]; // for word_builder
  hint?: string;
  direction?: TrainingDirection;
  flashcardSide?: 'greek_first' | 'ru_first';
}

export interface ExamAnswer {
  wordId: string;
  wordGreek: string;
  correctAnswerRu: string;
  studentAnswer: string;
  teacherMark?: 'full' | 'half' | 'zero';
  isComposition?: boolean;
  promptRu?: string;
  expectedGreek?: string;
}

export interface MorphologyMistakeItem {
  wordId: string;
  form: string;
  lemma: string;
  translation: string;
  pos: string;
  grammarRu: string;
}

export interface ManualMorphologyWordItem {
  id: string;
  greekWord: string; // e.g. "ἐθεασάμεθα"
  verseRef?: string; // e.g. "Ин. 1:14"
  contextPhrase?: string; // e.g. "καὶ ἐθεασάμεθα τὴν δόξαν αὐτοῦ"
  teacherReferenceNotes?: string; // Optional reference for teacher e.g. "θεάομαι: Аорист, Действит., Изъявит., 1 л. мн.ч."
}

export interface StudentMorphologyFormSelection {
  lemma?: string; // словарная форма, e.g. "θεάομαι"
  partOfSpeech?: 'verb' | 'noun' | 'adjective' | 'participle' | 'pronoun' | 'other';
  tense?: 'pres' | 'impf' | 'fut' | 'aor' | 'perf' | 'plup';
  voice?: 'act' | 'mid' | 'pass' | 'midpass';
  mood?: 'ind' | 'subj' | 'opt' | 'impv' | 'inf' | 'ptcp';
  person?: '1' | '2' | '3';
  number?: 'sg' | 'pl';
  case?: 'nom' | 'gen' | 'dat' | 'acc' | 'voc';
  gender?: 'masc' | 'fem' | 'neut';
  commentaryRu?: string; // текстовый комментарий/перевод
}

export interface StudentManualMorphologyAnswer {
  wordId: string;
  greekWord: string;
  verseRef?: string;
  contextPhrase?: string;
  teacherReferenceNotes?: string;
  studentSelection: StudentMorphologyFormSelection;
  teacherMark?: 'full' | 'half' | 'zero';
  teacherComment?: string;
}

export interface SelectedModuleInfo {
  id: string; // e.g. 'john_1', 'freq_tier_500_plus', 'thematic_nature_astronomy'
  title: string;
  mode: 'frequency' | 'thematic' | 'contextual_reader' | 'custom_list';
  targetId: string;
  wordCount?: number;
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  mode: 'frequency' | 'thematic' | 'contextual_reader' | 'custom_list' | 'multi_module';
  assignmentType: 'practice' | 'exam' | 'greek_composition' | 'morphology' | 'manual_morphology';
  customPromptRu?: string; // e.g. "Напишите на греческом: В начале было Слово"
  expectedGreekAnswer?: string; // Optional reference for teacher
  studentCompositionAnswer?: string; // Greek text typed by student
  // Manual morphology task words & student answers:
  manualMorphologyWords?: ManualMorphologyWordItem[];
  manualMorphologyAnswers?: StudentManualMorphologyAnswer[];
  examConfig?: { wordCount: number };
  examAnswers?: ExamAnswer[];
  morphologyConfig?: {
    targetPos: 'all' | 'noun' | 'verb';
    wordCount: number;
  };
  morphologyMistakesDetails?: MorphologyMistakeItem[];
  morphologyTotalWords?: number;
  morphologyCorrectCount?: number;
  trainingMode?: TrainingMode;
  direction?: TrainingDirection;
  targetId: string;
  targetIds?: string[];
  selectedModules?: SelectedModuleInfo[];
  assignedDate: string;
  dueDate: string | null;
  completed: boolean;
  scorePercent?: number;
  xpReward: number;
  teacherFeedback?: string;
  teacherGrade?: number;
  teacherGradeStatus?: 'pending' | 'graded' | 'passed' | 'revision' | 'excellent';
  gradedDate?: string;
  // Multi-round Spaced Repetition configuration & state:
  requiredRounds?: number; // 1, 2, or 3 passes of all chunks (default 1)
  cooldownHours?: number; // Hours between rounds (e.g. 0, 4, 8, 12, 24)
  currentRound?: number; // 1-indexed (1, 2, 3)
  completedRounds?: number; // how many full passes finished (0, 1, 2)
  lastRoundCompletedTime?: number; // timestamp in ms when the previous round was completed
  completedChunkIndicesForCurrentRound?: number[]; // chunk indices finished in active round e.g. [0, 1]
  studentReviewed?: boolean; // marked true when student views/acknowledges graded result
  studentReviewedDate?: string;
}

export interface StudentMistake {
  wordId: string;
  wordGreek: string;
  translationRu: string;
  givenAnswer: string;
  date: string;
}

export interface LearningSessionAttempt {
  id: string;
  date: string; // ISO date string or formatted
  title: string;
  mode: 'frequency' | 'thematic' | 'contextual_reader' | 'custom_list';
  trainingMode?: TrainingMode;
  direction?: TrainingDirection;
  scorePercent: number;
  xpGained: number;
  totalWordsCount: number;
  mistakes: {
    wordId: string;
    wordGreek: string;
    translationRu: string;
    givenAnswer: string;
  }[];
  teacherGrade?: number; // 0-100%
  teacherGradeStatus?: 'passed' | 'revision' | 'excellent';
  teacherFeedback?: string;
  teacherTags?: string[];
  gradedAt?: string;
}

export interface StudentSettings {
  preferredLearningMode: 'contextual_reader' | 'frequency' | 'thematic';
  audioSpeed: number; // 0.7, 0.82, 1.0, 1.15
  voiceEngine?: 'erasmian_accented' | 'greek_native' | 'latin_phonetic' | 'auto';
  dailyWordGoal: number; // 5, 10, 15, 25
  batchSize?: number; // 5, 8, 10, 15, 0 (all)
  showTransliteration: boolean;
  showPhoneticIpa: boolean;
  greekFontSize: 'normal' | 'large' | 'huge';
  soundEffectsEnabled: boolean;
  autoPlayAudio: boolean;
}

export interface WordSkillsProgress {
  reading: number;   // 0 to 100% - 👁️ Чтение (Греческий -> Русский)
  writing: number;   // 0 to 100% - ✍️ Письмо (Конструктор / Набор)
  listening: number; // 0 to 100% - 🎧 Аудиослух (Восприятие на слух)
}

export interface WordMasteryProgress {
  level: number; // 0 to 5
  errorCount: number;
  correctCount: number;
  lastReviewed: string; // YYYY-MM-DD
  lastReviewedTime?: number; // timestamp in ms for cognitive interval calculation
  nextReviewDate?: string; // YYYY-MM-DD
  easeFactor?: number; // SM-2 ease factor (1.3 to 3.0, default 2.5)
  intervalDays?: number; // days until next review
  repetitionCount?: number; // count of consecutive successful reviews
  skills?: WordSkillsProgress; // 👁️ Чтение, ✍️ Письмо, 🎧 Слух
}

export interface Student {
  id: string;
  name: string;
  greekAlias: string;
  avatar: string;
  email?: string;
  photoURL?: string;
  xp: number;
  streakDays: number;
  lastActive: string;
  accuracyRate: number; // 0 - 100
  masteredWordsCount: number;
  completedLessons: string[];
  completedChunks?: Record<string, number[]>; // map sectionId -> completed chunk indices e.g. { 'john_1': [0, 1] }
  completedChunkTimes?: Record<string, number>; // map sectionId_chunkIndex -> timestamp in ms when last completed
  completedChunkRounds?: Record<string, number>; // map sectionId_chunkIndex -> current SRS repetition step (1: 45m, 2: 24h, 3: 3d/mastered)
  wordsForReview?: string[]; // word IDs that student made mistakes on or need reinforcement
  morphologyMistakes?: string[]; // morphological word IDs that student made mistakes on
  assignedHomework: HomeworkAssignment[];
  wordMastery: Record<string, WordMasteryProgress>;
  recentMistakes: StudentMistake[];
  sessionAttempts: LearningSessionAttempt[];
  settings: StudentSettings;
  notesFromTeacher?: string;
  customMnemonics?: Record<string, string>; // Maps word.id to custom mnemonic string
}

export interface TeacherCustomList {
  id: string;
  title: string;
  description: string;
  wordIds: string[];
  createdAt: string;
  assignedToAll: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'teacher' | 'student';
  greekAlias: string;
  avatar: string;
  createdAt: string;
}

// Morphology Data Models
export type MorphPartOfSpeech = 'noun' | 'verb' | 'adjective' | 'pronoun' | 'participle';

export interface MorphologyWord {
  id: string;
  form: string;
  stem: string;
  ending: string;
  lemma: string;
  translation: string;
  pos: MorphPartOfSpeech;
  // Noun specific
  case?: string | string[];
  gender?: string | string[];
  // Verb specific
  tense?: string | string[];
  voice?: string | string[];
  mood?: string | string[];
  person?: string | string[];
  // Common
  number?: string | string[];
}
