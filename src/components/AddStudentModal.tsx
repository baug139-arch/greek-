import React, { useState } from 'react';
import { UserPlus, X, Sparkles } from 'lucide-react';
import { Student } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudentData: { name: string; greekAlias?: string; avatar?: string }) => void;
}

const AVATAR_OPTIONS = ['👨‍🎓', '👩‍🎓', '🏛️', '📜', '📖', '🕊️', '✨', '👑', '🌿', '🦁'];

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
}) => {
  const [name, setName] = useState('');
  const [greekAlias, setGreekAlias] = useState('');
  const [avatar, setAvatar] = useState('👨‍🎓');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddStudent({
      name: name.trim(),
      greekAlias: greekAlias.trim() || 'Νέος Μαθητής',
      avatar: avatar,
    });

    // Reset local state
    setName('');
    setGreekAlias('');
    setAvatar('👨‍🎓');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/70 flex items-center justify-center p-4 font-serif">
      <div className="bg-[#FDFCFB] border border-[#1A1A1A] max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E1DA] bg-[#F9F7F2] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserPlus className="w-5 h-5 text-[#2C3E50]" />
            <h3 className="text-base font-serif italic font-bold text-[#1A1A1A]">
              Добавление нового ученика
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-[#E5E1DA] text-[#6B655C] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-sans uppercase tracking-wider text-[#1A1A1A] font-bold block">
              Имя и фамилия ученика <span className="text-[#9E3B3B]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Иван П. или Анна С."
              className="w-full p-2.5 border border-[#1A1A1A] bg-white text-sm font-sans outline-none focus:ring-1 focus:ring-[#1A1A1A]"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-sans uppercase tracking-wider text-[#1A1A1A] font-bold block">
              Греческий псевдоним (для журнала)
            </label>
            <input
              type="text"
              value={greekAlias}
              onChange={(e) => setGreekAlias(e.target.value)}
              placeholder="Например: Ἰωάννης или Ἄννα"
              className="w-full p-2.5 border border-[#E5E1DA] bg-white text-sm font-sans outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-sans uppercase tracking-wider text-[#1A1A1A] font-bold block">
              Выберите аватар
            </label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-10 h-10 text-xl flex items-center justify-center border transition-all cursor-pointer ${
                    avatar === emoji
                      ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xs scale-105'
                      : 'border-[#E5E1DA] bg-white hover:border-[#1A1A1A]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-[#E5E1DA] flex justify-end gap-2 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E1DA] text-[#6B655C] hover:bg-[#F9F7F2] text-xs uppercase tracking-widest cursor-pointer transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] disabled:opacity-50 text-xs uppercase tracking-widest cursor-pointer transition-colors font-bold"
            >
              Создать ученика
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
