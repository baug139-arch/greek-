import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  GraduationCap, 
  Check, 
  User
} from 'lucide-react';

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onRegister: (name: string, greekAlias: string, avatar: string) => void;
  onOpenGoogleAuth: () => void;
  onContinueAsGuest: () => void;
}

const GREEK_NAME_OPTIONS = [
  { greek: 'Ἰωάννης', ru: 'Иоанн', avatar: '📜' },
  { greek: 'Ἀνδρέας', ru: 'Андрей', avatar: '⚓' },
  { greek: 'Πέτρος', ru: 'Петр', avatar: '🪨' },
  { greek: 'Παῦλος', ru: 'Павел', avatar: '✍️' },
  { greek: 'Λουκᾶς', ru: 'Лука', avatar: '🕊️' },
  { greek: 'Τιμόθεος', ru: 'Тимофей', avatar: '🌿' },
  { greek: 'Μαρία', ru: 'Мария', avatar: '🌸' },
  { greek: 'Στέфаνος', ru: 'Стефан', avatar: '👑' },
  { greek: 'Ἀλέξιος', ru: 'Алексей', avatar: '👨‍🎓' },
  { greek: 'Ἄνна', ru: 'Анна', avatar: '👩‍🎓' },
  { greek: 'Μιχαήλ', ru: 'Михаил', avatar: '⚔️' },
  { greek: 'Ἐλισάβετ', ru: 'Елизавета', avatar: '✨' },
];

const AVATAR_LIST = ['👨‍🎓', '👩‍🎓', '🏛️', '📜', '🕊️', '✨', '👑', '🌿', '🦁', '📖'];

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  isOpen,
  onRegister,
  onOpenGoogleAuth,
  onContinueAsGuest,
}) => {
  const [name, setName] = useState('');
  const [selectedGreekAlias, setSelectedGreekAlias] = useState('Ἰωάννης');
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍🎓');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onRegister(trimmed, selectedGreekAlias, selectedAvatar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1A1A1A]/75 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-[#FAF8F5] border-2 border-[#1A1A1A] max-w-lg w-full rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Banner */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E5E1DA] text-center space-y-2 relative overflow-hidden">
          {/* Decorative watermark */}
          <div className="absolute -right-4 -bottom-6 text-7xl font-serif text-[#1A1A1A] opacity-5 select-none pointer-events-none">
            ΑΩ
          </div>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E5E1DA] text-2xl mb-1 shadow-2xs">
            {selectedAvatar}
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1A1A]">
            Добро пожаловать в Koine Greek
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#6B655C] max-w-sm mx-auto">
            Изучение греческого языка Нового Завета. Введите ваше имя для сохранения прогресса и связи с преподавателем.
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
          
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-sans uppercase tracking-wider font-bold text-[#1A1A1A]">
              Как вас зовут? <span className="text-[#9E3B3B]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя или фамилия (например: Алексей, Сурен, Мария)"
                className="w-full px-4 py-3 bg-white border-2 border-[#1A1A1A] rounded text-sm text-[#1A1A1A] placeholder-[#8C7D6B] focus:outline-hidden focus:ring-2 focus:ring-[#2D4A32] transition-all font-serif"
              />
              <User className="w-4 h-4 text-[#8C7D6B] absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            <p className="text-[11px] text-[#8C7D6B] font-sans">
              Имя сохраняется на вашем устройстве, окно больше не появится при повторных визитах.
            </p>
          </div>

          {/* Avatar selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-sans uppercase tracking-wider font-bold text-[#1A1A1A]">
              Выберите аватар:
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVATAR_LIST.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all cursor-pointer ${
                    selectedAvatar === av
                      ? 'bg-[#1A1A1A] text-white ring-2 ring-[#1A1A1A] scale-110 shadow-xs'
                      : 'bg-white border border-[#E5E1DA] hover:border-[#1A1A1A]'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Greek Alias suggestions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-sans uppercase tracking-wider font-bold text-[#1A1A1A]">
              Греческое библейское имя (псевдоним в курсе):
            </label>
            <input
              type="text"
              value={selectedGreekAlias}
              onChange={(e) => setSelectedGreekAlias(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5E1DA] rounded text-sm font-serif text-[#2C3E50] font-bold focus:outline-hidden focus:border-[#1A1A1A]"
              placeholder="Греческое имя"
            />
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {GREEK_NAME_OPTIONS.map((item) => (
                <button
                  type="button"
                  key={item.greek}
                  onClick={() => {
                    setSelectedGreekAlias(item.greek);
                    setSelectedAvatar(item.avatar);
                  }}
                  className={`px-2 py-1 rounded text-xs font-serif transition-colors cursor-pointer border ${
                    selectedGreekAlias === item.greek
                      ? 'bg-[#2D4A32] text-white border-[#2D4A32]'
                      : 'bg-white text-[#1A1A1A] border-[#E5E1DA] hover:border-[#1A1A1A]'
                  }`}
                >
                  <span className="font-bold">{item.greek}</span>{' '}
                  <span className="opacity-70 text-[10px]">({item.ru})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className={`w-full py-3.5 px-4 rounded text-xs font-sans uppercase font-bold tracking-widest flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                name.trim()
                  ? 'bg-[#1A1A1A] text-white hover:bg-[#2C3E50]'
                  : 'bg-[#E5E1DA] text-[#8C7D6B] cursor-not-allowed'
              }`}
            >
              <span>Начать изучение</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Alternative Google Sign In or Guest */}
          <div className="pt-3 border-t border-[#E5E1DA] space-y-2 text-center">
            <div className="text-[11px] text-[#8C7D6B] uppercase font-bold tracking-wider">
              или войдите с существующим аккаунтом
            </div>

            <button
              type="button"
              onClick={onOpenGoogleAuth}
              className="w-full py-2.5 px-3 bg-white border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] rounded text-xs font-sans font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Войти через Google (мульти-устройство)</span>
            </button>

            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-[#8C7D6B] hover:text-[#1A1A1A] underline cursor-pointer py-1 block mx-auto transition-colors"
            >
              Продолжить как гость без сохранения
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
