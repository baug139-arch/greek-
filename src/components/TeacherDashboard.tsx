import React, { useState } from 'react';
import { 
  Users, 
  User,
  PlusCircle, 
  BookOpen, 
  Award, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  BarChart3, 
  Edit3, 
  ArrowRight,
  Send,
  Sparkles,
  Volume2,
  Check,
  MessageSquare,
  Filter,
  CheckCheck,
  RotateCcw,
  FileText,
  HelpCircle,
  Mail,
  Trash2,
  Shuffle,
  X
} from 'lucide-react';
import { 
  Student, 
  GreekWord, 
  TeacherCustomList, 
  HomeworkAssignment, 
  LearningSessionAttempt, 
  TrainingMode, 
  TrainingDirection,
  ExamAnswer,
  SelectedModuleInfo,
  StudentManualMorphologyAnswer,
  MorphologyWord
} from '../types';
import { THEMATIC_GROUPS, CHAPTERS_DATA, GREEK_VOCABULARY } from '../data/greekVocabulary';
import { ALL_FREQUENCY_TIERS, FREQUENCY_ALL_WORDS } from '../data/frequencyVocabulary';
import { JOHN_GOSPEL_CHAPTERS, ALL_JOHN_WORDS } from '../data/johnGospelVocabulary';
import { MORPHOLOGY_DATABASE } from '../data/morphologyDatabase';
import { formatMorphologyGrammar } from '../utils/morphologyFormat';
import { getAllAvailableCourses, CourseOption, getWordsForSelectedModules, getWordsForAssignment } from '../utils/courseUtils';
import { TeacherExamGradingModal } from './TeacherExamGradingModal';
import { speakErasmian } from '../utils/audio';

interface TeacherDashboardProps {
  students: Student[];
  customLists: TeacherCustomList[];
  onAssignHomework: (assignment: Omit<HomeworkAssignment, 'id' | 'completed'>, targetStudentIds: string[] | string | 'all') => void;
  onCreateCustomList: (list: Omit<TeacherCustomList, 'id' | 'createdAt'>) => void;
  onUpdateStudentNote: (studentId: string, note: string) => void;
  onGradeAttempt: (
    studentId: string,
    attemptId: string,
    grade: number,
    status: 'passed' | 'revision' | 'excellent',
    feedback: string,
    tags: string[]
  ) => void;
  onGradeExam?: (
    studentId: string,
    assignmentId: string,
    updatedAnswers: ExamAnswer[],
    scorePercent: number,
    status: 'passed' | 'revision' | 'excellent',
    feedback: string,
    updatedMorphologyAnswers?: StudentManualMorphologyAnswer[]
  ) => void;
  onSelectStudentToSimulate: (student: Student) => void;
  onOpenAddStudentModal?: () => void;
  onDeleteStudent?: (studentId: string) => void;
  onResetStudentProgress?: (studentId: string) => void;
  onDeleteAssignment?: (studentId: string, assignmentId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  customLists,
  onAssignHomework,
  onCreateCustomList,
  onUpdateStudentNote,
  onGradeAttempt,
  onGradeExam,
  onSelectStudentToSimulate,
  onOpenAddStudentModal,
  onDeleteStudent,
  onResetStudentProgress,
  onDeleteAssignment,
}) => {
  const [activeViewTab, setActiveViewTab] = useState<'students_list' | 'assignments_list' | 'grading_queue'>('students_list');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentRosterSearch, setStudentRosterSearch] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  
  // Available courses
  const availableCourses = getAllAvailableCourses(customLists);

  // Assignment Form State
  const [assignTargetMode, setAssignTargetMode] = useState<'all' | 'selected'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(students.map((s) => s.id));
  const [studentSearchInModal, setStudentSearchInModal] = useState('');
  
  // Multi-module Selection State in Assign Modal
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(['john_1']);
  const [moduleCategoryTab, setModuleCategoryTab] = useState<'all' | 'john_gospel' | 'frequency' | 'thematic' | 'custom_list'>('john_gospel');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');

  const [assignmentType, setAssignmentType] = useState<'practice' | 'exam' | 'greek_composition' | 'morphology' | 'manual_morphology'>('practice');
  const [examWordCount, setExamWordCount] = useState<number>(20);
  const [compositionPromptRu, setCompositionPromptRu] = useState('В начале было Слово, и Слово было у Бога, и Слово было Бог');
  const [compositionExpectedGreek, setCompositionExpectedGreek] = useState('Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν, καὶ θεὸς ἦν ὁ λόγος');
  const [morphologyTargetPos, setMorphologyTargetPos] = useState<'all' | 'noun' | 'verb'>('all');
  const [morphologyWordCount, setMorphologyWordCount] = useState<number>(10);
  // Manual Morphology Words Form State (Teacher selects 1-5 words from morphology database)
  const [manualMorphologyItems, setManualMorphologyItems] = useState<{
    id: string;
    greekWord: string;
    verseRef?: string;
    contextPhrase?: string;
    teacherReferenceNotes: string;
  }>([
    {
      id: 'mm_1',
      greekWord: 'λόγος',
      teacherReferenceNotes: 'λόγος — Существительное • Им. п. • Ед. ч. • Муж. род',
    },
    {
      id: 'mm_2',
      greekWord: 'ἦλθον',
      teacherReferenceNotes: 'ἔρχомай — Глагол • 1-е лицо • Аорист (Aor) • Активный залог (Act) • Изъявительное накл. (Ind) • Ед. ч.',
    },
    {
      id: 'mm_3',
      greekWord: 'λύων',
      teacherReferenceNotes: 'λύω — Причастие • Настоящее вр. (Pres) • Активный залог (Act) • Им. п. • Ед. ч. • Муж. род',
    },
  ]);
  const [morphBankPos, setMorphBankPos] = useState<'all' | 'noun' | 'verb' | 'adjective' | 'participle' | 'pronoun'>('all');
  const [morphBankSearch, setMorphBankSearch] = useState('');
  const [assignTrainingMode, setAssignTrainingMode] = useState<TrainingMode>('all');
  const [assignTrainingDirection, setAssignTrainingDirection] = useState<TrainingDirection>('bidirectional');
  const [assignRounds, setAssignRounds] = useState<number>(1);
  const [assignCooldownHours, setAssignCooldownHours] = useState<number>(4);
  const [assignTitle, setAssignTitle] = useState('Иоанна 1: Пролог и лексика');
  const [isNoDeadline, setIsNoDeadline] = useState(false);
  const [assignDueDate, setAssignDueDate] = useState('2026-08-30');
  const [assignXp, setAssignXp] = useState(50);

  // Filter in assignments tab
  const [assignmentFilterStudentId, setAssignmentFilterStudentId] = useState<string>('all');

  // Custom List Form State
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [searchWordQuery, setSearchWordQuery] = useState('');

  // Note editing state for selected student
  const [teacherNoteText, setTeacherNoteText] = useState('');

  // Modal state for confirming assignment deletion
  const [assignmentToDelete, setAssignmentToDelete] = useState<{
    studentId: string;
    studentName: string;
    assignmentId: string;
    title: string;
  } | null>(null);

  // Modal state for confirming student deletion
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Attempt Grading Modal State (for normal practice sessions)
  const [activeGradingSession, setActiveGradingSession] = useState<{
    student: Student;
    attempt: LearningSessionAttempt;
  } | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(90);
  const [gradeStatus, setGradeStatus] = useState<'passed' | 'revision' | 'excellent'>('passed');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [gradeTags, setGradeTags] = useState<string[]>(['Хороший результат']);
  const [tagInput, setTagInput] = useState('');

  // Exam Grading Modal State (for hand-graded exams with + / +- / -)
  const [activeExamToGrade, setActiveExamToGrade] = useState<{
    student: Student;
    assignment: HomeworkAssignment;
  } | null>(null);

  // Morphology Report Modal State
  const [viewingMorphologyReport, setViewingMorphologyReport] = useState<{
    student: Student;
    assignment: HomeworkAssignment;
  } | null>(null);

  // Filter for grading queue
  const [gradingFilter, setGradingFilter] = useState<'all' | 'pending' | 'graded'>('all');

  // Helper to map IDs to SelectedModuleInfo
  const getSelectedModulesInfo = (ids: string[]): SelectedModuleInfo[] => {
    return ids.map((id) => {
      const c = availableCourses.find((item) => item.id === id);
      if (c) {
        return {
          id: c.id,
          title: c.title,
          mode: c.mode,
          targetId: c.targetId,
          wordCount: c.wordCount,
        };
      }
      return {
        id,
        title: id,
        mode: 'contextual_reader',
        targetId: id,
      };
    });
  };

  const getAutoTitleForSelection = (ids: string[], type: 'practice' | 'exam' | 'greek_composition' | 'morphology') => {
    const prefix = type === 'exam' ? 'Контрольная работа: ' : 'Задание: ';
    if (ids.length === 0) return `${prefix}Без выбора модулей`;
    if (ids.length === 1) {
      const c = availableCourses.find((item) => item.id === ids[0]);
      return `${prefix}${c ? c.title : ids[0]}`;
    }
    // Check if all are John chapters
    const johnChapters = ids
      .map((id) => {
        const m = id.match(/^john_(\d+)$/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    if (johnChapters.length === ids.length) {
      // Check if consecutive e.g. 1, 2, 3
      const isConsecutive = johnChapters.every((val, idx) => idx === 0 || val === johnChapters[idx - 1] + 1);
      if (isConsecutive && johnChapters.length > 1) {
        return `${prefix}Иоанна ${johnChapters[0]}–${johnChapters[johnChapters.length - 1]}`;
      }
      return `${prefix}Иоанна ${johnChapters.join(', ')}`;
    }

    const mods = getSelectedModulesInfo(ids);
    const combined = getWordsForSelectedModules(mods, customLists);
    return `${prefix}${ids.length} модуля (${combined.length} слов)`;
  };

  const handleToggleModule = (moduleId: string) => {
    let nextIds: string[];
    if (selectedCourseIds.includes(moduleId)) {
      nextIds = selectedCourseIds.filter((id) => id !== moduleId);
      if (nextIds.length === 0) {
        nextIds = [moduleId]; // keep at least one
      }
    } else {
      nextIds = [...selectedCourseIds, moduleId];
    }
    setSelectedCourseIds(nextIds);
    setAssignTitle(getAutoTitleForSelection(nextIds, assignmentType));
    const mods = getSelectedModulesInfo(nextIds);
    const words = getWordsForSelectedModules(mods, customLists);
    if (examWordCount > words.length && words.length > 0) {
      setExamWordCount(Math.min(20, words.length));
    }
  };

  const handleSelectPresetModules = (presetIds: string[]) => {
    setSelectedCourseIds(presetIds);
    setAssignTitle(getAutoTitleForSelection(presetIds, assignmentType));
    const mods = getSelectedModulesInfo(presetIds);
    const words = getWordsForSelectedModules(mods, customLists);
    setExamWordCount(Math.min(20, Math.max(5, words.length)));
  };

  const handleAssignmentTypeChange = (type: 'practice' | 'exam' | 'greek_composition' | 'morphology' | 'manual_morphology') => {
    setAssignmentType(type);
    if (type === 'manual_morphology') {
      setAssignTitle(`Морфологический разбор (${manualMorphologyItems.length} слов)`);
      setAssignXp(80);
    } else if (type === 'greek_composition') {
      setAssignTitle(`Перевод на греческий: ${compositionPromptRu.slice(0, 30)}...`);
      setAssignXp(75);
    } else if (type === 'morphology') {
      setAssignTitle(`Морфология: ${morphologyTargetPos === 'all' ? 'Микс' : morphologyTargetPos === 'noun' ? 'Существительные' : 'Глаголы'}`);
      setAssignXp(40);
    } else if (type === 'exam') {
      setAssignTitle(getAutoTitleForSelection(selectedCourseIds, 'exam'));
      setAssignXp(100);
      const mods = getSelectedModulesInfo(selectedCourseIds);
      const words = getWordsForSelectedModules(mods, customLists);
      setExamWordCount(Math.min(20, Math.max(5, words.length)));
    } else {
      setAssignTitle(getAutoTitleForSelection(selectedCourseIds, 'practice'));
      setAssignXp(50);
    }
  };

  // Open Assign Modal helper
  const handleOpenAssignModal = (preselectedStudentId?: string) => {
    const initialIds = selectedCourseIds.length > 0 ? selectedCourseIds : ['john_1'];
    setSelectedCourseIds(initialIds);
    setAssignTitle(getAutoTitleForSelection(initialIds, assignmentType));
    const mods = getSelectedModulesInfo(initialIds);
    const words = getWordsForSelectedModules(mods, customLists);
    setExamWordCount(Math.min(20, Math.max(5, words.length)));

    if (preselectedStudentId) {
      setAssignTargetMode('selected');
      setSelectedStudentIds([preselectedStudentId]);
    } else {
      setAssignTargetMode('all');
      setSelectedStudentIds(students.map((s) => s.id));
    }
    setStudentSearchInModal('');
    setModuleSearchQuery('');
    setIsAssignModalOpen(true);
  };

  // Open deep-dive for a student
  const handleOpenStudent = (s: Student) => {
    setSelectedStudent(s);
    setTeacherNoteText(s.notesFromTeacher || '');
  };

  const handleSaveNote = () => {
    if (selectedStudent) {
      onUpdateStudentNote(selectedStudent.id, teacherNoteText);
    }
  };

  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignmentType !== 'manual_morphology' && selectedCourseIds.length === 0) return;

    if (assignTargetMode === 'selected' && selectedStudentIds.length === 0) {
      return;
    }

    const selectedMods = getSelectedModulesInfo(selectedCourseIds);
    const combinedWords = getWordsForSelectedModules(selectedMods, customLists);
    const totalWords = combinedWords.length;

    const targetStudents: string[] | 'all' = assignTargetMode === 'all' ? 'all' : selectedStudentIds;

    const isSingle = selectedMods.length === 1;
    const primaryCourse = selectedMods[0] || { mode: 'contextual_reader', targetId: 'john_1', title: 'Иоанна 1' };

    const finalMode = isSingle ? primaryCourse.mode : 'multi_module';
    const finalTargetId = isSingle ? primaryCourse.targetId : 'multi_modules';

    let finalTitle = assignTitle.trim();
    if (!finalTitle) {
      if (assignmentType === 'greek_composition') {
        finalTitle = `Напишите на греческом: ${compositionPromptRu.slice(0, 30)}...`;
      } else if (assignmentType === 'manual_morphology') {
        finalTitle = `Морфологический разбор (${manualMorphologyItems.length} слов)`;
      } else {
        finalTitle = getAutoTitleForSelection(selectedCourseIds, assignmentType);
      }
    }

    // Filter valid manual morphology words
    const validManualWords = manualMorphologyItems
      .filter((w) => w.greekWord.trim().length > 0)
      .map((w, idx) => ({
        id: w.id || `mm_word_${idx + 1}_${Date.now()}`,
        greekWord: w.greekWord.trim(),
        verseRef: w.verseRef?.trim() || undefined,
        contextPhrase: w.contextPhrase?.trim() || undefined,
        teacherReferenceNotes: w.teacherReferenceNotes?.trim() || undefined,
      }));

    onAssignHomework(
      {
        title: finalTitle,
        mode: assignmentType === 'manual_morphology' ? 'contextual_reader' : finalMode,
        targetId: assignmentType === 'manual_morphology' ? 'manual_morphology' : finalTargetId,
        targetIds: selectedCourseIds,
        selectedModules: selectedMods,
        assignmentType: assignmentType,
        customPromptRu: assignmentType === 'greek_composition' ? compositionPromptRu.trim() : undefined,
        expectedGreekAnswer: assignmentType === 'greek_composition' ? compositionExpectedGreek.trim() : undefined,
        manualMorphologyWords: assignmentType === 'manual_morphology' ? validManualWords : undefined,
        examConfig: assignmentType === 'exam' ? { wordCount: Math.min(examWordCount, Math.max(1, totalWords)) } : undefined,
        morphologyConfig: assignmentType === 'morphology' ? { targetPos: morphologyTargetPos, wordCount: morphologyWordCount } : undefined,
        trainingMode: assignmentType === 'exam' ? 'typing' : (assignTrainingMode === 'all' ? undefined : assignTrainingMode),
        direction: assignmentType === 'exam' ? 'greek_to_ru' : (assignTrainingDirection === 'bidirectional' ? undefined : assignTrainingDirection),
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: isNoDeadline ? null : assignDueDate,
        xpReward: assignXp,
        teacherGradeStatus: (assignmentType === 'exam' || assignmentType === 'greek_composition' || assignmentType === 'manual_morphology') ? 'pending' : undefined,
        requiredRounds: assignmentType === 'practice' ? assignRounds : 1,
        cooldownHours: assignmentType === 'practice' && assignRounds > 1 ? assignCooldownHours : 0,
        currentRound: 1,
        completedRounds: 0,
        completedChunkIndicesForCurrentRound: [],
      },
      targetStudents
    );
    setIsAssignModalOpen(false);
  };

  const handleCreateCustomListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim() || selectedWordIds.length === 0) return;

    onCreateCustomList({
      title: newListName,
      description: newListDesc,
      wordIds: selectedWordIds,
      assignedToAll: true,
    });
    setNewListName('');
    setNewListDesc('');
    setSelectedWordIds([]);
    setIsCreateListModalOpen(false);
  };

  // Collect all exams pending review across all students
  const pendingExams: { student: Student; assignment: HomeworkAssignment }[] = [];
  const allStudentAssignments: { student: Student; assignment: HomeworkAssignment }[] = [];

  students.forEach((s) => {
    (s.assignedHomework || []).forEach((hw) => {
      allStudentAssignments.push({ student: s, assignment: hw });
      if (
        (hw.assignmentType === 'exam' || hw.assignmentType === 'greek_composition' || hw.assignmentType === 'manual_morphology') &&
        hw.completed &&
        (hw.teacherGradeStatus === 'pending' || hw.teacherGrade === undefined)
      ) {
        pendingExams.push({ student: s, assignment: hw });
      }
    });
  });

  // Collect all practice attempts across all students
  const allAttempts = students.flatMap((s) =>
    (s.sessionAttempts || []).map((att) => ({
      student: s,
      attempt: att,
    }))
  );

  const pendingAttemptsCount = allAttempts.filter((item) => item.attempt.teacherGrade === undefined).length;
  const totalPendingReviewCount = pendingExams.length + pendingAttemptsCount;

  // Group stats calculations
  const totalCompletedLessons = students.reduce((acc, s) => acc + s.completedLessons.length, 0);
  const avgAccuracy = Math.round(
    students.reduce((acc, s) => acc + s.accuracyRate, 0) / Math.max(1, students.length)
  );
  const totalWordsLearned = students.reduce((acc, s) => acc + s.masteredWordsCount, 0);

  return (
    <div className="space-y-8 font-serif">
      {/* Top Magister Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[#E5E1DA] pb-6 bg-white p-6 shadow-2xs">
        <div>
          <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8C7D6B] block mb-1 font-bold">
            Панель преподавателя койне (Magister System)
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif italic text-[#1A1A1A]">
            Magister Dashboard <span className="text-sm font-sans font-normal text-[#8C7D6B] not-italic">| {students.length} Студентов</span>
          </h2>
          <p className="text-xs font-sans text-[#6B655C] mt-1 max-w-xl">
            Назначение любых курсов из базы, создание контрольных работ со случайной выборкой слов, ручная проверка переводов (+ / +- / -) и мониторинг группы.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 font-sans">
          {onOpenAddStudentModal && (
            <button
              type="button"
              onClick={onOpenAddStudentModal}
              disabled={students.length >= 10}
              className="px-4 py-2.5 bg-[#2C3E50] text-white hover:bg-[#1A1A1A] text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50 font-bold"
            >
              <Users className="w-3.5 h-3.5" />
              <span>+ Добавить ученика</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenAssignModal()}
            className="px-4 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-2xs font-bold"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Назначить задание / контрольную</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateListModalOpen(true)}
            className="px-4 py-2.5 bg-white border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F9F7F2] text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer font-bold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Создать набор слов</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-[#E5E1DA] flex space-x-6 text-xs font-sans uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveViewTab('students_list')}
          className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeViewTab === 'students_list'
              ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
              : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Студенты и Статистика ({students.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('assignments_list')}
          className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeViewTab === 'assignments_list'
              ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
              : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Все задания и контрольные ({allStudentAssignments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab('grading_queue')}
          className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 relative ${
            activeViewTab === 'grading_queue'
              ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
              : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Проверка работ</span>
          {totalPendingReviewCount > 0 && (
            <span className="bg-[#9E3B3B] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {totalPendingReviewCount}
            </span>
          )}
        </button>
      </div>

      {/* VIEW TAB 1: STUDENTS LIST & OVERVIEW */}
      {activeViewTab === 'students_list' && (
        <div className="space-y-6">
          {/* Analytics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-[#E5E1DA] p-5 bg-white shadow-2xs">
              <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] block mb-1 font-bold">
                Студентов в группе
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-serif text-[#1A1A1A]">{students.length}</span>
                <span className="text-xs font-sans text-[#2D4A32] bg-[#C5D9C8] px-2 py-0.5 rounded font-bold">
                  Активны
                </span>
              </div>
              <p className="text-xs font-sans text-[#6B655C] mt-2">
                Сводная точность группы: <strong className="text-[#1A1A1A]">{avgAccuracy}%</strong>
              </p>
            </div>

            <div className="border border-[#E5E1DA] p-5 bg-white shadow-2xs">
              <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] block mb-1 font-bold">
                Сдано контрольных и тестов
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-serif text-[#2C3E50]">
                  {allStudentAssignments.filter((a) => a.assignment.completed).length}
                </span>
                <span className="text-xs font-sans text-[#6B655C]">выполнено</span>
              </div>
              <p className="text-xs font-sans text-[#6B655C] mt-2">
                Ожидают проверки: <strong className="text-[#9E3B3B]">{pendingExams.length} контрольных</strong>
              </p>
            </div>

            <div className="border border-[#E5E1DA] p-5 bg-[#F9F7F2] shadow-2xs">
              <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] block mb-1 font-bold">
                Выучено слов в группе
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-serif text-[#2D4A32]">{totalWordsLearned}</span>
                <span className="text-xs font-sans text-[#6B655C]">в активной памяти</span>
              </div>
              <p className="text-xs font-sans text-[#6B655C] mt-2">
                Всего попыток: <strong className="text-[#1A1A1A]">{totalCompletedLessons}</strong>
              </p>
            </div>
          </div>

          {/* Student List Table */}
          <div className="border border-[#E5E1DA] bg-white shadow-2xs">
            <div className="p-4 border-b border-[#E5E1DA] bg-[#F9F7F2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-sans uppercase tracking-wider text-[#1A1A1A] font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#8C7D6B]" />
                  Журнал успеваемости студентов ({students.length} человек)
                </h3>
                <p className="text-xs font-sans text-[#6B655C]">
                  Администратор видит привязанные Google Email адреса и статус активности
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8C7D6B]" />
                <input
                  type="text"
                  value={studentRosterSearch}
                  onChange={(e) => setStudentRosterSearch(e.target.value)}
                  placeholder="Поиск по имени, псевдониму или email..."
                  className="w-full pl-8 pr-2.5 py-1.5 border border-[#E5E1DA] bg-white rounded text-xs text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="divide-y divide-[#E5E1DA]">
              {students.length === 0 ? (
                <div className="p-10 text-center bg-[#FAF8F5]">
                  <div className="w-12 h-12 rounded-full bg-[#F3EFEA] border border-[#E5E1DA] flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-[#8C7D6B]" />
                  </div>
                  <h4 className="text-sm font-sans font-bold text-[#1A1A1A]">
                    Нет зарегистрированных студентов
                  </h4>
                  <p className="text-xs font-sans text-[#6B655C] max-w-md mx-auto mt-1.5 leading-relaxed">
                    Все демонстрационные профили удалены. Студенты автоматически появятся в этом журнале, как только они авторизуются в приложении через свой аккаунт Google.
                  </p>
                </div>
              ) : (
                (() => {
                  const filtered = students.filter((student) => {
                    if (!studentRosterSearch) return true;
                    const q = studentRosterSearch.toLowerCase();
                    return (
                      student.name.toLowerCase().includes(q) ||
                      student.greekAlias.toLowerCase().includes(q) ||
                      (student.email && student.email.toLowerCase().includes(q))
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center text-xs font-sans text-[#6B655C]">
                        По запросу «{studentRosterSearch}» студентов не найдено.
                      </div>
                    );
                  }

                  return filtered.map((student, index) => {
                    const studentPendingCount = (student.assignedHomework || []).filter(
                      (hw) => hw.assignmentType === 'exam' && hw.completed && (hw.teacherGradeStatus === 'pending' || hw.teacherGrade === undefined)
                    ).length;

                    return (
                      <div
                        key={student.id}
                        onClick={() => handleOpenStudent(student)}
                        className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <span className="text-xs font-sans font-bold text-[#8C7D6B] w-5 shrink-0">
                            {index + 1}.
                          </span>
                          <div className="w-10 h-10 bg-[#F9F7F2] border border-[#E5E1DA] flex items-center justify-center text-lg rounded shadow-2xs shrink-0">
                            {student.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <h4 className="text-sm font-sans font-bold text-[#1A1A1A]">
                                {student.name}
                              </h4>
                              <span className="text-xs font-serif italic text-[#8C7D6B]">
                                ({student.greekAlias})
                              </span>
                              {student.email ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#2C3E50] bg-[#FAF8F5] border border-[#E5E1DA] px-2 py-0.5 rounded font-medium" title={student.email}>
                                  <Mail className="w-3 h-3 text-[#8C7D6B] shrink-0" />
                                  <span className="truncate max-w-[200px]">{student.email}</span>
                                </span>
                              ) : null}
                              {studentPendingCount > 0 && (
                                <span className="text-[10px] font-sans bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] px-1.5 py-0.5 rounded font-bold">
                                  ⏳ Контрольная на проверке ({studentPendingCount})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-sans text-[#6B655C] mt-0.5">
                              Активность: {student.lastActive} • Стрик: {student.streakDays} дн. • Заданий: {(student.assignedHomework || []).length}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 sm:space-x-6 w-full lg:w-auto justify-between lg:justify-end flex-wrap gap-y-2">
                          <div className="text-right">
                            <span className="text-[10px] font-sans uppercase text-[#8C7D6B] block font-bold">
                              Слов в базе
                            </span>
                            <span className="text-xs font-sans text-[#1A1A1A] font-semibold">
                              {student.masteredWordsCount} слов
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-sans uppercase text-[#8C7D6B] block font-bold">
                              Точность
                            </span>
                            <span
                              className={`text-xs font-sans font-bold ${
                                student.accuracyRate >= 90
                                  ? 'text-[#2D4A32]'
                                  : student.accuracyRate >= 75
                                  ? 'text-[#796B58]'
                                  : 'text-[#9E3B3B]'
                              }`}
                            >
                              {student.accuracyRate}%
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAssignModal(student.id);
                            }}
                            className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#2C3E50] text-white text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-2xs rounded"
                            title="Назначить персональное задание или контрольную этому ученику"
                          >
                            <Send className="w-3 h-3" />
                            <span>+ Задание</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudentToSimulate(student);
                            }}
                            className="px-3 py-1.5 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs font-sans uppercase text-[#2C3E50] tracking-wider transition-colors cursor-pointer font-bold rounded"
                            title="Войти под профилем этого студента"
                          >
                            Войти как
                          </button>

                          {onDeleteStudent && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStudentToDelete(student);
                              }}
                              className="p-1.5 text-[#8C7D6B] hover:text-[#9E3B3B] hover:bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#9E3B3B] rounded transition-colors cursor-pointer"
                              title="Удалить этого ученика"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: ASSIGNMENTS OVERVIEW */}
      {activeViewTab === 'assignments_list' && (
        <div className="space-y-6">
          <div className="p-4 bg-white border border-[#E5E1DA] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="text-base font-serif italic font-bold text-[#1A1A1A]">
                Реестр выданных заданий и контрольных работ
              </h3>
              <p className="text-xs font-sans text-[#6B655C]">
                Сводка по всем назначенным учебным модулям, срокам сдачи и статусам прохождения
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-sans">
                <span className="text-[#8C7D6B] font-bold">Фильтр по ученику:</span>
                <select
                  value={assignmentFilterStudentId}
                  onChange={(e) => setAssignmentFilterStudentId(e.target.value)}
                  className="p-1.5 border border-[#E5E1DA] bg-white rounded text-xs text-[#1A1A1A] font-medium"
                >
                  <option value="all">Все ученики ({students.length})</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.greekAlias})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAssignModal()}
                className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs uppercase font-sans tracking-wider font-bold rounded cursor-pointer flex items-center gap-1.5 ml-auto md:ml-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Назначить новое задание</span>
              </button>
            </div>
          </div>

          <div className="border border-[#E5E1DA] bg-white shadow-2xs divide-y divide-[#E5E1DA]">
            {allStudentAssignments.filter(
              (item) => assignmentFilterStudentId === 'all' || item.student.id === assignmentFilterStudentId
            ).length > 0 ? (
              allStudentAssignments
                .filter((item) => assignmentFilterStudentId === 'all' || item.student.id === assignmentFilterStudentId)
                .map(({ student, assignment }) => {
                const isExam = assignment.assignmentType === 'exam';
                const isComposition = assignment.assignmentType === 'greek_composition';
                const isManualMorph = assignment.assignmentType === 'manual_morphology';
                const isPendingGrade = (isExam || isComposition || isManualMorph) && assignment.completed && (assignment.teacherGradeStatus === 'pending' || assignment.teacherGrade === undefined);
                const isGraded = assignment.teacherGrade !== undefined;

                return (
                  <div key={`${student.id}_${assignment.id}`} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#FAF8F5]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-sans font-bold text-[#1A1A1A]">
                          {student.name}
                        </span>
                        <span className="text-xs text-[#8C7D6B] font-serif">
                          ({student.greekAlias})
                        </span>
                        {student.email && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2C3E50] bg-[#FAF8F5] border border-[#E5E1DA] px-1.5 py-0.5 rounded">
                            <Mail className="w-2.5 h-2.5 text-[#8C7D6B]" />
                            <span>{student.email}</span>
                          </span>
                        )}
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded font-bold uppercase ${
                          isManualMorph ? 'bg-[#4A3B32] text-white' : isComposition ? 'bg-[#2C3E50] text-white' : isExam ? 'bg-[#9E3B3B] text-white' : assignment.assignmentType === 'morphology' ? 'bg-[#D97706] text-white' : 'bg-[#E5E1DA] text-[#1A1A1A]'
                        }`}>
                          {isManualMorph ? '🔍 Морфо-разбор' : isComposition ? '✍️ Греческий перевод' : isExam ? '📝 Контрольная' : assignment.assignmentType === 'morphology' ? '🧩 Авто-пульт' : '⚡ Тренировка'}
                        </span>
                        {assignment.dueDate ? (
                          <span className="text-[11px] font-sans text-[#6B655C] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#8C7D6B]" />
                            Дедлайн: {assignment.dueDate}
                          </span>
                        ) : (
                          <span className="text-[11px] font-sans text-[#8C7D6B]">
                            (Без дедлайна)
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-serif font-bold text-[#1A1A1A]">
                        {assignment.title}
                      </h4>
                      {assignment.selectedModules && assignment.selectedModules.length > 1 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-sans text-[#6B655C]">
                          <span className="font-bold text-[#1A1A1A] bg-[#FAF8F5] border border-[#E5E1DA] px-1.5 py-0.5 rounded">
                            📚 {assignment.selectedModules.length} модуля:
                          </span>
                          <span className="text-[#2C3E50]">
                            {assignment.selectedModules.map((m) => m.title.split(':')[0]).join(', ')}
                          </span>
                        </div>
                      )}
                      {isComposition && assignment.customPromptRu && (
                        <p className="text-xs font-serif italic text-[#6B655C]">
                          «{assignment.customPromptRu}»
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right text-xs font-sans">
                        {isPendingGrade ? (
                          <span className="px-2.5 py-1 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded font-bold flex items-center gap-1">
                            ⏳ Ожидает проверки (+/-)
                          </span>
                        ) : isGraded ? (
                          <span className="px-2.5 py-1 bg-[#C5D9C8] text-[#2D4A32] rounded font-bold">
                            Оценка: {assignment.teacherGrade}%
                          </span>
                        ) : assignment.completed ? (
                          <span className="px-2.5 py-1 bg-[#C5D9C8] text-[#2D4A32] rounded font-bold">
                            ✓ Выполнено {assignment.requiredRounds && assignment.requiredRounds > 1 ? `(${assignment.requiredRounds}/${assignment.requiredRounds} кр.)` : ''}
                          </span>
                        ) : (assignment.completedRounds || 0) > 0 ? (
                          <span className="px-2.5 py-1 bg-[#E2ECE3] text-[#2D4A32] border border-[#C5D9C8] rounded font-bold">
                            Круг {(assignment.completedRounds || 0) + 1}/{assignment.requiredRounds || 1}
                          </span>
                        ) : (assignment.completedChunkIndicesForCurrentRound?.length || 0) > 0 ? (
                          <span className="px-2.5 py-1 bg-[#FAF8F5] border border-[#E5E1DA] text-[#1A1A1A] rounded font-medium">
                            Круг 1 • {assignment.completedChunkIndicesForCurrentRound?.length} порц.
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-[#FAF8F5] border border-[#E5E1DA] text-[#8C7D6B] rounded">
                            Не начато
                          </span>
                        )}
                      </div>

                      {isPendingGrade && (
                        <button
                          type="button"
                          onClick={() => setActiveExamToGrade({ student, assignment })}
                          className="px-3 py-1.5 bg-[#2D4A32] text-white hover:bg-[#1E3322] text-xs font-sans uppercase font-bold rounded cursor-pointer"
                        >
                          Проверить работу
                        </button>
                      )}

                      {assignment.assignmentType === 'morphology' && assignment.completed && (
                        <button
                          type="button"
                          onClick={() => setViewingMorphologyReport({ student, assignment })}
                          className="px-3 py-1.5 bg-[#FAF8F5] text-[#2C3E50] border border-[#2C3E50]/40 hover:bg-[#2C3E50] hover:text-white text-xs font-sans uppercase font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#D97706]" />
                          <span>Отчёт об ошибках</span>
                        </button>
                      )}

                      {onDeleteAssignment && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssignmentToDelete({
                              studentId: student.id,
                              studentName: student.name,
                              assignmentId: assignment.id,
                              title: assignment.title,
                            });
                          }}
                          className="p-1.5 text-[#8C7D6B] hover:text-[#9E3B3B] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E1DA] rounded transition-colors cursor-pointer"
                          title="Удалить это назначение"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs font-sans text-[#8C7D6B]">
                Пока не назначено ни одного задания. Нажмите «Назначить задание» сверху.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW TAB 3: GRADING QUEUE */}
      {activeViewTab === 'grading_queue' && (
        <div className="space-y-6">
          
          {/* Section 1: Submitted Exams Needing Manual Review (+ / +- / -) */}
          <div className="border border-[#E5E1DA] bg-white shadow-2xs">
            <div className="p-4 border-b border-[#E5E1DA] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-sans uppercase tracking-wider text-[#1A1A1A] font-bold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#9E3B3B]" />
                  Контрольные работы на ручную проверку ({pendingExams.length})
                </h3>
                <p className="text-xs font-sans text-[#6B655C]">
                  Студенты написали ответы на русском языке. Сверьте их с базой и поставьте баллы (+ / +- / -).
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#E5E1DA]">
              {pendingExams.length > 0 ? (
                pendingExams.map(({ student, assignment }) => (
                  <div key={assignment.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FAF8F5]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-sans font-bold text-[#1A1A1A]">
                          {student.name}
                        </span>
                        <span className="text-xs text-[#8C7D6B] font-serif">
                          ({student.greekAlias})
                        </span>
                        {student.email && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2C3E50] bg-[#FAF8F5] border border-[#E5E1DA] px-1.5 py-0.5 rounded">
                            <Mail className="w-2.5 h-2.5 text-[#8C7D6B]" />
                            <span>{student.email}</span>
                          </span>
                        )}
                        <span className="text-[10px] bg-[#FEF3C7] text-[#D97706] px-2 py-0.5 rounded font-bold uppercase font-sans">
                          ⏳ Ожидает проверки
                        </span>
                      </div>
                      <h4 className="text-sm font-serif font-bold text-[#1A1A1A]">
                        {assignment.title}
                      </h4>
                      <p className="text-xs font-sans text-[#6B655C]">
                        {assignment.assignmentType === 'manual_morphology'
                          ? `Морфологический разбор: ${(assignment.manualMorphologyAnswers || assignment.manualMorphologyWords || []).length} слов`
                          : assignment.assignmentType === 'greek_composition'
                          ? `Перевод на греческий: «${assignment.customPromptRu || ''}»`
                          : `Количество слов в контрольной: ${(assignment.examAnswers || []).length}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveExamToGrade({ student, assignment })}
                      className="px-4 py-2 bg-[#2D4A32] text-white hover:bg-[#1E3322] text-xs font-sans uppercase font-bold tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Открыть и проверить</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs font-sans text-[#2D4A32] bg-[#F4F9F5]">
                  ✓ Все сданные контрольные проверены!
                </div>
              )}
            </div>
          </div>

          {/* Section 2: General Practice Attempts */}
          <div className="border border-[#E5E1DA] bg-white shadow-2xs">
            <div className="p-4 border-b border-[#E5E1DA] bg-[#F9F7F2] flex items-center justify-between">
              <h3 className="text-sm font-sans uppercase tracking-wider text-[#1A1A1A] font-bold flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-[#8C7D6B]" />
                Попытки обычных тренировок Duolingo ({allAttempts.length})
              </h3>
            </div>

            <div className="divide-y divide-[#E5E1DA] max-h-96 overflow-y-auto">
              {allAttempts.map(({ student, attempt }) => (
                <div key={attempt.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs font-sans text-[#1A1A1A]">
                      {student.name}: {attempt.title}
                    </p>
                    <p className="text-[11px] font-sans text-[#8C7D6B]">
                      Дата: {attempt.date} • Результат: {attempt.scorePercent}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {attempt.teacherGrade !== undefined ? (
                      <span className="text-xs font-bold text-[#2D4A32] bg-[#C5D9C8] px-2 py-0.5 rounded font-sans">
                        {attempt.teacherGrade}%
                      </span>
                    ) : (
                      <span className="text-xs text-[#9E3B3B] bg-[#FADBD8] px-2 py-0.5 rounded font-sans">
                        Не оценено
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* MODAL: ASSIGN HOMEWORK / EXAM */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] max-w-xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl rounded-lg">
            <header className="border-b border-[#E5E1DA] pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-xl font-serif italic text-[#1A1A1A] font-bold">
                Назначить задание или контрольную
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-xs font-sans uppercase text-[#8C7D6B] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleCreateAssignmentSubmit} className="space-y-4 flex-1 min-h-0 flex flex-col overflow-y-auto text-xs font-sans pr-1">
              
              {/* 1. Target Students with Full Interactive Actual Student List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[#8C7D6B] uppercase tracking-wider font-bold text-[10px]">
                    Кому назначить (Актуальные ученики группы):
                  </label>
                  <span className="text-[11px] font-sans text-[#1A1A1A] font-semibold">
                    {assignTargetMode === 'all' 
                      ? `Всей группе (${students.length} чел.)` 
                      : `Выбрано: ${selectedStudentIds.length} из ${students.length} чел.`}
                  </span>
                </div>

                {/* Segmented Mode Picker */}
                <div className="grid grid-cols-2 gap-2 bg-[#FAF8F5] p-1 border border-[#E5E1DA] rounded">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignTargetMode('all');
                      setSelectedStudentIds(students.map((s) => s.id));
                    }}
                    className={`py-2 px-3 rounded text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      assignTargetMode === 'all'
                        ? 'bg-[#1A1A1A] text-white shadow-2xs'
                        : 'text-[#6B655C] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Всей группе ({students.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignTargetMode('selected');
                      if (selectedStudentIds.length === 0) {
                        setSelectedStudentIds(students.map((s) => s.id));
                      }
                    }}
                    className={`py-2 px-3 rounded text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      assignTargetMode === 'selected'
                        ? 'bg-[#1A1A1A] text-white shadow-2xs'
                        : 'text-[#6B655C] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Выборочно ({selectedStudentIds.length})</span>
                  </button>
                </div>

                {/* If Selected mode: full interactive list of students */}
                {assignTargetMode === 'selected' && (
                  <div className="p-3 bg-white border border-[#E5E1DA] rounded space-y-2.5">
                    {/* Quick Actions & Search */}
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8C7D6B]" />
                        <input
                          type="text"
                          value={studentSearchInModal}
                          onChange={(e) => setStudentSearchInModal(e.target.value)}
                          placeholder="Поиск по имени или псевдониму..."
                          className="w-full pl-8 pr-2.5 py-1.5 border border-[#E5E1DA] bg-white rounded text-xs text-[#1A1A1A] outline-none"
                        />
                      </div>

                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentIds(students.map((s) => s.id))}
                          className="px-2 py-1 bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded text-[10px] font-sans font-bold cursor-pointer"
                        >
                          Выбрать всех
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentIds([])}
                          className="px-2 py-1 bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded text-[10px] font-sans font-bold cursor-pointer text-[#9E3B3B]"
                        >
                          Снять выбор
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const lowAccuracy = students.filter((s) => s.accuracyRate < 80).map((s) => s.id);
                            setSelectedStudentIds(lowAccuracy.length > 0 ? lowAccuracy : students.map((s) => s.id));
                          }}
                          className="px-2 py-1 bg-[#FAF8F5] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded text-[10px] font-sans font-bold cursor-pointer text-[#7D5A00]"
                          title="Выбрать учеников с точностью менее 80%"
                        >
                          Точность &lt;80%
                        </button>
                      </div>
                    </div>

                    {/* Actual Student Cards List */}
                    <div className="max-h-48 overflow-y-auto divide-y divide-[#E5E1DA] border border-[#E5E1DA] rounded bg-[#FAF8F5]">
                      {students
                        .filter(
                          (s) =>
                            !studentSearchInModal ||
                            s.name.toLowerCase().includes(studentSearchInModal.toLowerCase()) ||
                            s.greekAlias.toLowerCase().includes(studentSearchInModal.toLowerCase()) ||
                            (s.email && s.email.toLowerCase().includes(studentSearchInModal.toLowerCase()))
                        )
                        .map((student) => {
                          const isChecked = selectedStudentIds.includes(student.id);
                          const pendingHwCount = (student.assignedHomework || []).filter(h => !h.completed).length;

                          return (
                            <div
                              key={student.id}
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedStudentIds(selectedStudentIds.filter((id) => id !== student.id));
                                } else {
                                  setSelectedStudentIds([...selectedStudentIds, student.id]);
                                }
                              }}
                              className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                isChecked ? 'bg-[#E2ECE3]' : 'hover:bg-white bg-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // handled by parent onClick
                                  className="accent-[#2D4A32] w-4 h-4 rounded cursor-pointer shrink-0"
                                />
                                <span className="text-base p-1 bg-white border border-[#E5E1DA] rounded shrink-0">
                                  {student.avatar}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-sans font-bold text-xs text-[#1A1A1A]">
                                      {student.name}
                                    </span>
                                    <span className="font-serif italic text-xs text-[#8C7D6B]">
                                      ({student.greekAlias})
                                    </span>
                                    {student.email && (
                                      <span className="text-[10px] font-mono text-[#8C7D6B] bg-white px-1 border border-[#E5E1DA] rounded truncate max-w-[150px]">
                                        {student.email}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#6B655C]">
                                    Точность: {student.accuracyRate}% • Слов: {student.masteredWordsCount} • Активных заданий: {pendingHwCount}
                                  </p>
                                </div>
                              </div>

                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans ${
                                isChecked ? 'bg-[#2D4A32] text-white' : 'bg-[#E5E1DA] text-[#6B655C]'
                              }`}>
                                {isChecked ? 'Выбран' : 'Не выбран'}
                              </span>
                            </div>
                          );
                        })}
                    </div>

                    {selectedStudentIds.length === 0 && (
                      <p className="text-[11px] text-[#9E3B3B] font-bold">
                        ⚠️ Выберите хотя бы одного ученика из списка для назначения.
                      </p>
                    )}
                  </div>
                )}

                {assignTargetMode === 'all' && (
                  <div className="p-3 bg-white border border-[#E5E1DA] rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#6B655C]">
                        Задание будет назначено всем актуальным студентам в группе:
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#2D4A32] bg-[#C5D9C8] px-2 py-0.5 rounded">
                        Все {students.length} уч.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {students.map((s) => (
                        <div key={s.id} className="flex items-center gap-1 bg-[#FAF8F5] border border-[#E5E1DA] px-2 py-1 rounded shrink-0">
                          <span className="text-xs">{s.avatar}</span>
                          <span className="text-[11px] font-bold text-[#1A1A1A]">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Assignment Type: Practice vs Exam vs Greek Composition vs Morphology vs Manual Morphology */}
              <div className="p-3 bg-white border border-[#E5E1DA] rounded space-y-2">
                <label className="block text-[#8C7D6B] uppercase tracking-wider font-bold text-[10px]">
                  Тип назначения:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAssignmentTypeChange('practice')}
                    className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                      assignmentType === 'practice'
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span className="block font-bold text-xs">⚡ Тренировка</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Обучение, подсказки, микс</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAssignmentTypeChange('exam')}
                    className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                      assignmentType === 'exam'
                        ? 'bg-[#9E3B3B] text-white border-[#9E3B3B] font-bold'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:border-[#1A1A1A]'
                    }`}
                  >
                    <span className="block font-bold text-xs">📝 Контрольная</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Случайные слова, проверка</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAssignmentTypeChange('manual_morphology')}
                    className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                      assignmentType === 'manual_morphology'
                        ? 'bg-[#4A3B32] text-white border-[#4A3B32] font-bold'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:border-[#4A3B32]'
                    }`}
                  >
                    <span className="block font-bold text-xs">🔍 Разбор слов</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Морфология 2–5 слов + ручн. проверка</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAssignmentTypeChange('greek_composition')}
                    className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                      assignmentType === 'greek_composition'
                        ? 'bg-[#2C3E50] text-white border-[#2C3E50] font-bold'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:border-[#2C3E50]'
                    }`}
                  >
                    <span className="block font-bold text-xs">✍️ Перевод</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">С русского на греческий</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleAssignmentTypeChange('morphology')}
                    className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                      assignmentType === 'morphology'
                        ? 'bg-[#D97706] text-white border-[#D97706] font-bold'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:border-[#D97706]'
                    }`}
                  >
                    <span className="block font-bold text-xs">🧩 Авто-пульт</span>
                    <span className="text-[10px] opacity-80 block mt-0.5">Морфо-тренажер НЗ</span>
                  </button>
                </div>
              </div>

              {/* 3a. Manual Morphology Configurator (Select from MORPHOLOGY_DATABASE or custom words, no context) */}
              {assignmentType === 'manual_morphology' && (
                <div className="p-4 bg-[#FDFCFA] border-2 border-[#8C7D6B]/40 rounded-lg space-y-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1DA] pb-2.5">
                    <div>
                      <h4 className="text-xs uppercase font-bold text-[#1A1A1A] tracking-wider flex items-center gap-1.5">
                        <span>🔍 Выбор слов для морфологического разбора (ручная проверка)</span>
                      </h4>
                      <p className="text-[11px] text-[#6B655C] mt-0.5">
                        Выберите слова из базы морфологического тренажера (от 1 до 5 слов). Студент определит словарную форму и грамматические категории (часть речи, время, залог, наклонение, падеж, род, число, лицо).
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold px-2.5 py-1 bg-[#FAF8F5] border border-[#E5E1DA] text-[#1A1A1A] rounded">
                        Выбрано: <strong>{manualMorphologyItems.length}</strong> / 5
                      </span>
                      {manualMorphologyItems.length < 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newId = `mm_custom_${Date.now()}`;
                            setManualMorphologyItems([
                              ...manualMorphologyItems,
                              {
                                id: newId,
                                greekWord: '',
                                teacherReferenceNotes: '',
                              },
                            ]);
                          }}
                          className="px-2.5 py-1 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] rounded text-[11px] font-sans font-bold cursor-pointer"
                        >
                          + Свое слово
                        </button>
                      )}
                    </div>
                  </div>

                                    {/* Quick Preset Packs */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#8C7D6B] uppercase tracking-wider">
                        Быстрые готовые наборы:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const pool = morphBankPos === 'all' ? MORPHOLOGY_DATABASE : MORPHOLOGY_DATABASE.filter((w) => w.pos === morphBankPos);
                            const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3);
                            const next = shuffled.map((w, idx) => ({
                              id: `mm_rand_${Date.now()}_${idx}`,
                              greekWord: w.form,
                              teacherReferenceNotes: `${w.lemma} — ${formatMorphologyGrammar(w)}`,
                            }));
                            setManualMorphologyItems(next);
                            setAssignTitle(`Морфологический разбор: ${next.map((w) => w.greekWord).join(', ')}`);
                          }}
                          className="px-2 py-0.5 bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#1A1A1A] border border-[#E5E1DA] rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          🎲 3 случайных
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const pool = morphBankPos === 'all' ? MORPHOLOGY_DATABASE : MORPHOLOGY_DATABASE.filter((w) => w.pos === morphBankPos);
                            const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5);
                            const next = shuffled.map((w, idx) => ({
                              id: `mm_rand_${Date.now()}_${idx}`,
                              greekWord: w.form,
                              teacherReferenceNotes: `${w.lemma} — ${formatMorphologyGrammar(w)}`,
                            }));
                            setManualMorphologyItems(next);
                            setAssignTitle(`Морфологический разбор: ${next.map((w) => w.greekWord).join(', ')}`);
                          }}
                          className="px-2 py-0.5 bg-[#FAF8F5] hover:bg-[#F3EFEA] text-[#1A1A1A] border border-[#E5E1DA] rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          🎲 5 случайных
                        </button>
                        {manualMorphologyItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setManualMorphologyItems([])}
                            className="px-2 py-0.5 bg-white text-[#9E3B3B] border border-[#FADBD8] hover:bg-[#FCF5F5] rounded text-[10px] font-bold cursor-pointer"
                          >
                            Очистить
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        {
                          name: 'Существительные (λόγος, θεόν, σάρξ)',
                          forms: ['λόγος', 'θεόν', 'σάρξ'],
                        },
                        {
                          name: 'Глаголы наст. вр. (λέγει, λύомен, ἐστίν)',
                          forms: ['λέγει', 'λύомен', 'ἐστίν'],
                        },
                        {
                          name: 'Аористы и супплетивы (ἦλθον, εἶδεν, ἐγένετο)',
                          forms: ['ἦлθον', 'εἶδεν', 'ἐγένето'],
                        },
                        {
                          name: 'Причастия (λύων, λέγοντες, εἰπών)',
                          forms: ['λύων', 'λέγοντες', 'εἰπών'],
                        },
                        {
                          name: 'Ин. 3:16 (ἠγάπησεν, ἔδωκεν, πιστεύων)',
                          forms: ['ἠγάπησεν', 'ἔδωкεν', 'πιστεύων'],
                        },
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            const foundWords = preset.forms.map((f, idx) => {
                              const match = MORPHOLOGY_DATABASE.find((w) => w.form.toLowerCase() === f.toLowerCase());
                              return {
                                id: `preset_${pIdx}_${idx}`,
                                greekWord: f,
                                teacherReferenceNotes: match ? `${match.lemma} — ${formatMorphologyGrammar(match)}` : f,
                              };
                            });
                            setManualMorphologyItems(foundWords);
                            setAssignTitle(`Морфологический разбор: ${preset.forms.join(', ')}`);
                          }}
                          className="px-2 py-1 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-[#FAF8F5] rounded text-[10px] text-[#1A1A1A] cursor-pointer transition-colors"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Word Bank Selector from MORPHOLOGY_DATABASE */}
                  <div className="p-3 bg-white border border-[#E5E1DA] rounded-lg space-y-2.5">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                        {[
                          { id: 'all', label: 'Все формы' },
                          { id: 'noun', label: 'Существительные' },
                          { id: 'verb', label: 'Глаголы' },
                          { id: 'participle', label: 'Причастия' },
                          { id: 'adjective', label: 'Прилагательные' },
                          { id: 'pronoun', label: 'Местоимения' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setMorphBankPos(tab.id as any)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                              morphBankPos === tab.id
                                ? 'bg-[#1A1A1A] text-white font-bold'
                                : 'bg-[#FAF8F5] text-[#6B655C] border border-[#E5E1DA] hover:bg-white'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative w-full sm:w-56">
                        <Search className="w-3.5 h-3.5 text-[#8C7D6B] absolute left-2 top-2" />
                        <input
                          type="text"
                          value={morphBankSearch}
                          onChange={(e) => setMorphBankSearch(e.target.value)}
                          placeholder="Поиск слова или перевода..."
                          className="w-full pl-7 pr-2 py-1 bg-[#FAF8F5] border border-[#E5E1DA] rounded text-xs text-[#1A1A1A] outline-none focus:border-[#1A1A1A] focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Scrollable list of words from MORPHOLOGY_DATABASE */}
                    {(() => {
                      const filteredBank = MORPHOLOGY_DATABASE.filter((w) => {
                        if (morphBankPos !== 'all' && w.pos !== morphBankPos) return false;
                        if (morphBankSearch.trim()) {
                          const q = morphBankSearch.toLowerCase().trim();
                          const matchForm = w.form.toLowerCase().includes(q);
                          const matchLemma = w.lemma.toLowerCase().includes(q);
                          const matchTrans = (w.translation || '').toLowerCase().includes(q);
                          return matchForm || matchLemma || matchTrans;
                        }
                        return true;
                      });

                      return (
                        <div className="max-h-56 overflow-y-auto border border-[#E5E1DA] rounded bg-[#FAF8F5] p-2 space-y-1">
                          {filteredBank.length === 0 ? (
                            <div className="p-4 text-center text-xs text-[#8C7D6B]">
                              Слова не найдены по запросу
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                              {filteredBank.map((word) => {
                                const isSelected = manualMorphologyItems.some(
                                  (item) => item.greekWord.toLowerCase() === word.form.toLowerCase()
                                );

                                return (
                                  <div
                                    key={word.id}
                                    onClick={() => {
                                      if (isSelected) {
                                        const next = manualMorphologyItems.filter(
                                          (item) => item.greekWord.toLowerCase() !== word.form.toLowerCase()
                                        );
                                        setManualMorphologyItems(next);
                                        if (next.length > 0) {
                                          setAssignTitle(`Морфологический разбор: ${next.map((w) => w.greekWord).join(', ')}`);
                                        }
                                      } else {
                                        if (manualMorphologyItems.length >= 5) return;
                                        const refNotes = `${word.lemma} — ${formatMorphologyGrammar(word)}`;
                                        const next = [
                                          ...manualMorphologyItems,
                                          {
                                            id: `mm_${word.id}`,
                                            greekWord: word.form,
                                            teacherReferenceNotes: refNotes,
                                          },
                                        ];
                                        setManualMorphologyItems(next);
                                        setAssignTitle(`Морфологический разбор: ${next.map((w) => w.greekWord).join(', ')}`);
                                      }
                                    }}
                                    className={`p-2 rounded border cursor-pointer transition-all flex flex-col justify-between gap-1 text-left ${
                                      isSelected
                                        ? 'bg-[#F2F7F3] border-[#2D4A32] shadow-2xs'
                                        : 'bg-white border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-[#FAF8F5]'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-serif font-bold text-base text-[#1A1A1A]">
                                        {word.form}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            speakErasmian(word.form);
                                          }}
                                          className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-white rounded"
                                          title="Озвучить"
                                        >
                                          <Volume2 className="w-3 h-3" />
                                        </button>
                                        <span
                                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            isSelected
                                              ? 'bg-[#2D4A32] text-white'
                                              : 'border border-[#E5E1DA] text-transparent'
                                          }`}
                                        >
                                          ✓
                                        </span>
                                      </div>
                                    </div>

                                    <div className="text-[11px] text-[#6B655C] truncate">
                                      {word.lemma} — <span className="italic">{word.translation}</span>
                                    </div>

                                    <div className="text-[10px] font-sans text-[#8C7D6B] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5E1DA] truncate">
                                      {formatMorphologyGrammar(word)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Selected Words Detail List (Editable Reference Notes, No Context) */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-[#8C7D6B] uppercase tracking-wider block">
                      Выбранные слова для задания ({manualMorphologyItems.length}):
                    </span>

                    {manualMorphologyItems.length === 0 ? (
                      <div className="p-4 bg-white border border-dashed border-[#E5E1DA] rounded text-center text-xs text-[#8C7D6B]">
                        Слова еще не выбраны. Нажмите на карточки слов выше или выберите готовый набор.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {manualMorphologyItems.map((item, index) => (
                          <div key={item.id || index} className="p-3 bg-white border border-[#E5E1DA] rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-[#8C7D6B]">
                                  #{index + 1}
                                </span>
                                <span className="font-serif font-bold text-lg text-[#1A1A1A]">
                                  {item.greekWord || <span className="text-[#9E3B3B] italic font-sans text-xs">(введите слово)</span>}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setManualMorphologyItems(manualMorphologyItems.filter((_, i) => i !== index));
                                }}
                                className="text-[#8C7D6B] hover:text-[#9E3B3B] text-xs font-bold cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#FAF8F5]"
                                title="Удалить слово"
                              >
                                ✕ Удалить
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-[#8C7D6B] mb-0.5">
                                  Греческая форма *:
                                </label>
                                <input
                                  type="text"
                                  value={item.greekWord}
                                  onChange={(e) => {
                                    const next = [...manualMorphologyItems];
                                    next[index].greekWord = e.target.value;
                                    setManualMorphologyItems(next);
                                  }}
                                  placeholder="Например: λόγος"
                                  className="w-full p-2 border border-[#E5E1DA] rounded text-sm font-serif text-[#1A1A1A] focus:ring-1 focus:ring-[#4A3B32] outline-none"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-[#8C7D6B] mb-0.5">
                                  Эталонный разбор (подсказка преподавателю):
                                </label>
                                <input
                                  type="text"
                                  value={item.teacherReferenceNotes}
                                  onChange={(e) => {
                                    const next = [...manualMorphologyItems];
                                    next[index].teacherReferenceNotes = e.target.value;
                                    setManualMorphologyItems(next);
                                  }}
                                  placeholder="Например: λόγος — Существительное, Муж. род, Им. пад., Ед. ч."
                                  className="w-full p-2 border border-[#E5E1DA] bg-[#FAF8F5] rounded text-xs font-sans text-[#1A1A1A] focus:ring-1 focus:ring-[#4A3B32] outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3b. Greek Composition Prompt Configurator (if Greek Composition Mode) */}
              {assignmentType === 'greek_composition' && (
                <div className="p-3.5 bg-[#F4F9F5] border-2 border-[#2D4A32]/30 rounded-lg space-y-3">
                  <div>
                    <label className="block text-[#2D4A32] uppercase tracking-wider mb-1 font-bold text-[10px]">
                      Фраза / Задание для студента («Напишите на греческом...»):
                    </label>
                    <textarea
                      value={compositionPromptRu}
                      onChange={(e) => {
                        setCompositionPromptRu(e.target.value);
                        setAssignTitle(`Перевод на греческий: ${e.target.value.slice(0, 30)}...`);
                      }}
                      rows={2}
                      placeholder="Например: В начале было Слово, и Слово было у Бога..."
                      className="w-full p-2.5 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded text-xs focus:ring-1 focus:ring-[#2D4A32] outline-none font-medium"
                    />
                    <p className="text-[10px] text-[#6B655C] mt-1">
                      Студент увидит эту фразу и встроенную греческую клавиатуру с диакритикой для ввода ответа.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1 font-bold text-[10px]">
                      Эталонный перевод на Койне (подсказка для проверки преподавателю):
                    </label>
                    <input
                      type="text"
                      value={compositionExpectedGreek}
                      onChange={(e) => setCompositionExpectedGreek(e.target.value)}
                      placeholder="Например: Ἐν ἀρχῇ ἦν ὁ λόγος..."
                      className="w-full p-2 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded text-xs font-serif text-sm focus:ring-1 focus:ring-[#2D4A32] outline-none"
                    />
                  </div>

                  {/* Fast presets helper */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-[#8C7D6B] block mb-1">
                      Быстрые примеры библейских фраз:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { ru: 'В начале было Слово', gr: 'Ἐν ἀρχῇ ἦν ὁ λόγος' },
                        { ru: 'Бог есть любовь', gr: 'Ὁ θεὸς ἀγάπη ἐστίν' },
                        { ru: 'Я есмь свет миру', gr: 'Ἐγώ εἰμι τὸ φῶς τοῦ κόσμου' },
                        { ru: 'Иисус Христос Сын Божий', gr: 'Ἰησοῦς Χριστὸς υἱὸς τοῦ θεοῦ' },
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setCompositionPromptRu(preset.ru);
                            setCompositionExpectedGreek(preset.gr);
                            setAssignTitle(`Перевод на греческий: ${preset.ru}`);
                          }}
                          className="px-2 py-1 bg-white border border-[#E5E1DA] hover:border-[#2D4A32] rounded text-[10px] text-[#1A1A1A] cursor-pointer"
                        >
                          {preset.ru}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Morphology Configurator */}
              {assignmentType === 'morphology' && (
                <div className="p-3.5 bg-[#FFFBEB] border-2 border-[#FDE68A]/60 rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-[#92400E] uppercase tracking-wider mb-1 font-bold text-[10px]">
                        Тип форм для разбора:
                      </label>
                      <select
                        value={morphologyTargetPos}
                        onChange={(e) => {
                          const v = e.target.value as 'all' | 'noun' | 'verb';
                          setMorphologyTargetPos(v);
                          setAssignTitle(`Морфология: ${v === 'all' ? 'Микс' : v === 'noun' ? 'Существительные' : 'Глаголы'}`);
                        }}
                        className="w-full p-2 border border-[#FDE68A] bg-white text-[#92400E] font-medium rounded text-xs focus:outline-none"
                      >
                        <option value="all">Микс (Существительные, Глаголы, Причастия)</option>
                        <option value="noun">Только Существительные (Падеж, Род, Число)</option>
                        <option value="verb">Только Глаголы (Время, Залог, Наклонение)</option>
                      </select>
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="block text-[#92400E] uppercase tracking-wider mb-1 font-bold text-[10px]">
                        Слов (шт.):
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={morphologyWordCount}
                        onChange={(e) => setMorphologyWordCount(Number(e.target.value))}
                        className="w-full p-2 border border-[#FDE68A] bg-white text-[#92400E] rounded font-bold text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-[#B45309] font-medium">
                    Ученику будет предложено {morphologyWordCount} случайных форм из Нового Завета. Для прохождения нужно правильно выбрать все теги формы на «Морфологическом пульте». Доступна система умных подсказок.
                  </p>
                </div>
              )}

              {/* 4. Course / Multi-Module Selector (for standard Practice & Exam) */}
              {assignmentType !== 'greek_composition' && assignmentType !== 'morphology' && assignmentType !== 'manual_morphology' && (() => {
                const selectedModulesList = getSelectedModulesInfo(selectedCourseIds);
                const currentCombinedWords = getWordsForSelectedModules(selectedModulesList, customLists);
                const totalWordsCount = currentCombinedWords.length;

                const filteredCourses = availableCourses.filter((course) => {
                  const matchesCategory =
                    moduleCategoryTab === 'all' || course.category === moduleCategoryTab;
                  const matchesSearch =
                    !moduleSearchQuery.trim() ||
                    course.title.toLowerCase().includes(moduleSearchQuery.toLowerCase());
                  return matchesCategory && matchesSearch;
                });

                return (
                  <div className="space-y-2.5 p-3.5 bg-[#FAF8F5] border border-[#E5E1DA] rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <label className="block text-[#1A1A1A] uppercase tracking-wider font-bold text-[11px] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#8C7D6B]" />
                        <span>Выберите модули слов (можно несколько):</span>
                      </label>
                      <span className="text-[11px] font-sans font-bold text-[#2D4A32] bg-[#E2ECE3] border border-[#C5D9C8] px-2 py-0.5 rounded">
                        ✓ Выбрано: {selectedCourseIds.length} мод. ({totalWordsCount} слов в пуле)
                      </span>
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-[#8C7D6B] tracking-wider">
                        Быстрый выбор диапазона глав:
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSelectPresetModules(['john_1', 'john_2', 'john_3'])}
                          className="px-2 py-1 bg-white hover:bg-[#F3EFEA] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          ⚡ Иоанна 1–3
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPresetModules(['john_1', 'john_2', 'john_3', 'john_4', 'john_5'])}
                          className="px-2 py-1 bg-white hover:bg-[#F3EFEA] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          ⚡ Иоанна 1–5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPresetModules(['john_1', 'john_2', 'john_3', 'john_4', 'john_5', 'john_6', 'john_7', 'john_8', 'john_9', 'john_10'])}
                          className="px-2 py-1 bg-white hover:bg-[#F3EFEA] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          ⚡ Иоанна 1–10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPresetModules(availableCourses.filter((c) => c.category === 'john_gospel').map((c) => c.id))}
                          className="px-2 py-1 bg-white hover:bg-[#F3EFEA] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          📖 Все 21 глава
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPresetModules(['freq_tier_1', 'freq_tier_2', 'freq_tier_3'])}
                          className="px-2 py-1 bg-white hover:bg-[#F3EFEA] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          🔥 Топ-3 частотных
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPresetModules(['john_1'])}
                          className="px-2 py-1 bg-white hover:bg-[#F3EFEA] text-[#8C7D6B] border border-[#E5E1DA] rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Сброс (1 глава)
                        </button>
                      </div>
                    </div>

                    {/* Category tabs & Search filter */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-[#E5E1DA]">
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                        <button
                          type="button"
                          onClick={() => setModuleCategoryTab('john_gospel')}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                            moduleCategoryTab === 'john_gospel'
                              ? 'bg-[#1A1A1A] text-white font-bold'
                              : 'bg-white text-[#6B655C] border border-[#E5E1DA] hover:bg-[#F9F7F2]'
                          }`}
                        >
                          Ев. от Иоанна (1–21)
                        </button>
                        <button
                          type="button"
                          onClick={() => setModuleCategoryTab('frequency')}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                            moduleCategoryTab === 'frequency'
                              ? 'bg-[#1A1A1A] text-white font-bold'
                              : 'bg-white text-[#6B655C] border border-[#E5E1DA] hover:bg-[#F9F7F2]'
                          }`}
                        >
                          Частотные
                        </button>
                        <button
                          type="button"
                          onClick={() => setModuleCategoryTab('thematic')}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                            moduleCategoryTab === 'thematic'
                              ? 'bg-[#1A1A1A] text-white font-bold'
                              : 'bg-white text-[#6B655C] border border-[#E5E1DA] hover:bg-[#F9F7F2]'
                          }`}
                        >
                          Тематические
                        </button>
                        {availableCourses.some((c) => c.category === 'custom_list') && (
                          <button
                            type="button"
                            onClick={() => setModuleCategoryTab('custom_list')}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                              moduleCategoryTab === 'custom_list'
                                ? 'bg-[#1A1A1A] text-white font-bold'
                                : 'bg-white text-[#6B655C] border border-[#E5E1DA] hover:bg-[#F9F7F2]'
                            }`}
                          >
                            Свои списки
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setModuleCategoryTab('all')}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                            moduleCategoryTab === 'all'
                              ? 'bg-[#1A1A1A] text-white font-bold'
                              : 'bg-white text-[#6B655C] border border-[#E5E1DA] hover:bg-[#F9F7F2]'
                          }`}
                        >
                          Все
                        </button>
                      </div>

                      <div className="relative w-full sm:w-48">
                        <Search className="w-3 h-3 absolute left-2 top-2 text-[#8C7D6B]" />
                        <input
                          type="text"
                          value={moduleSearchQuery}
                          onChange={(e) => setModuleSearchQuery(e.target.value)}
                          placeholder="Поиск модуля..."
                          className="w-full pl-7 pr-2 py-1 bg-white border border-[#E5E1DA] rounded text-xs text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                        />
                      </div>
                    </div>

                    {/* Modules Checklist */}
                    <div className="max-h-48 overflow-y-auto border border-[#E5E1DA] rounded bg-white divide-y divide-[#E5E1DA] p-1 space-y-0.5">
                      {filteredCourses.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#8C7D6B]">
                          Модули не найдены
                        </div>
                      ) : (
                        filteredCourses.map((course) => {
                          const isSelected = selectedCourseIds.includes(course.id);
                          return (
                            <div
                              key={course.id}
                              onClick={() => handleToggleModule(course.id)}
                              className={`p-2 flex items-center justify-between gap-2 rounded cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#F2F7F3] text-[#2D4A32] font-semibold'
                                  : 'hover:bg-[#FAF8F5] text-[#1A1A1A]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // handled by parent div onClick
                                  className="rounded border-[#E5E1DA] text-[#2D4A32] focus:ring-0 cursor-pointer pointer-events-none"
                                />
                                <span className="text-xs truncate">{course.title}</span>
                              </div>
                              <span className="text-[10px] font-sans px-1.5 py-0.5 bg-[#FAF8F5] border border-[#E5E1DA] rounded text-[#8C7D6B] shrink-0">
                                {course.wordCount} сл.
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Selected Modules Badges */}
                    {selectedCourseIds.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-[#8C7D6B] uppercase tracking-wider">
                          Включено:
                        </span>
                        {selectedModulesList.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 text-[11px] font-sans bg-white border border-[#E5E1DA] text-[#1A1A1A] px-2 py-0.5 rounded shadow-2xs"
                          >
                            <span>{m.title.split(':')[0]}</span>
                            {selectedCourseIds.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleModule(m.id);
                                }}
                                className="text-[#8C7D6B] hover:text-[#9E3B3B] font-bold cursor-pointer ml-0.5"
                                title="Убрать модуль"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 4. Exam Word Count (if Exam Mode) */}
              {assignmentType === 'exam' && (() => {
                const selectedModulesList = getSelectedModulesInfo(selectedCourseIds);
                const currentCombinedWords = getWordsForSelectedModules(selectedModulesList, customLists);
                const totalWordsCount = Math.max(1, currentCombinedWords.length);
                const maxAllowedWords = Math.min(100, totalWordsCount);

                return (
                  <div className="p-3.5 bg-[#FFFDF5] border border-[#FDE68A] rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-[#7D5A00] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Shuffle className="w-3.5 h-3.5 text-[#7D5A00]" />
                        <span>Количество случайных слов в контрольной:</span>
                      </label>
                      <span className="text-sm font-bold text-[#7D5A00] bg-white border border-[#FDE68A] px-2 py-0.5 rounded shadow-2xs">
                        {examWordCount} из {totalWordsCount} слов
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max={maxAllowedWords}
                        step="5"
                        value={Math.min(examWordCount, maxAllowedWords)}
                        onChange={(e) => setExamWordCount(Number(e.target.value))}
                        className="w-full cursor-pointer accent-[#7D5A00]"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#7D5A00] font-bold">Быстро:</span>
                      {[10, 20, 30, 50].filter((n) => n <= totalWordsCount).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setExamWordCount(num)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                            examWordCount === num
                              ? 'bg-[#7D5A00] text-white'
                              : 'bg-white text-[#7D5A00] border border-[#FDE68A] hover:bg-[#FEF3C7]'
                          }`}
                        >
                          {num} слов
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setExamWordCount(totalWordsCount)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                          examWordCount === totalWordsCount
                            ? 'bg-[#7D5A00] text-white'
                            : 'bg-white text-[#7D5A00] border border-[#FDE68A] hover:bg-[#FEF3C7]'
                        }`}
                      >
                        Все ({totalWordsCount})
                      </button>
                    </div>

                    <p className="text-[10px] text-[#7D5A00] leading-relaxed">
                      Студент получит <strong>{examWordCount}</strong> случайных слов, выбранных алгоритмом из пула в <strong>{totalWordsCount}</strong> слов ({selectedCourseIds.length} {selectedCourseIds.length === 1 ? 'модуль' : 'модуля'}), введет перевод вручную и сдаст работу вам на проверку.
                    </p>
                  </div>
                );
              })()}

              {/* 5. Title */}
              <div>
                <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1 font-bold text-[10px]">
                  Название для студента:
                </label>
                <input
                  type="text"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  className="w-full p-2.5 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded"
                  required
                />
              </div>

              {/* 6. Training Mode & Direction (Only if Practice) */}
              {assignmentType === 'practice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white border border-[#E5E1DA] rounded">
                  <div>
                    <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1 font-bold text-[10px]">
                      Режим тренировки:
                    </label>
                    <select
                      value={assignTrainingMode}
                      onChange={(e) => setAssignTrainingMode(e.target.value as TrainingMode)}
                      className="w-full p-2 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded"
                    >
                      <option value="all">⚡ Общий тренажер (все типы)</option>
                      <option value="flashcards">📇 Флеш-карточки</option>
                      <option value="builder">🧩 Конструктор фраз</option>
                      <option value="typing">✍️ Письмо</option>
                      <option value="quiz">🎯 Тест с выбором</option>
                      <option value="audio">🎧 Аудио-тренажер</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1 font-bold text-[10px]">
                      Направление перевода:
                    </label>
                    <select
                      value={assignTrainingDirection}
                      onChange={(e) => setAssignTrainingDirection(e.target.value as TrainingDirection)}
                      className="w-full p-2 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded"
                    >
                      <option value="bidirectional">🔄 Двусторонний</option>
                      <option value="greek_to_ru">🇬🇷 ➔ 🇷🇺 Греческий ➔ Русский</option>
                      <option value="ru_to_greek">🇷🇺 ➔ 🇬🇷 Русский ➔ Греческий</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 6b. Multi-round Spaced Repetition Configuration (Only if Practice) */}
              {assignmentType === 'practice' && (
                <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E1DA] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-[#1A1A1A] font-bold text-xs">
                        🔁 Количество кругов прохождения (порциями):
                      </label>
                      <p className="text-[10px] text-[#6B655C]">
                        Ученик проходит все порции темы {assignRounds} {assignRounds === 1 ? 'раз' : 'раза'} для надежного закрепления в долговременной памяти
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setAssignRounds(r)}
                          className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                            assignRounds === r
                              ? 'bg-[#1A1A1A] text-white shadow-xs'
                              : 'bg-white border border-[#E5E1DA] text-[#1A1A1A] hover:border-[#1A1A1A]'
                          }`}
                        >
                          {r} {r === 1 ? 'круг' : r === 2 ? 'круга' : 'круга'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {assignRounds > 1 && (
                    <div className="pt-2.5 border-t border-[#E5E1DA]/80 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <label className="text-[11px] font-bold text-[#8C7D6B] uppercase tracking-wider">
                          ⏳ Пауза отдыха между кругами (кривая забывания):
                        </label>
                        <select
                          value={assignCooldownHours}
                          onChange={(e) => setAssignCooldownHours(Number(e.target.value))}
                          className="p-1.5 border border-[#E5E1DA] bg-white rounded text-xs font-medium text-[#1A1A1A]"
                        >
                          <option value={0}>Без паузы (можно сразу)</option>
                          <option value={4}>4 часа (экспресс в тот же день)</option>
                          <option value={8}>8 часов (утром и вечером)</option>
                          <option value={12}>12 часов (полдня)</option>
                          <option value={24}>24 часа / 1 день (классический интервал)</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-[#2D4A32] bg-[#E2ECE3]/70 p-2 rounded border border-[#C5D9C8]">
                        🧠 <strong>Методический эффект:</strong> После завершения всех порций 1-го круга доступ к следующему кругу откроется через <strong>{assignCooldownHours === 0 ? '0' : `${assignCooldownHours} ч.`}</strong>, что активирует эффект консолидации памяти.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 7. Deadline */}
              <div className="space-y-1 max-w-sm">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[#8C7D6B] uppercase tracking-wider font-bold text-[10px]">
                      Дедлайн:
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-[#1A1A1A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isNoDeadline}
                        onChange={(e) => setIsNoDeadline(e.target.checked)}
                      />
                      <span>Без дедлайна</span>
                    </label>
                  </div>
                  {!isNoDeadline && (
                    <input
                      type="date"
                      value={assignDueDate}
                      onChange={(e) => setAssignDueDate(e.target.value)}
                      className="w-full p-2 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded"
                    />
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-[#E5E1DA] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E1DA] bg-white hover:border-[#1A1A1A] rounded cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={assignTargetMode === 'selected' && selectedStudentIds.length === 0}
                  className="px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] uppercase tracking-wider font-bold rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignmentType === 'exam' ? 'Назначить контрольную' : 'Назначить задание'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TEACHER EXAM GRADING (+ / +- / -) */}
      {activeExamToGrade && onGradeExam && (
        <TeacherExamGradingModal
          student={activeExamToGrade.student}
          assignment={activeExamToGrade.assignment}
          onSaveGrade={(studentId, assignmentId, updatedAnswers, scorePercent, status, feedback, updatedMorphologyAnswers) => {
            onGradeExam(studentId, assignmentId, updatedAnswers, scorePercent, status, feedback, updatedMorphologyAnswers);
            setActiveExamToGrade(null);
          }}
          onClose={() => setActiveExamToGrade(null)}
        />
      )}

      {/* MODAL: CREATE CUSTOM LIST */}
      {isCreateListModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] max-w-xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl rounded-lg">
            <header className="border-b border-[#E5E1DA] pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-xl font-serif italic text-[#1A1A1A] font-bold">
                Создать персональный набор слов
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateListModalOpen(false)}
                className="text-xs font-sans uppercase text-[#8C7D6B] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleCreateCustomListSubmit} className="space-y-4 flex-1 flex flex-col overflow-y-auto text-xs font-sans">
              <div>
                <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1 font-bold text-[10px]">
                  Название набора:
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Например: Слова для подготовки к сессии"
                  className="w-full p-2.5 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1 font-bold text-[10px]">
                  Описание:
                </label>
                <input
                  type="text"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="Краткое пояснение для студентов"
                  className="w-full p-2.5 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded"
                />
              </div>

              <div>
                <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1 font-bold text-[10px]">
                  Поиск и выбор слов ({selectedWordIds.length} выбрано):
                </label>
                <input
                  type="text"
                  value={searchWordQuery}
                  onChange={(e) => setSearchWordQuery(e.target.value)}
                  placeholder="Поиск по греческому или русскому переводу..."
                  className="w-full p-2 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded mb-2"
                />
                
                <div className="border border-[#E5E1DA] bg-white rounded max-h-48 overflow-y-auto divide-y divide-[#E5E1DA]">
                  {GREEK_VOCABULARY.filter((w) =>
                    !searchWordQuery ||
                    w.greek.includes(searchWordQuery) ||
                    w.translationRu.toLowerCase().includes(searchWordQuery.toLowerCase())
                  ).slice(0, 30).map((w) => {
                    const isSelected = selectedWordIds.includes(w.id);
                    return (
                      <div
                        key={w.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedWordIds(selectedWordIds.filter((id) => id !== w.id));
                          } else {
                            setSelectedWordIds([...selectedWordIds, w.id]);
                          }
                        }}
                        className={`p-2 flex items-center justify-between cursor-pointer ${
                          isSelected ? 'bg-[#E2ECE3]' : 'hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div>
                          <span className="font-serif font-bold text-sm text-[#1A1A1A] mr-2">
                            {w.greek}
                          </span>
                          <span className="text-[#6B655C]">
                            {w.translationRu}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="accent-[#2D4A32]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E1DA] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateListModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E1DA] bg-white hover:border-[#1A1A1A] rounded cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim() || selectedWordIds.length === 0}
                  className="px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] uppercase tracking-wider font-bold rounded cursor-pointer disabled:opacity-40"
                >
                  Создать набор
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT DEEP DIVE */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] max-w-3xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl rounded-lg overflow-y-auto">
            <header className="border-b border-[#E5E1DA] pb-4 mb-4 flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2 bg-white border border-[#E5E1DA] rounded shadow-2xs">
                  {selectedStudent.avatar}
                </span>
                <div>
                  <h3 className="text-2xl font-serif italic text-[#1A1A1A] font-bold">
                    {selectedStudent.name}{' '}
                    <span className="text-lg text-[#8C7D6B] not-italic">
                      ({selectedStudent.greekAlias})
                    </span>
                  </h3>
                  <p className="text-xs font-sans text-[#6B655C]">
                    Активность: {selectedStudent.lastActive} • {selectedStudent.streakDays} дней подряд
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="space-y-6 flex-1 text-xs font-sans">
              {/* Account / Google Email info for Administrator */}
              <div className="p-3 bg-white border border-[#E5E1DA] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#FAF8F5] border border-[#E5E1DA] rounded">
                    <Mail className="w-4 h-4 text-[#2C3E50]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">Google Email / Учетная запись:</span>
                    <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                      {selectedStudent.email || 'Не привязан (демо-ученик)'}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right text-[10px] text-[#6B655C]">
                  <span className="font-bold text-[#8C7D6B]">UID: </span>
                  <span className="font-mono text-[9px] text-[#1A1A1A]">{selectedStudent.id}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 border border-[#E5E1DA] bg-white rounded">
                  <span className="text-[10px] uppercase text-[#8C7D6B] block font-bold">Стрик</span>
                  <span className="text-xl font-serif text-[#1A1A1A] font-bold">{selectedStudent.streakDays || 1} дн.</span>
                </div>
                <div className="p-3 border border-[#E5E1DA] bg-white rounded">
                  <span className="text-[10px] uppercase text-[#8C7D6B] block font-bold">Точность</span>
                  <span className="text-xl font-serif text-[#2D4A32] font-bold">{selectedStudent.accuracyRate}%</span>
                </div>
                <div className="p-3 border border-[#E5E1DA] bg-white rounded">
                  <span className="text-[10px] uppercase text-[#8C7D6B] block font-bold">Слов в базе</span>
                  <span className="text-xl font-serif text-[#2C3E50] font-bold">{selectedStudent.masteredWordsCount}</span>
                </div>
              </div>

              {/* Student Assignments */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Задания студента ({(selectedStudent.assignedHomework || []).length}):
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = selectedStudent.id;
                      setSelectedStudent(null);
                      handleOpenAssignModal(targetId);
                    }}
                    className="px-3 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase font-bold tracking-wider rounded cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>+ Назначить этому ученику</span>
                  </button>
                </div>
                <div className="divide-y divide-[#E5E1DA] border border-[#E5E1DA] bg-white rounded max-h-56 overflow-y-auto">
                  {(selectedStudent.assignedHomework || []).map((hw) => (
                    <div key={hw.id} className="p-3 flex items-center justify-between gap-2 hover:bg-[#FAF8F5]">
                      <div className="min-w-0">
                        <p className="font-bold text-[#1A1A1A] text-xs truncate">{hw.title}</p>
                        <p className="text-[10px] text-[#8C7D6B]">
                          {hw.dueDate ? `Срок: ${hw.dueDate}` : 'Без дедлайна'} • {hw.assignmentType === 'exam' ? 'Контрольная' : hw.assignmentType === 'greek_composition' ? 'Перевод' : hw.assignmentType === 'morphology' ? 'Морфология' : 'Тренировка'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hw.teacherGrade !== undefined ? (
                          <span className="text-xs font-bold text-[#2D4A32] bg-[#C5D9C8] px-2 py-0.5 rounded">
                            Оценка: {hw.teacherGrade}%
                          </span>
                        ) : hw.assignmentType === 'morphology' && hw.completed ? (
                          <button
                            type="button"
                            onClick={() => setViewingMorphologyReport({ student: selectedStudent, assignment: hw })}
                            className="px-2 py-1 bg-[#FAF8F5] text-[#2C3E50] border border-[#2C3E50]/40 hover:bg-[#2C3E50] hover:text-white text-[10px] font-sans font-bold rounded cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-[#D97706]" />
                            <span>Отчёт</span>
                          </button>
                        ) : hw.completed ? (
                          <span className="text-xs text-[#2D4A32] bg-[#C5D9C8] px-2 py-0.5 rounded font-bold">
                            ✓ Выполнено
                          </span>
                        ) : (
                          <span className="text-xs text-[#8C7D6B] bg-[#FAF8F5] border border-[#E5E1DA] px-2 py-0.5 rounded">
                            В процессе
                          </span>
                        )}

                        {onDeleteAssignment && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignmentToDelete({
                                studentId: selectedStudent.id,
                                studentName: selectedStudent.name,
                                assignmentId: hw.id,
                                title: hw.title,
                              });
                            }}
                            className="p-1 text-[#8C7D6B] hover:text-[#9E3B3B] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E1DA] rounded transition-colors cursor-pointer"
                            title="Удалить это назначение"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Personal Note Form */}
              <div className="p-4 border border-[#E5E1DA] bg-[#F9F7F2] rounded space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Заметка преподавателя к профилю студента:
                </label>
                <textarea
                  value={teacherNoteText}
                  onChange={(e) => setTeacherNoteText(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-[#E5E1DA] bg-white text-[#1A1A1A] rounded outline-none"
                  placeholder="Напишите рекомендации, сильные стороны или темы для повторения..."
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="px-4 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] uppercase tracking-wider text-xs font-bold rounded cursor-pointer"
                  >
                    Сохранить заметку
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT DELETE CONFIRMATION MODAL */}
      {assignmentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E1DA] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-[#9E3B3B]">
              <div className="p-2 bg-[#FDF2F2] rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Удалить задание?</h3>
            </div>
            
            <p className="text-sm font-sans text-[#6B655C] leading-relaxed">
              Вы действительно хотите удалить задание <strong>«{assignmentToDelete.title}»</strong> для ученика <strong>{assignmentToDelete.studentName}</strong>?
            </p>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAssignmentToDelete(null)}
                className="px-4 py-2 border border-[#E5E1DA] rounded text-xs font-bold uppercase tracking-wider text-[#6B655C] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAssignment) {
                    onDeleteAssignment(assignmentToDelete.studentId, assignmentToDelete.assignmentId);
                    if (selectedStudent && selectedStudent.id === assignmentToDelete.studentId) {
                      setSelectedStudent({
                        ...selectedStudent,
                        assignedHomework: (selectedStudent.assignedHomework || []).filter((h) => h.id !== assignmentToDelete.assignmentId)
                      });
                    }
                  }
                  setAssignmentToDelete(null);
                }}
                className="px-4 py-2 bg-[#9E3B3B] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#7D2E2E] cursor-pointer shadow-sm"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DELETE CONFIRMATION MODAL */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E1DA] rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-[#9E3B3B]">
              <div className="p-2 bg-[#FDF2F2] rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Удалить ученика?</h3>
            </div>
            
            <p className="text-sm font-sans text-[#6B655C] leading-relaxed">
              Вы действительно хотите удалить ученика <strong>«{studentToDelete.name}»</strong> ({studentToDelete.greekAlias}) из списка?
            </p>
            <p className="text-xs font-sans text-[#8C7D6B] bg-[#FAF8F5] p-3 rounded border border-[#E5E1DA] leading-normal">
              💡 Если данный ученик снова зайдёт в свой аккаунт через приложение, его имя и профиль автоматически восстановятся в вашем журнале.
            </p>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 border border-[#E5E1DA] rounded text-xs font-bold uppercase tracking-wider text-[#6B655C] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudent) {
                    onDeleteStudent(studentToDelete.id);
                  }
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 bg-[#9E3B3B] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#7D2E2E] cursor-pointer shadow-sm"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MORPHOLOGY ERROR REPORT MODAL */}
      {viewingMorphologyReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E1DA] rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E1DA] bg-[#FAF8F5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
                    Отчёт по морфологическому разбору
                  </h3>
                  <p className="text-xs text-[#6B655C]">
                    Ученик: <strong className="text-[#1A1A1A]">{viewingMorphologyReport.student.name}</strong> ({viewingMorphologyReport.student.greekAlias})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingMorphologyReport(null)}
                className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] rounded cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans text-xs">
              {/* Assignment Overview Card */}
              <div className="p-4 bg-white border border-[#E5E1DA] rounded-xl space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E1DA] pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">Задание:</span>
                    <h4 className="text-sm font-serif font-bold text-[#1A1A1A]">
                      {viewingMorphologyReport.assignment.title}
                    </h4>
                  </div>
                  <span className="px-3 py-1 bg-[#C5D9C8] text-[#2D4A32] rounded font-bold text-xs self-start sm:self-auto">
                    Точность: {viewingMorphologyReport.assignment.scorePercent?.toFixed(0) || 0}%
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                  <div className="p-2.5 bg-[#FAF8F5] border border-[#E5E1DA] rounded-lg">
                    <span className="text-[10px] uppercase text-[#8C7D6B] block font-bold">Всего форм</span>
                    <span className="text-lg font-serif font-bold text-[#1A1A1A]">
                      {viewingMorphologyReport.assignment.morphologyTotalWords || viewingMorphologyReport.assignment.morphologyConfig?.wordCount || 10}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg">
                    <span className="text-[10px] uppercase text-[#166534] block font-bold">Без ошибок</span>
                    <span className="text-lg font-serif font-bold text-[#15803D]">
                      {viewingMorphologyReport.assignment.morphologyCorrectCount ?? Math.max(0, (viewingMorphologyReport.assignment.morphologyTotalWords || 10) - (viewingMorphologyReport.assignment.morphologyMistakesDetails?.length || 0))}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#FDF2F2] border border-[#FECACA] rounded-lg">
                    <span className="text-[10px] uppercase text-[#9E3B3B] block font-bold">С ошибками</span>
                    <span className="text-lg font-serif font-bold text-[#9E3B3B]">
                      {viewingMorphologyReport.assignment.morphologyMistakesDetails?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mistakes List */}
              {viewingMorphologyReport.assignment.morphologyMistakesDetails && viewingMorphologyReport.assignment.morphologyMistakesDetails.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#9E3B3B] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-[#9E3B3B]" />
                    <span>Детализация ошибок в формах ({viewingMorphologyReport.assignment.morphologyMistakesDetails.length}):</span>
                  </h4>
                  <div className="space-y-2.5">
                    {viewingMorphologyReport.assignment.morphologyMistakesDetails.map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-white border border-[#E5E1DA] rounded-xl space-y-2 shadow-2xs hover:border-[#D97706]/40 transition-colors">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-base text-[#1A1A1A]">{item.form}</span>
                            <span className="text-xs text-[#8C7D6B] font-serif">(словарная форма: {item.lemma})</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] px-2 py-0.5 rounded">
                            {item.pos}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B655C]">
                          Значение/Перевод: <strong className="text-[#1A1A1A]">{item.translation}</strong>
                        </p>
                        <div className="text-xs bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E5E1DA] text-[#2D4A32] flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#2D4A32] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">Правильный разбор:</span>
                            <span className="font-bold text-[#1A1A1A]">{item.grammarRu}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 bg-[#DCFCE7] text-[#15803D] rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-serif font-bold text-[#166534]">Безупречное выполнение!</h4>
                  <p className="text-xs text-[#166534]/80 max-w-md mx-auto">
                    Ученик правильно определил все морфологические параметры для всех затребованных слов без единой ошибки.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5E1DA] bg-[#FAF8F5] flex justify-end">
              <button
                type="button"
                onClick={() => setViewingMorphologyReport(null)}
                className="px-5 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] rounded text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Закрыть отчёт
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
