import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  MinusCircle, 
  Volume2, 
  X, 
  MessageSquare, 
  Award,
  Calendar,
  BookOpen,
  Check
} from 'lucide-react';
import { HomeworkAssignment } from '../types';
import { speakErasmian } from '../utils/audio';
import { MorphologyComparisonView } from './MorphologyComparisonView';

interface ExamReviewModalProps {
  assignment: HomeworkAssignment;
  onClose: () => void;
  onAcknowledge?: () => void;
}

export const ExamReviewModal: React.FC<ExamReviewModalProps> = ({
  assignment,
  onClose,
  onAcknowledge,
}) => {
  const handleClose = () => {
    if (onAcknowledge) {
      onAcknowledge();
    }
    onClose();
  };
  const isComposition = assignment.assignmentType === 'greek_composition';
  const isManualMorphology = assignment.assignmentType === 'manual_morphology';
  const answers = assignment.examAnswers || [];
  const morphAnswers = assignment.manualMorphologyAnswers || [];
  const scorePercent = assignment.teacherGrade ?? assignment.scorePercent ?? 0;
  const status = assignment.teacherGradeStatus || 'passed';

  const fullPoints = isManualMorphology
    ? morphAnswers.filter((a) => a.teacherMark === 'full').length
    : answers.filter((a) => a.teacherMark === 'full').length;
  const halfPoints = isManualMorphology
    ? morphAnswers.filter((a) => a.teacherMark === 'half').length
    : answers.filter((a) => a.teacherMark === 'half').length;
  const totalEarnedPoints = fullPoints + halfPoints * 0.5;
  const totalItemsCount = isManualMorphology ? morphAnswers.length : answers.length;

  const studentGreekText = assignment.studentCompositionAnswer || (answers[0]?.studentAnswer ?? '');

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl rounded-lg overflow-hidden">
        
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-[#E5E1DA] bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-white text-[10px] uppercase font-bold rounded tracking-wider font-sans ${
                isComposition ? 'bg-[#2C3E50]' : isManualMorphology ? 'bg-[#7D5A00]' : 'bg-[#2D4A32]'
              }`}>
                {isComposition
                  ? '✍️ Проверенный перевод'
                  : isManualMorphology
                  ? '🔍 Проверенный морфоразбор'
                  : 'Проверенная контрольная'}
              </span>
              {assignment.gradedDate && (
                <span className="text-xs font-sans text-[#8C7D6B] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Проверено: {assignment.gradedDate}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1A1A1A]">
              {assignment.title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#FAF8F5] border border-[#E5E1DA] px-3.5 py-1.5 rounded text-center">
              <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block font-sans">
                Результат
              </span>
              <span className="text-base font-serif font-bold text-[#1A1A1A]">
                {isComposition ? `${scorePercent}%` : `${totalEarnedPoints} / ${totalItemsCount} (${scorePercent}%)`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-[#8C7D6B] hover:text-[#1A1A1A] border border-[#E5E1DA] rounded hover:border-[#1A1A1A] cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Teacher Feedback Banner */}
        {assignment.teacherFeedback && (
          <div className="p-4 bg-[#F9F7F2] border-b border-[#E5E1DA] flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-[#8C7D6B] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs font-sans">
              <span className="font-bold text-[#1A1A1A] uppercase tracking-wider block text-[10px]">
                Отзыв преподавателя:
              </span>
              <p className="text-[#4A443D] leading-relaxed italic">
                "{assignment.teacherFeedback}"
              </p>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isComposition ? (
            /* Dedicated Greek Composition Result View */
            <div className="space-y-4">
              <div className="p-5 bg-white border border-[#E5E1DA] rounded-lg shadow-2xs space-y-4">
                {/* Prompt */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8C7D6B] tracking-wider block mb-1">
                    Задание преподавателя:
                  </span>
                  <p className="text-lg font-serif font-bold text-[#1A1A1A]">
                    {assignment.customPromptRu || assignment.title}
                  </p>
                </div>

                {/* Student Greek Answer */}
                <div className="p-4 bg-[#F4F9F5] border border-[#C5D9C8] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#2D4A32] tracking-wider">
                      Ваш текст на греческом (Койне):
                    </span>
                    {studentGreekText && (
                      <button
                        type="button"
                        onClick={() => speakErasmian(studentGreekText)}
                        className="px-2 py-1 bg-white border border-[#C5D9C8] hover:border-[#2D4A32] text-[#2D4A32] rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Прослушать произношение"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Озвучить</span>
                      </button>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-serif text-[#1A1A1A] leading-relaxed tracking-wide">
                    {studentGreekText || <span className="italic text-[#9E3B3B] text-base">(Текст не был введен)</span>}
                  </p>
                </div>

                {/* Reference Translation if provided */}
                {assignment.expectedGreekAnswer && (
                  <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E1DA] rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#6B655C] tracking-wider">
                        Эталонный перевод преподавателя:
                      </span>
                      <button
                        type="button"
                        onClick={() => speakErasmian(assignment.expectedGreekAnswer || '')}
                        className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] cursor-pointer"
                        title="Озвучить эталон"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-lg font-serif italic text-[#2C3E50]">
                      {assignment.expectedGreekAnswer}
                    </p>
                  </div>
                )}

                {/* Score badge summary */}
                <div className="pt-2 flex items-center justify-between border-t border-[#E5E1DA]">
                  <span className="text-xs text-[#6B655C]">
                    Итоговая оценка преподавателя:
                  </span>
                  <span className={`px-3 py-1.5 rounded text-xs font-bold font-sans flex items-center gap-1.5 ${
                    scorePercent >= 90
                      ? 'bg-[#2D4A32] text-white'
                      : scorePercent >= 60
                      ? 'bg-[#2C3E50] text-white'
                      : 'bg-[#9E3B3B] text-white'
                  }`}>
                    <Award className="w-3.5 h-3.5" />
                    <span>{scorePercent}% — {scorePercent >= 90 ? 'Отлично' : scorePercent >= 60 ? 'Зачтено' : 'На доработку'}</span>
                  </span>
                </div>
              </div>
            </div>
          ) : isManualMorphology ? (
            /* Manual Morphology Student Review */
            morphAnswers.map((ans, idx) => {
              const mark = ans.teacherMark || 'zero';
              const s = ans.studentSelection || (ans as any).selection || {
                lemma: (ans as any).lemma,
                commentaryRu: (ans as any).studentComment,
              };
              const refWord = (assignment.manualMorphologyWords || []).find((w) => w.id === ans.wordId || w.greekWord === ans.greekWord);

              return (
                <div 
                  key={ans.wordId || idx}
                  className={`p-4 rounded border transition-all space-y-3 ${
                    mark === 'full'
                      ? 'bg-[#F4F9F5] border-[#C5D9C8]'
                      : mark === 'half'
                      ? 'bg-[#FFFDF5] border-[#FDE68A]'
                      : 'bg-[#FCF5F5] border-[#FADBD8]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-[#8C7D6B] w-6">
                        #{idx + 1}
                      </span>
                      <span className="text-2xl font-serif font-bold text-[#1A1A1A]">
                        {ans.greekWord}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakErasmian(ans.greekWord)}
                        className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-white rounded cursor-pointer"
                        title="Озвучить"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Mark Badge */}
                    <div className="shrink-0 self-start sm:self-center">
                      {mark === 'full' && (
                        <span className="px-3 py-1.5 bg-[#2D4A32] text-white rounded text-xs font-sans font-bold flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>+1.0 балл (Верно)</span>
                        </span>
                      )}
                      {mark === 'half' && (
                        <span className="px-3 py-1.5 bg-[#D97706] text-white rounded text-xs font-sans font-bold flex items-center gap-1.5 shadow-2xs">
                          <MinusCircle className="w-3.5 h-3.5" />
                          <span>+0.5 балла (Неточность)</span>
                        </span>
                      )}
                      {mark === 'zero' && (
                        <span className="px-3 py-1.5 bg-[#9E3B3B] text-white rounded text-xs font-sans font-bold flex items-center gap-1.5 shadow-2xs">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>0 баллов (Неверно)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {refWord?.contextPhrase && (
                    <div className="text-xs font-serif italic text-[#6B655C] bg-white/60 p-2 rounded border border-[#E5E1DA]/50">
                      Контекст: «{refWord.contextPhrase}»
                    </div>
                  )}

                  {/* Morphology Comparison: Reference on top, Student directly underneath */}
                  <MorphologyComparisonView
                    greekWord={ans.greekWord}
                    wordId={ans.wordId}
                    studentSelection={s}
                    teacherReferenceNotes={refWord?.referenceNotes || ans.teacherReferenceNotes}
                    verseRef={refWord?.verseRef || ans.verseRef}
                    showCommentary={true}
                  />
                </div>
              );
            })
          ) : (
            /* Standard Per-Word Exam Answers List */
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Word & Comparison */}
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
                          className="p-1 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-white rounded cursor-pointer"
                          title="Озвучить"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans pt-1">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">
                            Ваш ответ:
                          </span>
                          <span className={`text-sm font-serif ${isStudentEmpty ? 'text-[#9E3B3B] italic' : 'text-[#1A1A1A] font-bold'}`}>
                            {isStudentEmpty ? '(Нет ответа)' : ans.studentAnswer}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">
                            Эталонный перевод:
                          </span>
                          <span className="text-sm font-serif text-[#2D4A32] italic">
                            {ans.correctAnswerRu}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mark Badge */}
                    <div className="shrink-0 self-end sm:self-center">
                      {mark === 'full' && (
                        <span className="px-3 py-1.5 bg-[#2D4A32] text-white rounded text-xs font-sans font-bold flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>+1.0 балл (Верно)</span>
                        </span>
                      )}
                      {mark === 'half' && (
                        <span className="px-3 py-1.5 bg-[#D97706] text-white rounded text-xs font-sans font-bold flex items-center gap-1.5 shadow-2xs">
                          <MinusCircle className="w-3.5 h-3.5" />
                          <span>+0.5 балла (Неточность)</span>
                        </span>
                      )}
                      {mark === 'zero' && (
                        <span className="px-3 py-1.5 bg-[#9E3B3B] text-white rounded text-xs font-sans font-bold flex items-center gap-1.5 shadow-2xs">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>0 баллов (Неверно)</span>
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 bg-white border-t border-[#E5E1DA] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#8C7D6B] font-sans text-center sm:text-left">
            После ознакомления задание перейдет в архив выполненных работ
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#2D4A32] text-white hover:bg-[#1E3322] rounded text-xs font-sans uppercase font-bold tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Ознакомлен(а) • Убрать с главного экрана</span>
          </button>
        </footer>

      </div>
    </div>
  );
};
