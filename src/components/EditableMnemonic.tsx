import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { GreekWord } from '../types';
import { getMnemonicForWord } from '../utils/mnemonics';

interface EditableMnemonicProps {
  word: GreekWord;
  customMnemonics?: Record<string, string>;
  onUpdateMnemonic?: (wordId: string, mnemonic: string) => void;
  className?: string;
  isEngine?: boolean;
}

export function EditableMnemonic({ word, customMnemonics, onUpdateMnemonic, className = "", isEngine = false }: EditableMnemonicProps) {
  const [isEditing, setIsEditing] = useState(false);
  const defaultMnemonic = word.mnemonicRu || getMnemonicForWord(word);
  const customMnemonic = customMnemonics?.[word.id];
  const activeMnemonic = customMnemonic || defaultMnemonic;
  const [editValue, setEditValue] = useState(activeMnemonic || '');

  const handleSave = () => {
    if (onUpdateMnemonic) {
      onUpdateMnemonic(word.id, editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(activeMnemonic || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 mt-1 ${className}`}>
        <span className="text-[11px] font-sans text-[#796B58] italic whitespace-nowrap">Ассоц.:</span>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="Своя ассоциация..."
          className="text-[11px] font-sans bg-white border border-[#E5E1DA] rounded px-1.5 py-0.5 outline-none focus:border-[#D4A373] w-full max-w-[200px]"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <button onClick={handleSave} className="text-[#2D4A32] hover:bg-[#C5D9C8] p-0.5 rounded transition-colors" title="Сохранить">
          <Check className="w-3 h-3" />
        </button>
        <button onClick={handleCancel} className="text-[#A72828] hover:bg-[#F2D7D7] p-0.5 rounded transition-colors" title="Отмена">
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (!activeMnemonic) {
    if (onUpdateMnemonic) {
      return (
        <div className={`mt-1 ${className}`}>
          <button
            onClick={() => setIsEditing(true)}
            className="text-[10px] sm:text-[11px] font-sans text-[#8C7D6B] hover:text-[#4A443D] border border-dashed border-[#E5E1DA] hover:border-[#8C7D6B] rounded px-1.5 py-0.5 flex items-center gap-1 transition-colors bg-[#FAF8F5]/50"
          >
            <Edit2 className="w-3 h-3" />
            Добавить ассоциацию
          </button>
        </div>
      );
    }
    return null;
  }

  const defaultStyles = isEngine
    ? "text-[12px] sm:text-sm font-sans text-[#796B58] italic mt-2 bg-[#FAF8F5] px-2 py-1 rounded border border-[#E5E1DA]/80"
    : "text-[11px] font-sans text-[#796B58] italic mt-1 bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5E1DA]/80 flex items-center gap-1 w-fit group";

  return (
    <div className={`${defaultStyles} ${className}`}>
      {isEngine ? '💡 Ассоциация: ' : '(ассоц.: '}
      <strong>{activeMnemonic}</strong>
      {!isEngine && ')'}
      {onUpdateMnemonic && !isEngine && (
        <button
          onClick={() => setIsEditing(true)}
          className="ml-1 opacity-0 group-hover:opacity-100 text-[#8C7D6B] hover:text-[#4A443D] transition-opacity p-0.5"
          title="Изменить ассоциацию"
        >
          <Edit2 className="w-3 h-3" />
        </button>
      )}
      {onUpdateMnemonic && isEngine && (
        <button
          onClick={() => setIsEditing(true)}
          className="ml-2 inline-flex items-center gap-1 text-[10px] text-[#8C7D6B] hover:text-[#4A443D] bg-white border border-[#E5E1DA] px-1.5 py-0.5 rounded transition-colors"
        >
          <Edit2 className="w-3 h-3" />
          изменить
        </button>
      )}
    </div>
  );
}
