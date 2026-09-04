import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Keyboard, 
  CheckCircle2, 
  Volume2, 
  HelpCircle, 
  RotateCcw,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { HomeworkAssignment } from '../types';
import { GreekKeyboard } from './GreekKeyboard';
import { speakErasmian } from '../utils/audio';

interface GreekCompositionRunnerProps {
  assignment: HomeworkAssignment;
  onComplete: (assignmentId: string, studentGreekAnswer: string) => void;
  onExit?: () => void;
  onClose?: () => void;
}

export const GreekCompositionRunner: React.FC<GreekCompositionRunnerProps> = ({
  assignment,
  onComplete,
  onExit,
  onClose,
}) => {
  const handleExit = onExit || onClose || (() => {});
  const [typedGreek, setTypedGreek] = useState(assignment.studentCompositionAnswer || '');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleInsertChar = (char: string) => {
    if (!textareaRef.current) {
      setTypedGreek((prev) => prev + char);
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    const nextVal = typedGreek.substring(0, start) + char + typedGreek.substring(end);
    setTypedGreek(nextVal);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + char.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleDeleteChar = () => {
    if (!textareaRef.current) {
      setTypedGreek((prev) => prev.slice(0, -1));
      return;
    }
    const start = textareaRef.current.selectionStart || 0;
    const end = textareaRef.current.selectionEnd || 0;
    if (start === end && start > 0) {
      const nextVal = typedGreek.substring(0, start - 1) + typedGreek.substring(end);
      setTypedGreek(nextVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start - 1;
          textareaRef.current.focus();
        }
      }, 0);
    } else if (start !== end) {
      const nextVal = typedGreek.substring(0, start) + typedGreek.substring(end);
      setTypedGreek(nextVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleClearAll = () => {
    setTypedGreek('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedGreek.trim()) return;
    onComplete(assignment.id, typedGreek.trim());
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1A1A1A]/85 flex items-center justify-center p-4">
        <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] p-8 max-w-lg w-full text-center space-y-6 shadow-2xl rounded-lg">
          <div className="w-16 h-16 bg-[#2D4A32] text-white rounded-full flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-[#1A1A1A]">
              Задание отправлено преподавателю!
            </h3>
            <p className="text-sm font-sans text-[#6B655C]">
              Ваш греческий перевод получен и отправлен на ручную проверку. Преподаватель оценит точность грамматики, ударения и диакритики.
            </p>
          </div>

          <div className="p-4 bg-white border border-[#E5E1DA] rounded text-left space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">
              Ваш ответ на греческом:
            </span>
            <p className="text-lg font-serif text-[#1A1A1A] leading-relaxed select-text">
              {typedGreek}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="w-full py-3 bg-[#1A1A1A] hover:bg-[#2C3E50] text-white text-xs uppercase font-sans tracking-widest font-bold rounded cursor-pointer transition-colors shadow-2xs"
          >
            Вернуться к занятиям
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 pt-[max(env(safe-area-inset-top),0.5rem)] pb-[max(env(safe-area-inset-bottom),0.5rem)] font-sans">
      <div 
        id="greek-composition-modal"
        className="bg-[#FAF8F5] border-2 border-[#1A1A1A] max-w-3xl w-full h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl rounded-lg overflow-hidden"
      >
        {/* Header (Pinned) */}
        <header className="p-3.5 sm:p-4 border-b border-[#E5E1DA] bg-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 sm:p-2 bg-[#FAF8F5] border border-[#E5E1DA] rounded text-lg sm:text-xl">
              ✍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans uppercase font-bold px-2 py-0.5 rounded bg-[#2C3E50] text-white tracking-wider">
                  Письменное задание
                </span>
                <span className="text-xs text-[#8C7D6B] font-serif italic hidden sm:inline">
                  Перевод на Койне
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#1A1A1A] line-clamp-1">
                {assignment.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="p-1.5 text-[#8C7D6B] hover:text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#1A1A1A] rounded cursor-pointer transition-colors shrink-0"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto min-h-0 flex-1 space-y-4">
          {/* Teacher's Prompt Card */}
          <div className="p-4 sm:p-5 bg-white border border-[#E5E1DA] rounded-lg shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#8C7D6B] tracking-wider">
                Задание от преподавателя:
              </span>
            </div>
            
            <p className="text-base sm:text-xl font-serif text-[#1A1A1A] font-semibold leading-relaxed">
              {assignment.customPromptRu || assignment.title}
            </p>
            <p className="text-xs text-[#6B655C]">
              Напишите точный перевод этой фразы на библейском греческом языке, используя клавиатуру ниже.
            </p>
          </div>

          {/* Student Greek Text Input Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <span>Ваш текст на греческом (Койне):</span>
              </label>
              <div className="flex items-center gap-2">
                {typedGreek && (
                  <button
                    type="button"
                    onClick={() => speakErasmian(typedGreek)}
                    className="text-xs text-[#2C3E50] hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer font-medium"
                    title="Прослушать произношение введенного текста"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Озвучить</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
                  className="text-xs text-[#8C7D6B] hover:text-[#1A1A1A] flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>{isKeyboardOpen ? 'Скрыть клавиатуру' : 'Показать клавиатуру'}</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={typedGreek}
                onChange={(e) => setTypedGreek(e.target.value)}
                placeholder="Вводите греческие буквы и диакритику с клавиатуры ниже (например: Ἐν ἀρχῇ ἦν ὁ λόγος)..."
                rows={3}
                className="w-full min-h-[90px] sm:min-h-[110px] p-3 sm:p-4 text-xl sm:text-2xl font-serif text-[#1A1A1A] bg-white border-2 border-[#1A1A1A] rounded-lg outline-none focus:ring-2 focus:ring-[#2C3E50] leading-relaxed resize-y"
              />
            </div>
          </div>

          {/* Embedded Greek Keyboard */}
          {isKeyboardOpen && (
            <div className="rounded-lg overflow-hidden border border-[#E5E1DA] shadow-xs">
              <GreekKeyboard
                onInsert={handleInsertChar}
                onInsertChar={handleInsertChar}
                onDelete={handleDeleteChar}
                onBackspace={handleDeleteChar}
                onClear={handleClearAll}
              />
            </div>
          )}
        </div>

        {/* Submit Footer (Pinned at bottom) */}
        <footer className="p-3.5 sm:px-6 sm:py-3.5 border-t border-[#E5E1DA] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#6B655C] text-center sm:text-left">
            После отправки преподаватель проверит ваш перевод и выставит оценку в журнал.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleExit}
              className="flex-1 sm:flex-none px-4 py-2 border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs uppercase font-bold tracking-wider rounded cursor-pointer transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!typedGreek.trim()}
              className="flex-1 sm:flex-none px-6 py-2 bg-[#2D4A32] hover:bg-[#1E3322] disabled:opacity-40 text-white text-xs uppercase font-bold tracking-wider rounded cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Сдать работу</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
