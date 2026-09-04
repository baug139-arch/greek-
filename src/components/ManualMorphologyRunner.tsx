import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Volume2, 
  HelpCircle, 
  RotateCcw,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Info,
  Check
} from 'lucide-react';
import { 
  HomeworkAssignment, 
  ManualMorphologyWordItem, 
  StudentManualMorphologyAnswer, 
  StudentMorphologyFormSelection 
} from '../types';
import { GreekKeyboard } from './GreekKeyboard';
import { speakErasmian } from '../utils/audio';

interface ManualMorphologyRunnerProps {
  assignment: HomeworkAssignment;
  onComplete: (assignmentId: string, answers: StudentManualMorphologyAnswer[]) => void;
  onExit: () => void;
}

const PARTS_OF_SPEECH = [
  { id: 'verb', label: 'Глагол' },
  { id: 'noun', label: 'Существительное' },
  { id: 'adjective', label: 'Прилагательное' },
  { id: 'participle', label: 'Причастие' },
  { id: 'pronoun', label: 'Местоимение' },
  { id: 'other', label: 'Другое' },
] as const;

const TENSES = [
  { id: 'pres', label: 'Настоящее (Презенс)' },
  { id: 'impf', label: 'Имперфект' },
  { id: 'fut', label: 'Будущее (Футурум)' },
  { id: 'aor', label: 'Аорист' },
  { id: 'perf', label: 'Перфект' },
  { id: 'plup', label: 'Плюсквамперфект' },
] as const;

const VOICES = [
  { id: 'act', label: 'Действительный (Активный)' },
  { id: 'mid', label: 'Медиальный (Средний)' },
  { id: 'pass', label: 'Страдательный (Пассивный)' },
  { id: 'midpass', label: 'Медиально-пассивный' },
] as const;

const MOODS = [
  { id: 'ind', label: 'Изъявительное (Индикатив)' },
  { id: 'subj', label: 'Сослагательное (Конъюнктив)' },
  { id: 'opt', label: 'Желательное (Оптатив)' },
  { id: 'impv', label: 'Повелительное (Императив)' },
  { id: 'inf', label: 'Инфинитив' },
  { id: 'ptcp', label: 'Причастие' },
] as const;

const PERSONS = [
  { id: '1', label: '1-е лицо' },
  { id: '2', label: '2-е лицо' },
  { id: '3', label: '3-е лицо' },
] as const;

const NUMBERS = [
  { id: 'sg', label: 'Единственное число' },
  { id: 'pl', label: 'Множественное число' },
] as const;

const CASES = [
  { id: 'nom', label: 'Именительный' },
  { id: 'gen', label: 'Родительный' },
  { id: 'dat', label: 'Дательный' },
  { id: 'acc', label: 'Винительный' },
  { id: 'voc', label: 'Звательный' },
] as const;

const GENDERS = [
  { id: 'masc', label: 'Мужской род' },
  { id: 'fem', label: 'Женский род' },
  { id: 'neut', label: 'Средний род' },
] as const;

export const ManualMorphologyRunner: React.FC<ManualMorphologyRunnerProps> = ({
  assignment,
  onComplete,
  onExit,
}) => {
  const words: ManualMorphologyWordItem[] = assignment.manualMorphologyWords && assignment.manualMorphologyWords.length > 0
    ? assignment.manualMorphologyWords
    : [
        {
          id: 'word_1',
          greekWord: assignment.title.replace('Морфологический анализ: ', ''),
          contextPhrase: assignment.customPromptRu,
        }
      ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentMorphologyFormSelection>>(() => {
    const initial: Record<string, StudentMorphologyFormSelection> = {};
    if (assignment.manualMorphologyAnswers) {
      assignment.manualMorphologyAnswers.forEach((ans) => {
        initial[ans.wordId] = ans.studentSelection || {};
      });
    }
    return initial;
  });

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentWord = words[currentIndex] || words[0];
  const currentSelection = answers[currentWord.id] || {};

  const updateSelection = (field: keyof StudentMorphologyFormSelection, val: any) => {
    setAnswers((prev) => {
      const existing = prev[currentWord.id] || {};
      const updated = { ...existing, [field]: existing[field] === val ? undefined : val };
      return {
        ...prev,
        [currentWord.id]: updated,
      };
    });
  };

  const updateCommentary = (text: string) => {
    setAnswers((prev) => {
      const existing = prev[currentWord.id] || {};
      return {
        ...prev,
        [currentWord.id]: { ...existing, commentaryRu: text },
      };
    });
  };

  const updateLemma = (text: string) => {
    setAnswers((prev) => {
      const existing = prev[currentWord.id] || {};
      return {
        ...prev,
        [currentWord.id]: { ...existing, lemma: text },
      };
    });
  };

  const isCurrentComplete = () => {
    const s = currentSelection;
    if (!s.partOfSpeech) return false;
    if (s.partOfSpeech === 'verb') {
      return !!(s.tense && s.voice && s.mood);
    }
    if (s.partOfSpeech === 'noun' || s.partOfSpeech === 'adjective' || s.partOfSpeech === 'pronoun') {
      return !!(s.case && s.number);
    }
    if (s.partOfSpeech === 'participle') {
      return !!(s.tense && s.voice && s.case && s.number && s.gender);
    }
    return true;
  };

  const completedCount = words.filter((w) => {
    const s = answers[w.id];
    return s && s.partOfSpeech;
  }).length;

  const handleSubmitAll = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedAnswers: StudentManualMorphologyAnswer[] = words.map((w) => ({
      wordId: w.id,
      greekWord: w.greekWord,
      verseRef: w.verseRef,
      contextPhrase: w.contextPhrase,
      teacherReferenceNotes: w.teacherReferenceNotes,
      studentSelection: answers[w.id] || {},
    }));

    onComplete(assignment.id, formattedAnswers);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white border border-[#E5E1DA] rounded-xl max-w-md w-full p-6 text-center space-y-4 shadow-xl animate-fade-in">
          <div className="w-16 h-16 bg-[#E2ECE3] text-[#2D4A32] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">
            Разбор отправлен на проверку!
          </h3>
          <p className="text-sm font-sans text-[#6B655C] leading-relaxed">
            Вы разобрали {words.length} {words.length === 1 ? 'слово' : 'слов'}. Преподаватель проверит грамматические признаки и выставит оценку с комментариями.
          </p>
          <button
            onClick={onExit}
            className="w-full py-3 bg-[#1A1A1A] hover:bg-[#2C3E50] text-white font-sans font-bold text-sm rounded-lg transition-colors cursor-pointer"
          >
            Вернуться в кабинет
          </button>
        </div>
      </div>
    );
  }

  const pos = currentSelection.partOfSpeech;
  const isVerb = pos === 'verb';
  const isNounOrAdj = pos === 'noun' || pos === 'adjective' || pos === 'pronoun';
  const isParticiple = pos === 'participle';
  const isInf = isVerb && currentSelection.mood === 'inf';

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F1EA] flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-[#E5E1DA] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 text-[#6B655C] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
            title="Выйти"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#8C7D6B] block">
              Морфологический анализ • Задание
            </span>
            <h1 className="text-sm sm:text-base font-serif font-bold text-[#1A1A1A] truncate max-w-xs sm:max-w-md">
              {assignment.title}
            </h1>
          </div>
        </div>

        {/* Progress & Pagination */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-sans text-[#6B655C]">
            <span>Заполнено:</span>
            <span className="font-bold text-[#2D4A32] bg-[#E2ECE3] px-2 py-0.5 rounded">
              {completedCount} из {words.length}
            </span>
          </div>

          <button
            onClick={handleSubmitAll}
            className="px-4 py-2 bg-[#2D4A32] hover:bg-[#1E3322] text-white rounded-lg font-sans font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Сдать работу</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-4">
        
        {/* Words Tabs (if multi-word) */}
        {words.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {words.map((w, idx) => {
              const isFilled = !!answers[w.id]?.partOfSpeech;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={w.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-3 py-2 rounded-lg text-xs font-sans font-bold flex items-center gap-2 border transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                      : isFilled
                      ? 'bg-[#E2ECE3] text-[#2D4A32] border-[#C5D9C8]'
                      : 'bg-white text-[#6B655C] border-[#E5E1DA] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-serif text-sm">{w.greekWord}</span>
                  {isFilled && <Check className="w-3 h-3 text-[#2D4A32]" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Word Card & Context */}
        <div className="bg-white border border-[#E5E1DA] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E1DA] pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1A1A] tracking-wide">
                {currentWord.greekWord}
              </span>
              <button
                type="button"
                onClick={() => speakErasmian(currentWord.greekWord)}
                className="p-2 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] rounded-full transition-colors cursor-pointer"
                title="Озвучить"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {currentWord.verseRef && (
              <span className="text-xs font-sans font-bold px-2.5 py-1 bg-[#FAF8F5] border border-[#E5E1DA] text-[#8C7D6B] rounded-md self-start sm:self-auto">
                📖 {currentWord.verseRef}
              </span>
            )}
          </div>

          {currentWord.contextPhrase && (
            <div className="p-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded-lg">
              <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block mb-0.5 tracking-wider">
                Контекст стиха / фраза:
              </span>
              <p className="text-sm font-serif italic text-[#2C3E50]">
                «{currentWord.contextPhrase}»
              </p>
            </div>
          )}

          {/* Lemma / Initial Dictionary Form Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold font-sans text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <span>Словарная начальная форма (Lemma):</span>
                <span className="text-[#8C7D6B] font-normal lowercase">(например: λύω, λόγος, θεάομαι)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
                className="text-xs text-[#2D4A32] font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>⌨️ {isKeyboardOpen ? 'Скрыть клавиатуру' : 'Греческая клавиатура'}</span>
              </button>
            </div>
            <input
              type="text"
              value={currentSelection.lemma || ''}
              onChange={(e) => updateLemma(e.target.value)}
              placeholder="Введите начальную форму на греческом..."
              className="w-full p-2.5 font-serif text-base border border-[#E5E1DA] rounded-lg bg-white text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          {/* Greek Keyboard toggleable */}
          {isKeyboardOpen && (
            <div className="border border-[#E5E1DA] rounded-lg p-2 bg-[#FAF8F5]">
              <GreekKeyboard
                onInsert={(char) => updateLemma((currentSelection.lemma || '') + char)}
                onDelete={() => updateLemma((currentSelection.lemma || '').slice(0, -1))}
                onClear={() => updateLemma('')}
              />
            </div>
          )}
        </div>

        {/* Structured Selection Section */}
        <div className="bg-white border border-[#E5E1DA] rounded-xl p-5 sm:p-6 shadow-2xs space-y-6">
          <h3 className="text-sm font-sans font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2 border-b border-[#E5E1DA] pb-3">
            <Sparkles className="w-4 h-4 text-[#8C7D6B]" />
            <span>Грамматические признаки формы</span>
          </h3>

          {/* 1. Part of Speech */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8C7D6B] uppercase tracking-wider block">
              1. Часть речи (Part of Speech):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PARTS_OF_SPEECH.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateSelection('partOfSpeech', item.id)}
                  className={`p-2.5 rounded-lg text-xs font-sans font-medium text-left border transition-all cursor-pointer ${
                    pos === item.id
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-xs'
                      : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:bg-white hover:border-[#8C7D6B]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Verb & Participle Tense */}
          {(isVerb || isParticiple) && (
            <div className="space-y-2 pt-3 border-t border-[#E5E1DA] animate-fade-in">
              <label className="text-xs font-bold text-[#8C7D6B] uppercase tracking-wider block">
                2. Время (Tense):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TENSES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSelection('tense', item.id)}
                    className={`p-2.5 rounded-lg text-xs font-sans font-medium text-left border transition-all cursor-pointer ${
                      currentSelection.tense === item.id
                        ? 'bg-[#2D4A32] text-white border-[#2D4A32] font-bold shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:bg-white hover:border-[#8C7D6B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Voice (Verb & Participle) */}
          {(isVerb || isParticiple) && (
            <div className="space-y-2 pt-3 border-t border-[#E5E1DA] animate-fade-in">
              <label className="text-xs font-bold text-[#8C7D6B] uppercase tracking-wider block">
                3. Залог (Voice):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VOICES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSelection('voice', item.id)}
                    className={`p-2.5 rounded-lg text-xs font-sans font-medium text-left border transition-all cursor-pointer ${
                      currentSelection.voice === item.id
                        ? 'bg-[#2D4A32] text-white border-[#2D4A32] font-bold shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:bg-white hover:border-[#8C7D6B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Mood (Verb only) */}
          {isVerb && (
            <div className="space-y-2 pt-3 border-t border-[#E5E1DA] animate-fade-in">
              <label className="text-xs font-bold text-[#8C7D6B] uppercase tracking-wider block">
                4. Наклонение (Mood):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MOODS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSelection('mood', item.id)}
                    className={`p-2.5 rounded-lg text-xs font-sans font-medium text-left border transition-all cursor-pointer ${
                      currentSelection.mood === item.id
                        ? 'bg-[#2D4A32] text-white border-[#2D4A32] font-bold shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:bg-white hover:border-[#8C7D6B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Person (Verbs, unless Infinitive/Participle) */}
          {isVerb && !isInf && (
            <div className="space-y-2 pt-3 border-t border-[#E5E1DA] animate-fade-in">
              <label className="text-xs font-bold text-[#8C7D6B] uppercase tracking-wider block">
                5. Лицо (Person):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PERSONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSelection('person', item.id)}
                    className={`p-2.5 rounded-lg text-xs font-sans font-medium text-center border transition-all cursor-pointer ${
                      currentSelection.person === item.id
                        ? 'bg-[#2D4A32] text-white border-[#2D4A32] font-bold shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:bg-white hover:border-[#8C7D6B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. Case (Noun, Adjective, Pronoun, Participle) */}
          {(isNounOrAdj || isParticiple) && (
            <div className="space-y-2 pt-3 border-t border-[#E5E1DA] animate-fade-in">
              <label className="text-xs font-bold text-[#8C7D6B] uppercase tracking-wider block">
                Падеж (Case):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CASES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSelection('case', item.id)}
                    className={`p-2.5 rounded-lg text-xs font-sans font-medium text-center border transition-all cursor-pointer ${
                      currentSelection.case === item.id
                        ? 'bg-[#2D4A32] text-white border-[#2D4A32] font-bold shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:bg-white hover:border-[#8C7D6B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 7. Number (Verb, Noun, Adjective, Pronoun, Participle) */}
          {pos && !isInf && (
            <div className="space-y-2 pt-3 border-t border-[#E5E1DA] animate-fade-in">
              <label className="text-xs font-bold text-[#8C7D6B] uppercase tracking-wider block">
                Число (Number):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {NUMBERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSelection('number', item.id)}
                    className={`p-2.5 rounded-lg text-xs font-sans font-medium text-center border transition-all cursor-pointer ${
                      currentSelection.number === item.id
                        ? 'bg-[#2D4A32] text-white border-[#2D4A32] font-bold shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:bg-white hover:border-[#8C7D6B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 8. Gender (Noun, Adjective, Pronoun, Participle) */}
          {(isNounOrAdj || isParticiple) && (
            <div className="space-y-2 pt-3 border-t border-[#E5E1DA] animate-fade-in">
              <label className="text-xs font-bold text-[#8C7D6B] uppercase tracking-wider block">
                Род (Gender):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateSelection('gender', item.id)}
                    className={`p-2.5 rounded-lg text-xs font-sans font-medium text-center border transition-all cursor-pointer ${
                      currentSelection.gender === item.id
                        ? 'bg-[#2D4A32] text-white border-[#2D4A32] font-bold shadow-xs'
                        : 'bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1DA] hover:bg-white hover:border-[#8C7D6B]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 9. Free-text Commentary / Translation */}
          <div className="space-y-2 pt-3 border-t border-[#E5E1DA]">
            <label className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center justify-between">
              <span>Текстовый комментарий и перевод формы:</span>
              <span className="text-[#8C7D6B] font-normal lowercase">(пояснение для учителя)</span>
            </label>
            <textarea
              rows={3}
              value={currentSelection.commentaryRu || ''}
              onChange={(e) => updateCommentary(e.target.value)}
              placeholder="Напишите своими словами разбор, особенности корня/суффиксов и точный перевод формы в контексте..."
              className="w-full p-3 text-sm font-sans border border-[#E5E1DA] rounded-lg bg-[#FAF8F5] text-[#1A1A1A] focus:bg-white focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>
        </div>

        {/* Navigation buttons between words */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2.5 bg-white border border-[#E5E1DA] text-[#1A1A1A] rounded-lg font-sans font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Предыдущее слово</span>
          </button>

          {currentIndex < words.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(words.length - 1, prev + 1))}
              className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#2C3E50] text-white rounded-lg font-sans font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span>Следующее слово</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitAll}
              className="px-6 py-2.5 bg-[#2D4A32] hover:bg-[#1E3322] text-white rounded-lg font-sans font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Завершить и сдать работу</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
