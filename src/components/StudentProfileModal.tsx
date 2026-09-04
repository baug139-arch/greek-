import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Award, 
  Flame, 
  BookOpen, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit2, 
  Save, 
  Sparkles, 
  Sliders, 
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  VolumeX,
  Type
} from 'lucide-react';
import { Student, StudentSettings } from '../types';
import { speakErasmian } from '../utils/audio';

interface StudentProfileModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: StudentSettings) => void;
  onUpdateProfile: (updatedProfile: { name: string; greekAlias: string; avatar: string }) => void;
  onDelete: () => void;
  onResetProgress: () => void;
}

const AVATAR_OPTIONS = ['👨‍🎓', '👩‍🎓', '🏛️', '📜', '📖', '🕊️', '✨', '👑', '🌿', '🦁'];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onUpdateSettings,
  onUpdateProfile,
  onDelete,
  onResetProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'grades_history'>('profile');

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(student.name);
  const [editGreekAlias, setEditGreekAlias] = useState(student.greekAlias);
  const [editAvatar, setEditAvatar] = useState(student.avatar);

  // Settings local state
  const [localSettings, setLocalSettings] = useState<StudentSettings>(student.settings || {
    preferredLearningMode: 'contextual_reader',
    audioSpeed: 0.82,
    voiceEngine: 'latin_phonetic',
    dailyWordGoal: 10,
    showTransliteration: true,
    showPhoneticIpa: true,
    greekFontSize: 'normal',
    soundEffectsEnabled: true,
    autoPlayAudio: true,
  });

  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'none' | 'reset' | 'delete'>('none');

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdateProfile({
      name: editName.trim(),
      greekAlias: editGreekAlias.trim() || 'Μαθητής',
      avatar: editAvatar,
    });
    setIsEditingProfile(false);
  };

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  };

  const attemptsWithFeedback = (student.sessionAttempts || []).filter(
    (a) => a.teacherGrade !== undefined || a.teacherFeedback
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/70 flex items-center justify-center p-4">
      <div className="bg-[#FDFCFB] border border-[#1A1A1A] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-serif">
        {/* Header with Title and Tabs */}
        <header className="p-6 border-b border-[#E5E1DA] bg-[#F9F7F2] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <span className="text-3xl p-2 bg-white border border-[#E5E1DA] rounded shadow-2xs">
              {student.avatar}
            </span>
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8C7D6B] block">
                Личный профиль студента
              </span>
              <h3 className="text-2xl font-serif text-[#1A1A1A] leading-tight">
                {student.name}{' '}
                <span className="text-lg italic text-[#8C7D6B]">({student.greekAlias})</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-[#E5E1DA] hover:border-[#1A1A1A] bg-white text-xs font-sans uppercase tracking-wider text-[#1A1A1A] transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="border-b border-[#E5E1DA] px-6 bg-white flex space-x-6 text-xs font-sans uppercase tracking-wider overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
                : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Профиль и Прогресс</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
                : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Настройки обучения</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grades_history')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 relative ${
              activeTab === 'grades_history'
                ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold'
                : 'border-transparent text-[#6B655C] hover:text-[#1A1A1A]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Оценки и отзывы Magister ({attemptsWithFeedback.length})</span>
            {attemptsWithFeedback.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#2D4A32] inline-block" />
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#FDFCFB]">
          {/* TAB 1: PROFILE & PROGRESS */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Card & Edit Form */}
              <div className="border border-[#E5E1DA] p-5 bg-white shadow-2xs">
                {!isEditingProfile ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xl font-serif text-[#1A1A1A] font-bold">{student.name}</h4>
                        <span className="text-sm font-serif italic text-[#8C7D6B]">
                          «{student.greekAlias}»
                        </span>
                      </div>
                      <p className="text-xs font-sans text-[#6B655C]">
                        Активен: {student.lastActive} • В клубе изучения койне
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="px-3.5 py-1.5 border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs font-sans uppercase tracking-wider text-[#2C3E50] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Редактировать профиль</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1">
                          Имя и Фамилия:
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-2 border border-[#E5E1DA] bg-white text-[#1A1A1A] focus:border-[#1A1A1A] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1">
                          Греческий псевдоним (койне):
                        </label>
                        <input
                          type="text"
                          value={editGreekAlias}
                          onChange={(e) => setEditGreekAlias(e.target.value)}
                          className="w-full p-2 border border-[#E5E1DA] bg-white font-serif text-[#1A1A1A] focus:border-[#1A1A1A] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#8C7D6B] uppercase tracking-wider mb-1.5">
                        Выберите аватар:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setEditAvatar(emoji)}
                            className={`w-9 h-9 border text-lg flex items-center justify-center transition-all ${
                              editAvatar === emoji
                                ? 'border-[#1A1A1A] bg-[#E5E1DA] scale-105'
                                : 'border-[#E5E1DA] bg-white hover:border-[#8C7D6B]'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E1DA]">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-3 py-1.5 border border-[#E5E1DA] text-[#6B655C] hover:border-[#1A1A1A]"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] uppercase tracking-wider"
                      >
                        Сохранить изменения
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Progress Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-4 border border-[#E5E1DA] bg-white">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] block">
                    Пройдено занятий
                  </span>
                  <p className="text-2xl font-serif text-[#1A1A1A] mt-0.5">{(student.sessionAttempts || []).length}</p>
                  <span className="text-[10px] font-sans text-[#2D4A32] flex items-center gap-1 mt-1">
                    <BookOpen className="w-3 h-3" /> Практика & тесты
                  </span>
                </div>

                <div className="p-4 border border-[#E5E1DA] bg-white">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] block">
                    Стрик дней
                  </span>
                  <p className="text-2xl font-serif text-[#1A1A1A] mt-0.5">{student.streakDays} дн.</p>
                  <span className="text-[10px] font-sans text-[#796B58] flex items-center gap-1 mt-1">
                    <Flame className="w-3 h-3 text-orange-600" /> Активная серия
                  </span>
                </div>

                <div className="p-4 border border-[#E5E1DA] bg-white">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] block">
                    Выучено слов
                  </span>
                  <p className="text-2xl font-serif text-[#1A1A1A] mt-0.5">
                    {student.masteredWordsCount}
                  </p>
                  <span className="text-[10px] font-sans text-[#6B655C] block mt-1">
                    Цель: {localSettings.dailyWordGoal} слов/день
                  </span>
                </div>

                <div className="p-4 border border-[#E5E1DA] bg-white">
                  <span className="text-[10px] font-sans uppercase tracking-widest text-[#8C7D6B] block">
                    Точность ответов
                  </span>
                  <p className="text-2xl font-serif text-[#2C3E50] mt-0.5">{student.accuracyRate}%</p>
                  <span className="text-[10px] font-sans text-[#2D4A32] block mt-1">
                    {student.accuracyRate >= 85 ? 'Высокая' : 'Стабильная'}
                  </span>
                </div>
              </div>

              {/* Teacher General Note if exists */}
              {student.notesFromTeacher && (
                <div className="p-4 border border-[#8C7D6B] bg-[#F9F7F2] space-y-1">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-[#8C7D6B]" />
                    <span className="text-xs font-sans uppercase tracking-wider text-[#8C7D6B] font-bold">
                      Общий комментарий преподавателя:
                    </span>
                  </div>
                  <p className="text-xs font-sans text-[#1A1A1A] italic pl-6 leading-relaxed">
                    «{student.notesFromTeacher}»
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LEARNING SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="border border-[#E5E1DA] p-5 bg-white shadow-2xs space-y-5 text-xs font-sans">
                {/* 1. Preferred Learning Mode */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Предпочитаемый режим обучения по умолчанию:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'contextual_reader', label: 'Чтение глав (Ин 1)', desc: 'Контекст и редкие слова <50' },
                      { id: 'frequency', label: 'По частотности', desc: 'Слова >50 раз, 20-50, 10-20' },
                      { id: 'thematic', label: 'По группам', desc: 'Тематические категории' },
                    ].map((mode) => (
                      <div
                        key={mode.id}
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            preferredLearningMode: mode.id as any,
                          })
                        }
                        className={`p-3 border transition-all cursor-pointer ${
                          localSettings.preferredLearningMode === mode.id
                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
                            : 'border-[#E5E1DA] bg-[#FDFCFB] hover:border-[#1A1A1A]'
                        }`}
                      >
                        <p className="font-bold text-xs">{mode.label}</p>
                        <p className="text-[10px] opacity-70 mt-1">{mode.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-[#E5E1DA]" />

                {/* 2. Audio & Speech Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#8C7D6B]" />
                      Голосовой движок и произношение:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakErasmian('πλήρωμα', localSettings.audioSpeed, localSettings.voiceEngine)}
                        className="text-[10px] px-2 py-0.5 border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] bg-white cursor-pointer"
                        title="Тест ударения: плэ́рома"
                      >
                        «πλήρωμα» 🔊
                      </button>
                      <button
                        type="button"
                        onClick={() => speakErasmian('μονογενής', localSettings.audioSpeed, localSettings.voiceEngine)}
                        className="text-[10px] px-2 py-0.5 border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] bg-white cursor-pointer"
                        title="Тест ударения: моногэнэ́с"
                      >
                        «μονογενής» 🔊
                      </button>
                      <button
                        type="button"
                        onClick={() => speakErasmian('καταλαμβάνω', localSettings.audioSpeed, localSettings.voiceEngine)}
                        className="text-[10px] px-2 py-0.5 border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] bg-white cursor-pointer"
                        title="Тест ударения: каталамба́но"
                      >
                        «καταλαμβάνω» 🔊
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-[#6B655C]">Алгоритм произношения и ударений:</span>
                      <select
                        value={localSettings.voiceEngine || 'latin_phonetic'}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            voiceEngine: e.target.value as any,
                          })
                        }
                        className="w-full p-2 border border-[#E5E1DA] bg-white text-xs text-[#1A1A1A] outline-none"
                      >
                        <option value="latin_phonetic">Латинско-романский диктор (it/es с твердым [b], [e])</option>
                        <option value="erasmian_accented">Эразмов синтез (с фиксацией ударений `+`)</option>
                        <option value="greek_native">Греческий диктор (el-GR с нативным тоновым ударением)</option>
                        <option value="auto">Автоматический подбор голоса</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] text-[#6B655C]">Скорость речи:</span>
                      <div className="flex items-center space-x-1">
                        {[
                          { rate: 0.7, label: '0.7x' },
                          { rate: 0.82, label: '0.8x' },
                          { rate: 1.0, label: '1.0x' },
                          { rate: 1.15, label: '1.15x' },
                        ].map((speed) => (
                          <button
                            key={speed.rate}
                            type="button"
                            onClick={() =>
                              setLocalSettings({ ...localSettings, audioSpeed: speed.rate })
                            }
                            className={`flex-1 py-1.5 border text-[11px] transition-colors cursor-pointer ${
                              localSettings.audioSpeed === speed.rate
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                                : 'bg-white border-[#E5E1DA] text-[#4A443D] hover:border-[#1A1A1A]'
                            }`}
                          >
                            {speed.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-[#E5E1DA]" />

                {/* 3. Daily Target, Batch Size & Display Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Порция слов в упражнении (батч):
                    </label>
                    <select
                      value={localSettings.batchSize || 8}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          batchSize: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 border border-[#E5E1DA] bg-white text-[#1A1A1A] outline-none"
                    >
                      <option value={5}>По 5 слов (Компактно и легко)</option>
                      <option value={8}>По 8 слов (Оптимально)</option>
                      <option value={10}>По 10 слов (Классический)</option>
                      <option value={15}>По 15 слов (Углубленный)</option>
                      <option value={0}>Все слова сразу (Без разбивки)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Дневная цель по изучению слов:
                    </label>
                    <select
                      value={localSettings.dailyWordGoal}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          dailyWordGoal: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 border border-[#E5E1DA] bg-white text-[#1A1A1A] outline-none"
                    >
                      <option value={5}>5 слов в день (Легкий темп)</option>
                      <option value={10}>10 слов в день (Рекомендовано)</option>
                      <option value={15}>15 слов в день (Интенсивный)</option>
                      <option value={25}>25 слов в день (Семинарист)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Размер греческого шрифта:
                    </label>
                    <select
                      value={localSettings.greekFontSize}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          greekFontSize: e.target.value as any,
                        })
                      }
                      className="w-full p-2.5 border border-[#E5E1DA] bg-white text-[#1A1A1A] outline-none"
                    >
                      <option value="normal">Стандартный (Normal)</option>
                      <option value="large">Крупный (Large)</option>
                      <option value="huge">Очень крупный (Huge / Политоника)</option>
                    </select>
                  </div>
                </div>

                <hr className="border-[#E5E1DA]" />

                {/* Toggles */}
                <div className="space-y-2.5">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={localSettings.showTransliteration}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          showTransliteration: e.target.checked,
                        })
                      }
                      className="rounded text-[#1A1A1A]"
                    />
                    <span className="text-xs text-[#1A1A1A]">
                      Показывать русскую транслитерацию под греческими словами (например: [ло́-гос])
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={localSettings.showPhoneticIpa}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          showPhoneticIpa: e.target.checked,
                        })
                      }
                      className="rounded text-[#1A1A1A]"
                    />
                    <span className="text-xs text-[#1A1A1A]">
                      Показывать фонетические подсказки Эразма при ошибках
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={localSettings.soundEffectsEnabled}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          soundEffectsEnabled: e.target.checked,
                        })
                      }
                      className="rounded text-[#1A1A1A]"
                    />
                    <span className="text-xs text-[#1A1A1A]">
                      Звуковые эффекты правильных/неправильных ответов (Duolingo Chime)
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E1DA]">
                  {settingsSavedToast ? (
                    <span className="text-xs font-sans text-[#2D4A32] bg-[#C5D9C8] px-3 py-1 rounded">
                      ✓ Настройки успешно сохранены!
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#8C7D6B]">
                      Настройки применятся ко всем сессиям обучения
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] uppercase tracking-wider text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Сохранить настройки</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GRADES & TEACHER FEEDBACK HISTORY */}
          {activeTab === 'grades_history' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#E5E1DA] flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-sans uppercase tracking-wider text-[#1A1A1A] font-bold">
                    Журнал проверенных работ и оценок
                  </h4>
                  <p className="text-xs font-sans text-[#6B655C]">
                    Оценки по шкале 0–100%, статус проверки и персональные рекомендации Magister
                  </p>
                </div>
                <span className="text-xs font-sans font-bold bg-[#E5E1DA] text-[#1A1A1A] px-2.5 py-1">
                  Всего попыток: {(student.sessionAttempts || []).length}
                </span>
              </div>

              {(student.sessionAttempts || []).length === 0 ? (
                <div className="p-8 border border-dashed border-[#E5E1DA] text-center bg-white space-y-2">
                  <p className="text-sm font-serif italic text-[#8C7D6B]">
                    Вы еще не прошли ни одной практической сессии.
                  </p>
                  <p className="text-xs font-sans text-[#6B655C]">
                    Запустите заучивание слов из главы Ин 1 или частотного словаря, чтобы ваши результаты появились в журнале преподавателя.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(student.sessionAttempts || []).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-4 border border-[#E5E1DA] bg-white space-y-3 hover:border-[#1A1A1A] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E5E1DA]/60 pb-2.5">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h5 className="text-base font-serif italic font-bold text-[#1A1A1A]">
                              {attempt.title}
                            </h5>
                            <span className="text-[10px] font-sans uppercase bg-[#E5E1DA] px-2 py-0.5">
                              {attempt.mode === 'contextual_reader' ? 'Чтение главы' : 'Лексика'}
                            </span>
                          </div>
                          <p className="text-[11px] font-sans text-[#6B655C]">
                            Дата прохождения: {attempt.date} • Результат: {attempt.scorePercent}%
                          </p>
                        </div>

                        {/* Grade and Status Badge */}
                        <div className="flex items-center space-x-2.5">
                          <div className="text-right">
                            <span className="text-[10px] font-sans uppercase text-[#8C7D6B] block">
                              Результат сессии
                            </span>
                            <span className="text-xs font-sans font-bold text-[#1A1A1A]">
                              {attempt.scorePercent}%
                            </span>
                          </div>

                          {attempt.teacherGrade !== undefined ? (
                            <div className="text-right pl-3 border-l border-[#E5E1DA]">
                              <span className="text-[10px] font-sans uppercase text-[#2D4A32] block font-bold">
                                Оценка Magister
                              </span>
                              <span
                                className={`text-xs font-sans font-bold px-2 py-0.5 rounded inline-block ${
                                  attempt.teacherGrade >= 85
                                    ? 'bg-[#C5D9C8] text-[#2D4A32]'
                                    : attempt.teacherGrade >= 70
                                    ? 'bg-[#E5E1DA] text-[#1A1A1A]'
                                    : 'bg-[#FADBD8] text-[#9E3B3B]'
                                }`}
                              >
                                {attempt.teacherGrade}%{' '}
                                {attempt.teacherGradeStatus === 'excellent'
                                  ? '(Отлично)'
                                  : attempt.teacherGradeStatus === 'passed'
                                  ? '(Зачтено)'
                                  : '(Повторить)'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-sans text-[#8C7D6B] bg-[#F9F7F2] px-2 py-1 border border-[#E5E1DA]">
                              Ожидает проверки
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Teacher Feedback Box if graded */}
                      {attempt.teacherFeedback && (
                        <div className="p-3 bg-[#F9F7F2] border-l-2 border-[#2C3E50] text-xs font-sans space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C3E50] block">
                            Отзыв преподавателя ({attempt.gradedAt || 'Проверено'}):
                          </span>
                          <p className="text-[#1A1A1A] italic leading-relaxed">
                            «{attempt.teacherFeedback}»
                          </p>
                          {attempt.teacherTags && attempt.teacherTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {attempt.teacherTags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-white border border-[#E5E1DA] px-2 py-0.5 text-[#4A443D]"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mistakes list in attempt */}
                      {attempt.mistakes && attempt.mistakes.length > 0 && (
                        <div className="text-xs font-sans space-y-1 pt-1">
                          <span className="text-[10px] uppercase text-[#9E3B3B] font-bold block">
                            Ошибки в словах ({attempt.mistakes.length}):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {attempt.mistakes.map((m, i) => (
                              <span
                                key={i}
                                className="bg-[#FAF8F5] border border-[#E5E1DA] px-2 py-1 text-[11px]"
                              >
                                <strong className="font-serif text-[#1A1A1A]">{m.wordGreek}</strong> ({m.translationRu}) — ответил: «{m.givenAnswer}»
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Banner */}
        {confirmMode !== 'none' && (
          <div className="p-4 bg-[#FADBD8] border-t border-b border-[#9E3B3B] font-sans space-y-2">
            <p className="text-xs text-[#9E3B3B] font-bold">
              {confirmMode === 'reset'
                ? `Сбросить весь прогресс ученика «${student.name}»? (Выученные слова и статистика обнулятся)`
                : `Вы уверены, что хотите полностью удалить ученика «${student.name}»?`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirmMode === 'reset') {
                    onResetProgress();
                  } else {
                    onDelete();
                  }
                  setConfirmMode('none');
                }}
                className="px-4 py-1.5 bg-[#9E3B3B] text-white hover:bg-[#7D2E2E] text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                {confirmMode === 'reset' ? 'Да, обнулить' : 'Да, удалить'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmMode('none')}
                className="px-4 py-1.5 bg-white border border-[#1A1A1A] text-[#1A1A1A] text-xs uppercase tracking-wider cursor-pointer hover:bg-[#F9F7F2] transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="p-4 border-t border-[#E5E1DA] bg-[#F9F7F2] flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmMode('reset')}
              className="px-4 py-2 bg-white border border-[#9E3B3B] text-[#9E3B3B] hover:bg-[#9E3B3B] hover:text-white text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer"
            >
              Сбросить прогресс
            </button>
            <button
              type="button"
              onClick={() => setConfirmMode('delete')}
              className="px-4 py-2 bg-[#9E3B3B] text-white hover:bg-[#7D2E2E] text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer"
            >
              Удалить ученика
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer"
          >
            Закрыть профиль
          </button>
        </footer>
      </div>
    </div>
  );
};
