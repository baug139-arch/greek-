import React, { useState } from 'react';
import { 
  X, 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  Check, 
  LogIn, 
  LogOut, 
  Sparkles, 
  Cloud, 
  Globe,
  HelpCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithGoogle, logOut } from '../firebase';
import { 
  getUserProfileFromCloud, 
  getStudentByEmailFromCloud, 
  saveUserProfileToCloud 
} from '../utils/cloudSync';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile | null;
  onProfileUpdated: (profile: UserProfile) => void;
  onLoggedOut: () => void;
}

const GREEK_NAMES_SUGGESTIONS = [
  { greek: 'Ἰωάννης', ru: 'Иоанн', meaning: 'Бог помиловал', avatar: '📜' },
  { greek: 'Ἀνδρέας', ru: 'Андрей', meaning: 'Мужественный', avatar: '⚓' },
  { greek: 'Πέτρος', ru: 'Петр', meaning: 'Камень / Скала', avatar: '🪨' },
  { greek: 'Παῦλος', ru: 'Павел', meaning: 'Скромный / Малый', avatar: '✍️' },
  { greek: 'Λουκᾶς', ru: 'Лука', meaning: 'Светлый / Врач', avatar: '🕊️' },
  { greek: 'Τιμόθεος', ru: 'Тимофей', meaning: 'Почитающий Бога', avatar: '🌿' },
  { greek: 'Μαρία', ru: 'Мария', meaning: 'Возлюбленная', avatar: '🌸' },
  { greek: 'Στέφανος', ru: 'Стефан', meaning: 'Венец победы', avatar: '👑' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  onProfileUpdated,
  onLoggedOut,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Profile Edit State when logged in
  const [displayName, setDisplayName] = useState(currentUserProfile?.displayName || '');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>(
    currentUserProfile?.role || 'student'
  );
  const [greekAlias, setGreekAlias] = useState(currentUserProfile?.greekAlias || 'Ἰωάννης');
  const [avatar, setAvatar] = useState(currentUserProfile?.avatar || '👨‍🎓');

  React.useEffect(() => {
    if (currentUserProfile) {
      setDisplayName(currentUserProfile.displayName || '');
      setSelectedRole(currentUserProfile.role || 'student');
      setGreekAlias(currentUserProfile.greekAlias || 'Ἰωάννης');
      setAvatar(currentUserProfile.avatar || '👨‍🎓');
    }
  }, [currentUserProfile]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        const isMasterTeacher = user.email?.toLowerCase() === 'baug139@gmail.com';

        // 1. Check if user profile already exists in Cloud (returning user)
        let existingProfile = await getUserProfileFromCloud(user.uid);
        if (!existingProfile && user.email) {
          const studentDoc = await getStudentByEmailFromCloud(user.email);
          if (studentDoc && studentDoc.name && studentDoc.name !== 'Студент' && studentDoc.name !== 'Гость') {
            existingProfile = {
              uid: user.uid,
              email: user.email,
              displayName: studentDoc.name,
              photoURL: user.photoURL || studentDoc.photoURL,
              role: isMasterTeacher ? 'teacher' : 'student',
              greekAlias: studentDoc.greekAlias || 'Ἰωάννης',
              avatar: studentDoc.avatar || '👨‍🎓',
              createdAt: new Date().toISOString(),
            };
            await saveUserProfileToCloud(existingProfile);
          }
        }

        // RETURNING USER: If profile already exists with a name, IMMEDIATELY close modal!
        if (existingProfile && existingProfile.displayName && existingProfile.displayName !== 'Студент' && existingProfile.displayName !== 'Гость') {
          onProfileUpdated(existingProfile);
          onClose(); // Seamless login without any prompts!
          return;
        }

        // 2. First-time User:
        const initialName = (user.displayName && user.displayName !== 'Студент' && user.displayName !== 'Гость')
          ? user.displayName.trim()
          : (isMasterTeacher ? 'Сурен Ханикян' : '');

        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: initialName || 'Студент',
          photoURL: user.photoURL || undefined,
          role: isMasterTeacher ? 'teacher' : 'student',
          greekAlias: isMasterTeacher ? 'Ἐρασμιανός' : 'Ἰωάννης',
          avatar: isMasterTeacher ? '👨‍🏫' : '👨‍🎓',
          createdAt: new Date().toISOString(),
        };

        // If Google already provided a real name, save and close immediately!
        if (initialName && initialName.length > 1) {
          await saveUserProfileToCloud(newProfile);
          onProfileUpdated(newProfile);
          onClose(); // Seamless login!
          return;
        }

        // Only if no name could be found, show the one-time name input in the modal
        setDisplayName(initialName);
        setSelectedRole(newProfile.role);
        setGreekAlias(newProfile.greekAlias);
        setAvatar(newProfile.avatar);
        onProfileUpdated(newProfile);
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setAuthError('Не удалось выполнить вход через Google. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfileChanges = async () => {
    if (!currentUserProfile) return;
    const trimmed = displayName.trim() || currentUserProfile.displayName || 'Студент';
    const updated: UserProfile = {
      ...currentUserProfile,
      displayName: trimmed,
      role: selectedRole,
      greekAlias,
      avatar,
    };
    await saveUserProfileToCloud(updated);
    onProfileUpdated(updated);
    onClose();
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logOut();
      onLoggedOut();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/70 backdrop-blur-xs font-sans">
      <div 
        id="auth-modal-card"
        className="bg-[#FDFCFB] border border-[#E5E1DA] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5E1DA] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#FAF8F5] border border-[#E5E1DA] text-[#1A1A1A] rounded">
              <Cloud className="w-5 h-5 text-[#2C3E50]" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1A1A1A] leading-tight">
                {currentUserProfile ? 'Профиль & Синхронизация' : 'Вход в систему Koine Greek'}
              </h2>
              <p className="text-xs text-[#8C7D6B] font-sans">
                {currentUserProfile 
                  ? 'Облачное сохранение прогресса и доступ к материалам'
                  : 'Войдите через Google для сохранения прогресса на всех устройствах'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E5E1DA] rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {authError && (
            <div className="p-3 bg-[#FBF0F0] border border-[#F0D5D5] text-[#9E3B3B] text-xs rounded">
              {authError}
            </div>
          )}

          {/* If NOT LOGGED IN */}
          {!currentUserProfile ? (
            <div className="space-y-6 text-center py-2">
              <div className="max-w-sm mx-auto space-y-3">
                <div className="w-16 h-16 mx-auto bg-[#FAF8F5] border border-[#E5E1DA] rounded-full flex items-center justify-center text-3xl shadow-2xs">
                  🏛️
                </div>
                <h3 className="text-base font-serif font-bold text-[#1A1A1A]">
                  Единый библейский класс
                </h3>
                <p className="text-xs text-[#6B655C] leading-relaxed">
                  Вход через Google позволяет преподавателю проверять ваши задания и контрольные, а вам — учить древнегреческий с телефона и компьютера без потери прогресса.
                </p>
              </div>

              {/* Google Login Button */}
              <div className="space-y-3 pt-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-white border border-[#1A1A1A] hover:bg-[#FAF8F5] text-[#1A1A1A] text-xs uppercase tracking-wider font-bold rounded flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Подключение...' : 'Войти через Google'}</span>
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs text-[#8C7D6B] hover:text-[#1A1A1A] underline cursor-pointer"
                  >
                    Продолжить как гость (демо-режим без облака)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* If ALREADY LOGGED IN: Manage profile & Role */
            <div className="space-y-5">
              {/* User Identity Card */}
              <div className="p-4 bg-white border border-[#E5E1DA] rounded flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentUserProfile.photoURL ? (
                    <img 
                      src={currentUserProfile.photoURL} 
                      alt={currentUserProfile.displayName} 
                      className="w-12 h-12 rounded-full border border-[#E5E1DA] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E5E1DA] flex items-center justify-center text-2xl">
                      {avatar}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-serif font-bold text-[#1A1A1A]">
                      {currentUserProfile.displayName}
                    </h4>
                    <p className="text-xs text-[#8C7D6B] font-mono">
                      {currentUserProfile.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#34A853]" />
                      <span className="text-[10px] text-[#2D4A32] font-medium font-sans">
                        Google аккаунт активен (Облако подключено)
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="px-3 py-1.5 border border-[#E5E1DA] hover:border-[#9E3B3B] text-[#9E3B3B] hover:bg-[#FBF0F0] text-xs font-sans font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Выйти из аккаунта"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Выйти</span>
                </button>
              </div>

              {/* Role Selection (Admin only can change, student has locked student profile) */}
              {currentUserProfile.email === 'baug139@gmail.com' ? (
                <div className="space-y-2">
                  <label className="block text-[#8C7D6B] uppercase tracking-wider font-bold text-[10px]">
                    Выберите вашу роль:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setSelectedRole('student')}
                      className={`p-3.5 border rounded cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                        selectedRole === 'student'
                          ? 'border-[#1A1A1A] bg-[#FAF8F5] ring-1 ring-[#1A1A1A]'
                          : 'border-[#E5E1DA] bg-white hover:border-[#8C7D6B]'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5 text-[#2C3E50]" />
                      <span className="text-xs font-bold text-[#1A1A1A]">
                        🎓 Студент (Discipulus)
                      </span>
                      <p className="text-[10px] text-[#6B655C]">
                        Режим прохождения курсов и сдачи работ.
                      </p>
                    </div>

                    <div
                      onClick={() => setSelectedRole('teacher')}
                      className={`p-3.5 border rounded cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                        selectedRole === 'teacher'
                          ? 'border-[#1A1A1A] bg-[#FAF8F5] ring-1 ring-[#1A1A1A]'
                          : 'border-[#E5E1DA] bg-white hover:border-[#8C7D6B]'
                      }`}
                    >
                      <Users className="w-5 h-5 text-[#2D4A32]" />
                      <span className="text-xs font-bold text-[#1A1A1A]">
                        👨‍🏫 Преподаватель (Magister)
                      </span>
                      <p className="text-[10px] text-[#6B655C]">
                        Управление классом, журнал проверок и оценок.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#FAF8F5] border border-[#E5E1DA] rounded flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#2C3E50]" />
                    <span className="font-bold text-[#1A1A1A]">
                      {currentUserProfile.role === 'teacher' ? 'Преподаватель курса (Magister)' : 'Студент курса (Discipulus)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8C7D6B] uppercase font-bold">
                    Личный кабинет
                  </span>
                </div>
              )}

              {/* Real Name Input Field */}
              <div className="space-y-1.5">
                <label className="block text-[#1A1A1A] uppercase tracking-wider font-bold text-[10px] font-sans">
                  Ваше имя в классе (ФИО или имя): <span className="text-[#9E3B3B]">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ваше имя или фамилия (например: Сурен Ханикян)"
                  className="w-full p-2.5 text-xs border border-[#1A1A1A] bg-white rounded text-[#1A1A1A] font-serif font-bold focus:outline-hidden focus:ring-1 focus:ring-[#2D4A32]"
                />
              </div>

              {/* Greek Alias Selection */}
              <div className="space-y-2">
                <label className="block text-[#8C7D6B] uppercase tracking-wider font-bold text-[10px]">
                  Греческий библейский псевдоним:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GREEK_NAMES_SUGGESTIONS.map((item) => (
                    <button
                      key={item.greek}
                      type="button"
                      onClick={() => {
                        setGreekAlias(item.greek);
                        setAvatar(item.avatar);
                      }}
                      className={`p-2 border text-left rounded cursor-pointer transition-all flex items-center gap-2 ${
                        greekAlias === item.greek
                          ? 'border-[#1A1A1A] bg-[#FAF8F5] font-bold ring-1 ring-[#1A1A1A]'
                          : 'border-[#E5E1DA] bg-white hover:border-[#8C7D6B]'
                      }`}
                    >
                      <span className="text-base">{item.avatar}</span>
                      <div className="overflow-hidden">
                        <div className="font-serif text-xs text-[#1A1A1A] truncate">{item.greek}</div>
                        <div className="text-[9px] text-[#8C7D6B] truncate">{item.ru}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={greekAlias}
                  onChange={(e) => setGreekAlias(e.target.value)}
                  placeholder="Или введите свой греческий псевдоним..."
                  className="w-full mt-1.5 p-2 text-xs border border-[#E5E1DA] bg-white rounded text-[#1A1A1A]"
                />
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end gap-2 border-t border-[#E5E1DA]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#E5E1DA] hover:border-[#1A1A1A] text-xs uppercase tracking-wider font-bold rounded cursor-pointer"
                >
                  Закрыть
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfileChanges}
                  className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#2C3E50] text-white text-xs uppercase tracking-wider font-bold rounded transition-colors cursor-pointer shadow-2xs"
                >
                  Сохранить настройки
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
