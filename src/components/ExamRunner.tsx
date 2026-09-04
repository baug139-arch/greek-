import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  Volume2, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  AlertCircle, 
  FileText, 
  HelpCircle,
  X,
  Award
} from 'lucide-react';
import { GreekWord, HomeworkAssignment, ExamAnswer } from '../types';
import { speakErasmian } from '../utils/audio';

interface ExamRunnerProps {
  assignment: HomeworkAssignment;
  words: GreekWord[];
  onComplete?: (assignmentId: string, answers: ExamAnswer[]) => void;
  onCompleteExam?: (assignmentId: string, answers: ExamAnswer[]) => void;
  onExit?: () => void;
  onClose?: () => void;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  assignment,
  words,
  onComplete,
  onCompleteExam,
  onExit,
  onClose,
}) => {
  const handleFinalComplete = onComplete || onCompleteExam || (() => {});
  const handleExitApp = onExit || onClose || (() => {});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentIndex];

  useEffect(() => {
    // Focus input on question change
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  if (!currentWord || words.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1A1A1A]/80 flex items-center justify-center p-4">
        <div className="bg-[#FAF8F5] border border-[#1A1A1A] p-6 max-w-md w-full text-center space-y-4">
          <p className="text-sm font-sans text-[#1A1A1A]">Нет доступных слов для этой контрольной работы.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1A1A1A] text-white text-xs uppercase font-sans tracking-wider"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (val: string) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [currentWord.id]: val,
    }));
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const answeredCount = Object.values(studentAnswers).filter((ans) => typeof ans === 'string' && ans.trim().length > 0).length;
  const progressPercent = Math.round(((currentIndex + 1) / words.length) * 100);

  const handleSubmitFinal = () => {
    const finalAnswers: ExamAnswer[] = words.map((w) => {
      const fullCorrectRu = [w.translationRu, ...(w.additionalMeaningsRu || [])].join(', ');
      return {
        wordId: w.id,
        wordGreek: w.greek,
        correctAnswerRu: fullCorrectRu,
        studentAnswer: (studentAnswers[w.id] || '').trim(),
      };
    });

    handleFinalComplete(assignment.id, finalAnswers);
    setIsSubmitModalOpen(false);
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1A1A1A]/85 flex items-center justify-center p-4">
        <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-[#2D4A32] text-white rounded-full flex items-center justify-center mx-auto text-2xl">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-sans uppercase tracking-widest text-[#8C7D6B] font-bold">
              Контрольная работа завершена
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif text-[#1A1A1A]">
              Работа отправлена преподавателю!
            </h3>
            <p className="text-xs font-sans text-[#6B655C] max-w-md mx-auto leading-relaxed">
              Вы ответили на {answeredCount} из {words.length} вопросов. Преподаватель проверит ваши переводы вручную, проставит баллы и оставит отзыв.
            </p>
          </div>

          <div className="bg-white border border-[#E5E1DA] p-4 rounded text-left space-y-2 text-xs font-sans">
            <div className="flex justify-between text-[#1A1A1A]">
              <span className="text-[#8C7D6B]">Задание:</span>
              <span className="font-bold">{assignment.title}</span>
            </div>
            <div className="flex justify-between text-[#1A1A1A]">
              <span className="text-[#8C7D6B]">Статус:</span>
              <span className="text-[#D97706] font-bold bg-[#FEF3C7] px-2 py-0.5 rounded text-[10px] uppercase">
                ⏳ Ожидает проверки
              </span>
            </div>
            <div className="flex justify-between text-[#1A1A1A]">
              <span className="text-[#8C7D6B]">Награда за выполнение:</span>
              <span className="font-bold text-[#2D4A32]">+{assignment.xpReward} XP</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExitApp}
            className="w-full py-3 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase tracking-widest transition-colors font-bold cursor-pointer"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Top Exam Header */}
        <header className="p-4 sm:p-5 border-b border-[#E5E1DA] bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#9E3B3B] text-white text-[10px] uppercase font-bold rounded tracking-wider">
                📝 Контрольная работа
              </span>
              <span className="text-xs font-sans text-[#8C7D6B]">
                Вопрос {currentIndex + 1} из {words.length}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-[#1A1A1A]">
              {assignment.title}
            </h3>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#8C7D6B] block font-sans">
                Заполнено
              </span>
              <span className="text-xs font-bold font-sans text-[#1A1A1A]">
                {answeredCount} / {words.length} слов
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 bg-[#2D4A32] text-white hover:bg-[#1E3322] text-xs font-sans uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 cursor-pointer rounded"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Сдать работу</span>
            </button>

            <button
              type="button"
              onClick={handleExitApp}
              className="p-2 text-[#8C7D6B] hover:text-[#1A1A1A] border border-[#E5E1DA] rounded hover:border-[#1A1A1A] cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="w-full bg-[#E5E1DA] h-1.5">
          <div 
            className="bg-[#2D4A32] h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Question Body */}
        <main className="p-3 sm:p-10 flex-1 overflow-y-auto flex flex-col justify-center items-center text-center space-y-3 sm:space-y-6">
          
          {/* Card containing Greek Word */}
          <div className="w-full max-w-xl bg-white border border-[#E5E1DA] p-3.5 sm:p-8 rounded-lg shadow-2xs space-y-2 sm:space-y-4">
            <div className="flex justify-between items-center text-xs font-sans text-[#8C7D6B]">
              <span className="uppercase tracking-widest text-[10px] font-bold">
                Греческое слово (#{currentIndex + 1})
              </span>
              {currentWord.partOfSpeech && (
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E5E1DA] text-[#6B655C] rounded text-[10px]">
                  {currentWord.partOfSpeech}
                </span>
              )}
            </div>

            {/* Display the Greek Word */}
            <div className="py-1 sm:py-2">
              <span className="text-3xl sm:text-5xl font-serif text-[#1A1A1A] tracking-wide block select-all">
                {currentWord.greek}
              </span>
              <span className="text-xs text-[#8C7D6B] font-sans mt-0.5 sm:mt-1 block italic">
                [{currentWord.transliterationRu}]
              </span>
            </div>

            {/* Audio Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => speakErasmian(currentWord.greek)}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#FAF8F5] hover:bg-[#E5E1DA] text-[#1A1A1A] border border-[#E5E1DA] text-xs font-sans rounded flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#8C7D6B]" />
                <span>Произношение</span>
              </button>
            </div>
          </div>

          {/* Answer Input Field */}
          <div className="w-full max-w-xl space-y-1 sm:space-y-2 text-left">
            <label className="block text-xs font-sans font-bold uppercase tracking-wider text-[#1A1A1A]">
              Ваш перевод на русский язык:
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={studentAnswers[currentWord.id] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишите перевод (например: слово, речь)..."
                className="w-full p-2.5 sm:p-3.5 text-sm sm:text-lg font-serif border-2 border-[#1A1A1A] rounded bg-white text-[#1A1A1A] focus:ring-2 focus:ring-[#2D4A32] focus:outline-none placeholder:text-[#A8A29E] placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm"
              />
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#8C7D6B] font-sans">
              Нажмите <kbd className="px-1.5 py-0.5 bg-[#E5E1DA] text-[#1A1A1A] rounded text-[10px] font-mono">Enter</kbd> для перехода к следующему слову.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="w-full max-w-xl flex justify-between items-center pt-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-[#E5E1DA] bg-white hover:border-[#1A1A1A] text-xs font-sans uppercase font-bold text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 rounded cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Назад</span>
            </button>

            <span className="text-xs text-[#8C7D6B] font-sans">
              {currentIndex + 1} / {words.length}
            </span>

            <button
              type="button"
              onClick={handleNext}
              className="px-4 sm:px-5 py-1.5 sm:py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase font-bold tracking-wider flex items-center gap-1.5 rounded cursor-pointer"
            >
              <span>{currentIndex === words.length - 1 ? 'Завершить' : 'Далее'}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </main>

        {/* Bottom Question Map Strip */}
        <footer className="p-3 bg-white border-t border-[#E5E1DA] flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] uppercase tracking-wider text-[#8C7D6B] font-sans font-bold shrink-0 mr-2">
            Вопросы:
          </span>
          <div className="flex gap-1.5 overflow-x-auto py-1">
            {words.map((w, idx) => {
              const hasAnswer = (studentAnswers[w.id] || '').trim().length > 0;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 shrink-0 text-xs font-sans font-bold rounded flex items-center justify-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#1A1A1A] text-white ring-2 ring-[#2D4A32]'
                      : hasAnswer
                      ? 'bg-[#E2ECE3] text-[#2D4A32] border border-[#B4D0B8]'
                      : 'bg-[#FAF8F5] text-[#8C7D6B] border border-[#E5E1DA] hover:border-[#1A1A1A]'
                  }`}
                  title={`Вопрос ${idx + 1}: ${w.greek}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </footer>

        {/* Confirmation Modal */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-60 bg-[#1A1A1A]/70 flex items-center justify-center p-4">
            <div className="bg-white border-2 border-[#1A1A1A] p-6 max-w-md w-full rounded-lg shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-[#D97706]">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h4 className="text-lg font-serif font-bold text-[#1A1A1A]">
                  Сдать контрольную работу?
                </h4>
              </div>

              <div className="space-y-2 text-xs font-sans text-[#6B655C]">
                <p>
                  Вы заполнили <strong>{answeredCount} из {words.length}</strong> вопросов.
                </p>
                {answeredCount < words.length && (
                  <p className="text-[#9E3B3B] font-medium bg-[#FDE8E8] p-2 rounded">
                    ⚠️ Внимание: у вас осталось {words.length - answeredCount} неотвеченных слов. Они будут сданы пустыми.
                  </p>
                )}
                <p>
                  После отправки ответы будут переданы преподавателю для ручной проверки и выставления оценки.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E1DA]">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E1DA] text-xs font-sans uppercase font-bold text-[#6B655C] hover:text-[#1A1A1A] rounded"
                >
                  Продолжить тест
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  className="px-5 py-2 bg-[#2D4A32] text-white hover:bg-[#1E3322] text-xs font-sans uppercase font-bold tracking-wider rounded"
                >
                  Сдать работу
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
