import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Volume2, 
  Send, 
  X, 
  Sparkles, 
  Award,
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Student, HomeworkAssignment, ExamAnswer, StudentManualMorphologyAnswer } from '../types';
import { speakErasmian } from '../utils/audio';
import { MorphologyComparisonView } from './MorphologyComparisonView';
import {
  POS_RU,
  TENSE_RU,
  VOICE_RU,
  MOOD_RU,
  CASE_RU,
  GENDER_RU,
  NUMBER_RU,
  PERSON_RU,
} from '../utils/morphologyFormat';

interface TeacherExamGradingModalProps {
  student: Student;
  assignment: HomeworkAssignment;
  onSaveGrade: (
    studentId: string,
    assignmentId: string,
    updatedAnswers: ExamAnswer[],
    scorePercent: number,
    status: 'passed' | 'revision' | 'excellent',
    feedback: string,
    updatedMorphologyAnswers?: StudentManualMorphologyAnswer[]
  ) => void;
  onClose: () => void;
}

export const TeacherExamGradingModal: React.FC<TeacherExamGradingModalProps> = ({
  student,
  assignment,
  onSaveGrade,
  onClose,
}) => {
  const isComposition = assignment.assignmentType === 'greek_composition';
  const isManualMorphology = assignment.assignmentType === 'manual_morphology';

  const [compositionGrade, setCompositionGrade] = useState<number>(() => {
    return assignment.teacherGrade !== undefined ? assignment.teacherGrade : 100;
  });

  const [morphAnswers, setMorphAnswers] = useState<StudentManualMorphologyAnswer[]>(() => {
    if (!isManualMorphology) return [];
    if (assignment.manualMorphologyAnswers && assignment.manualMorphologyAnswers.length > 0) {
      return assignment.manualMorphologyAnswers.map((ans) => ({
        ...ans,
        teacherMark: ans.teacherMark || 'full',
      }));
    }
    // Fallback if empty
    return (assignment.manualMorphologyWords || []).map((w) => ({
      wordId: w.id,
      greekWord: w.greekWord,
      verseRef: w.verseRef,
      contextPhrase: w.contextPhrase,
      teacherReferenceNotes: w.teacherReferenceNotes,
      studentSelection: {},
      teacherMark: 'full',
    }));
  });

  const [answers, setAnswers] = useState<ExamAnswer[]>(() => {
    if (isComposition) {
      return [
        {
          wordId: 'comp_1',
          wordGreek: assignment.studentCompositionAnswer || '(Ответ не введен)',
          correctAnswerRu: assignment.customPromptRu || assignment.title,
          studentAnswer: assignment.studentCompositionAnswer || '',
          teacherMark: assignment.teacherGradeStatus === 'passed' || assignment.teacherGradeStatus === 'excellent' ? 'full' : 'half',
          isComposition: true,
          promptRu: assignment.customPromptRu || assignment.title,
          expectedGreek: assignment.expectedGreekAnswer || '',
        }
      ];
    }

    if (isManualMorphology) {
      return [];
    }

    const initial = assignment.examAnswers || [];
    // If marks haven't been set yet, initialize smart auto-suggestions
    return initial.map((ans) => {
      if (ans.teacherMark) return ans;
      
      const cleanStudent = (ans.studentAnswer || '').toLowerCase().trim().replace(/ё/g, 'е');
      const cleanCorrect = (ans.correctAnswerRu || '').toLowerCase().trim().replace(/ё/g, 'е');
      
      if (!cleanStudent) {
        return { ...ans, teacherMark: 'zero' };
      }

      // Check if student answer is in the correct list
      const correctVariants = cleanCorrect.split(',').map((s) => s.trim());
      const isExactMatch = correctVariants.some((v) => v === cleanStudent || cleanStudent.includes(v) || v.includes(cleanStudent));

      return {
        ...ans,
        teacherMark: isExactMatch ? 'full' : 'zero',
      };
    });
  });

  const [feedback, setFeedback] = useState(
    assignment.teacherFeedback || 
    (isComposition 
      ? 'Греческий перевод проверен. Обратите внимание на правильность ударений и окончаний.' 
      : isManualMorphology
      ? 'Морфологический разбор проверен. Отличная работа с грамматическими формами!'
      : 'Работа проверена. Обратите внимание на отмеченные неточности в переводах.')
  );

  // Calculate current score
  const totalQuestions = isManualMorphology ? morphAnswers.length : answers.length;
  const currentPoints = isManualMorphology
    ? morphAnswers.reduce((sum, a) => {
        if (a.teacherMark === 'full') return sum + 1;
        if (a.teacherMark === 'half') return sum + 0.5;
        return sum;
      }, 0)
    : answers.reduce((sum, a) => {
        if (a.teacherMark === 'full') return sum + 1;
        if (a.teacherMark === 'half') return sum + 0.5;
        return sum;
      }, 0);

  const scorePercent = isComposition 
    ? compositionGrade 
    : (totalQuestions > 0 ? Math.round((currentPoints / totalQuestions) * 100) : 0);

  const gradeStatus: 'passed' | 'revision' | 'excellent' = 
    scorePercent >= 90 ? 'excellent' : scorePercent >= 65 ? 'passed' : 'revision';

  const handleSetMark = (index: number, mark: 'full' | 'half' | 'zero') => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], teacherMark: mark };
      return next;
    });
  };

  const handleSetMorphMark = (index: number, mark: 'full' | 'half' | 'zero') => {
    setMorphAnswers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], teacherMark: mark };
      return next;
    });
  };

  const handleSetAllFull = () => {
    if (isManualMorphology) {
      setMorphAnswers((prev) => prev.map((a) => ({ ...a, teacherMark: 'full' })));
    } else {
      setAnswers((prev) => prev.map((a) => ({ ...a, teacherMark: 'full' })));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGrade(
      student.id,
      assignment.id,
      answers,
      scorePercent,
      gradeStatus,
      feedback.trim(),
      isManualMorphology ? morphAnswers : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl rounded-lg overflow-hidden">
        
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-[#E5E1DA] bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-white text-[10px] uppercase font-bold rounded tracking-wider font-sans ${
                isComposition ? 'bg-[#2C3E50]' : isManualMorphology ? 'bg-[#7D5A00]' : 'bg-[#1A1A1A]'
              }`}>
                {isComposition
                  ? '✍️ Проверка греческого перевода'
                  : isManualMorphology
                  ? '🧩 Проверка морфологического анализа'
                  : 'Ручная проверка контрольной'}
              </span>
              <span className="text-xs font-sans text-[#8C7D6B]">
                {student.name} ({student.greekAlias})
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1A1A1A]">
              {assignment.title}
            </h3>
          </div>

          <div className="flex items-center gap-4">
            {/* Score pill */}
            <div className="bg-[#FAF8F5] border border-[#E5E1DA] px-3 py-1.5 rounded text-center">
              <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block font-sans">
                Итоговая оценка
              </span>
              <span className="text-base font-serif font-bold text-[#1A1A1A]">
                {isComposition ? `${scorePercent}%` : `${currentPoints} / ${totalQuestions} (${scorePercent}%)`}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#8C7D6B] hover:text-[#1A1A1A] border border-[#E5E1DA] rounded hover:border-[#1A1A1A] cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Quick Toolbar (for standard exams & manual morphology) */}
        {!isComposition && (
          <div className="p-3 bg-[#FAF8F5] border-b border-[#E5E1DA] flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
            <div className="flex items-center gap-2 text-[#6B655C]">
              <span>Обозначения:</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#2D4A32]">
                <span className="w-5 h-5 bg-[#C5D9C8] rounded flex items-center justify-center text-[10px]">+</span> = 1.0 балл
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#D97706]">
                <span className="w-5 h-5 bg-[#FEF3C7] rounded flex items-center justify-center text-[10px]">+-</span> = 0.5 балла
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#9E3B3B]">
                <span className="w-5 h-5 bg-[#FCDCDC] rounded flex items-center justify-center text-[10px]">-</span> = 0 баллов
              </span>
            </div>

            <button
              type="button"
              onClick={handleSetAllFull}
              className="px-2.5 py-1 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] rounded font-bold transition-all text-xs cursor-pointer shadow-2xs"
            >
              ✓ Поставить везде «+» (100%)
            </button>
          </div>
        )}

        {/* Answers List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3">
          {isComposition ? (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#E5E1DA] rounded-lg shadow-2xs space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block mb-1">
                    Исходная фраза / Задание преподавателя:
                  </span>
                  <p className="text-lg font-serif font-bold text-[#1A1A1A]">
                    {assignment.customPromptRu || assignment.title}
                  </p>
                </div>

                {assignment.expectedGreekAnswer && (
                  <div className="p-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#2D4A32] block">
                      Эталонный вариант перевода на Койне:
                    </span>
                    <p className="text-xl font-serif text-[#2D4A32]">
                      {assignment.expectedGreekAnswer}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-[#F4F9F5] border-2 border-[#2D4A32]/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#1A1A1A] tracking-wider">
                      Текст, набранный учеником на греческой клавиатуре:
                    </span>
                    {assignment.studentCompositionAnswer && (
                      <button
                        type="button"
                        onClick={() => speakErasmian(assignment.studentCompositionAnswer || '')}
                        className="text-xs text-[#2C3E50] hover:text-[#1A1A1A] flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Прослушать</span>
                      </button>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-serif text-[#1A1A1A] leading-relaxed select-text py-2">
                    {assignment.studentCompositionAnswer || <span className="text-[#9E3B3B] italic text-base">(Студент ничего не ввел)</span>}
                  </p>
                </div>

                {/* Score slider / buttons for composition */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#E5E1DA]">
                  <span className="text-xs font-bold text-[#1A1A1A]">
                    Оценка за точность (грамматика, окончания, диакритика):
                  </span>
                  <div className="flex items-center gap-2">
                    {[100, 90, 75, 50, 0].map((scoreVal) => (
                      <button
                        key={scoreVal}
                        type="button"
                        onClick={() => setCompositionGrade(scoreVal)}
                        className={`px-3 py-1.5 rounded text-xs font-sans font-bold cursor-pointer transition-all ${
                          compositionGrade === scoreVal
                            ? 'bg-[#2D4A32] text-white shadow-xs'
                            : 'bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A]'
                        }`}
                      >
                        {scoreVal}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : isManualMorphology ? (
            /* MANUAL MORPHOLOGY INSPECTION AND GRADING WITH VERTICALLY ALIGNED COMPARISON */
            morphAnswers.map((item, idx) => {
              const mark = item.teacherMark || 'zero';
              const sel = item.studentSelection || {};

              return (
                <div
                  key={item.wordId || idx}
                  className={`p-4 rounded-lg border transition-all space-y-3 ${
                    mark === 'full'
                      ? 'bg-[#F4F9F5] border-[#C5D9C8]'
                      : mark === 'half'
                      ? 'bg-[#FFFDF5] border-[#FDE68A]'
                      : 'bg-[#FCF5F5] border-[#FADBD8]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5E1DA] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-[#8C7D6B]">
                        #{idx + 1}
                      </span>
                      <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A]">
                        {item.greekWord}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakErasmian(item.greekWord)}
                        className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-white rounded cursor-pointer"
                        title="Озвучить"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      {item.verseRef && (
                        <span className="text-xs font-sans font-bold px-2 py-0.5 bg-white border border-[#E5E1DA] text-[#8C7D6B] rounded">
                          📖 {item.verseRef}
                        </span>
                      )}
                    </div>

                    {/* Grading Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleSetMorphMark(idx, 'full')}
                        className={`px-3 py-1.5 rounded text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          mark === 'full'
                            ? 'bg-[#2D4A32] text-white shadow-xs'
                            : 'bg-white text-[#2D4A32] border border-[#C5D9C8] hover:bg-[#E2ECE3]'
                        }`}
                        title="1.0 балл (Верно)"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>+ (1.0)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetMorphMark(idx, 'half')}
                        className={`px-3 py-1.5 rounded text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          mark === 'half'
                            ? 'bg-[#D97706] text-white shadow-xs'
                            : 'bg-white text-[#D97706] border border-[#FDE68A] hover:bg-[#FEF3C7]'
                        }`}
                        title="0.5 балла (Неточность)"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                        <span>+- (0.5)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetMorphMark(idx, 'zero')}
                        className={`px-3 py-1.5 rounded text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-all ${
                          mark === 'zero'
                            ? 'bg-[#9E3B3B] text-white shadow-xs'
                            : 'bg-white text-[#9E3B3B] border border-[#FADBD8] hover:bg-[#FADBD8]'
                        }`}
                        title="0 баллов (Неверно)"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>- (0.0)</span>
                      </button>
                    </div>
                  </div>

                  {item.contextPhrase && (
                    <div className="text-xs font-serif italic text-[#6B655C]">
                      Контекст: «{item.contextPhrase}»
                    </div>
                  )}

                  {/* Morphology Comparison: Reference on top, Student directly underneath */}
                  <MorphologyComparisonView
                    greekWord={item.greekWord}
                    wordId={item.wordId}
                    studentSelection={sel}
                    teacherReferenceNotes={item.teacherReferenceNotes}
                    verseRef={item.verseRef}
                    showCommentary={true}
                  />
                </div>
              );
            })
          ) : (
            answers.map((ans, idx) => {
            const mark = ans.teacherMark || 'zero';
            const isStudentEmpty = !ans.studentAnswer || ans.studentAnswer.trim().length === 0;

            return (
              <div 
                key={ans.wordId || idx}
                className={`p-4 rounded border transition-all ${
                  mark === 'full'
                    ? 'bg-[#F4F9F5] border-[#C5D9C8]'
                    : mark === 'half'
                    ? 'bg-[#FFFDF5] border-[#FDE68A]'
                    : 'bg-[#FCF5F5] border-[#FADBD8]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  
                  {/* Word and Translation Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-[#8C7D6B] w-6">
                        #{idx + 1}
                      </span>
                      <span className="text-2xl font-serif font-bold text-[#1A1A1A]">
                        {ans.wordGreek}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakErasmian(ans.wordGreek)}
                        className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-white rounded"
                        title="Озвучить"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">
                          Ответ студента:
                        </span>
                        <span className={`text-sm font-serif ${isStudentEmpty ? 'text-[#9E3B3B] italic' : 'text-[#1A1A1A] font-bold'}`}>
                          {isStudentEmpty ? '(Нет ответа / пропущено)' : ans.studentAnswer}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">
                          Правильный ответ (по словарю):
                        </span>
                        <span className="text-sm font-serif text-[#2D4A32] italic">
                          {ans.correctAnswerRu}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Grading Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    {/* + Full Mark (1.0) */}
                    <button
                      type="button"
                      onClick={() => handleSetMark(idx, 'full')}
                      className={`px-3 py-2 rounded text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        mark === 'full'
                          ? 'bg-[#2D4A32] text-white shadow-xs'
                          : 'bg-white text-[#2D4A32] border border-[#C5D9C8] hover:bg-[#E2ECE3]'
                      }`}
                      title="1.0 балл (Верно)"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>+ (1.0)</span>
                    </button>

                    {/* +- Half Mark (0.5) */}
                    <button
                      type="button"
                      onClick={() => handleSetMark(idx, 'half')}
                      className={`px-3 py-2 rounded text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        mark === 'half'
                          ? 'bg-[#D97706] text-white shadow-xs'
                          : 'bg-white text-[#D97706] border border-[#FDE68A] hover:bg-[#FEF3C7]'
                      }`}
                      title="0.5 балла (Половина балла / Неточность)"
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span>+- (0.5)</span>
                    </button>

                    {/* - Zero Mark (0.0) */}
                    <button
                      type="button"
                      onClick={() => handleSetMark(idx, 'zero')}
                      className={`px-3 py-2 rounded text-xs font-sans font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        mark === 'zero'
                          ? 'bg-[#9E3B3B] text-white shadow-xs'
                          : 'bg-white text-[#9E3B3B] border border-[#FADBD8] hover:bg-[#FADBD8]'
                      }`}
                      title="0 баллов (Неверно)"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>- (0.0)</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          }))}
        </div>

        {/* Footer & Feedback Form */}
        <footer className="p-4 sm:p-5 bg-white border-t border-[#E5E1DA] space-y-3">
          <div className="space-y-1 text-xs font-sans">
            <label className="block font-bold text-[#1A1A1A] uppercase tracking-wider">
              Комментарий и рекомендации преподавателя:
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              className="w-full p-2.5 border border-[#E5E1DA] rounded text-xs font-sans text-[#1A1A1A] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1A1A1A]"
              placeholder="Напишите замечания, похвалу или темы для повторения..."
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs font-sans text-[#6B655C] flex items-center gap-2">
              <span>Итоговая оценка: <strong>{scorePercent}%</strong></span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                gradeStatus === 'excellent' ? 'bg-[#C5D9C8] text-[#2D4A32]' :
                gradeStatus === 'passed' ? 'bg-[#E5E1DA] text-[#1A1A1A]' :
                'bg-[#FADBD8] text-[#9E3B3B]'
              }`}>
                {gradeStatus === 'excellent' ? '★ Отлично' : gradeStatus === 'passed' ? '✓ Зачтено' : '↻ На доработку'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E5E1DA] rounded text-xs font-sans uppercase font-bold text-[#6B655C] hover:text-[#1A1A1A]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2 bg-[#2D4A32] text-white hover:bg-[#1E3322] rounded text-xs font-sans uppercase font-bold tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Выставить оценку</span>
              </button>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

