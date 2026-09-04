import React from 'react';
import { X, Volume2, BookOpen } from 'lucide-react';
import { ERASMIAN_RULES, speakErasmian } from '../utils/audio';

interface ErasmianGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErasmianGuideModal: React.FC<ErasmianGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/70 flex items-center justify-center p-4">
      <div className="bg-[#FDFCFB] border border-[#1A1A1A] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        <header className="p-6 border-b border-[#E5E1DA] flex items-center justify-between bg-[#F9F7F2]">
          <div>
            <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[#8C7D6B] block mb-1">
              Phonologia Erasmiana
            </span>
            <h3 className="text-2xl font-serif italic text-[#1A1A1A]">
              Эразмово произношение койне
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-white text-[#1A1A1A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="border-l-2 border-[#8C7D6B] pl-4 text-xs font-sans text-[#6B655C] leading-relaxed">
            <p>
              Эразмова реконструкция (XVI век) восстанавливает классическое и эллинистическое звучание букв.
              Главные отличия: буква <strong>β</strong> всегда произносится как твердое [б], <strong>η</strong> как долгое [э̄],
              дифтонги <strong>αι</strong> = [ай], <strong>ει</strong> = [эй], <strong>οι</strong> = [ой], а <strong>θ, φ, χ</strong> как придыхательные глухие [тх, пх, кх].
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-sans uppercase tracking-widest text-[#8C7D6B]">
              Сводная таблица звуков и правил:
            </h4>
            <div className="border border-[#E5E1DA] divide-y divide-[#E5E1DA] bg-white">
              {ERASMIAN_RULES.map((rule, idx) => (
                <div key={idx} className="p-3.5 flex items-start justify-between gap-4 hover:bg-[#FAF8F5]">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-serif text-lg font-bold text-[#1A1A1A]">{rule.letter}</span>
                      <span className="text-xs font-sans font-bold text-[#2C3E50] bg-[#E5E1DA] px-2 py-0.5">
                        {rule.sound}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-[#4A443D]">{rule.descriptionRu}</p>
                    <p className="text-xs font-serif italic text-[#8C7D6B]">
                      Пример: {rule.example}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const greekWord = rule.example.split(' ')[0];
                      speakErasmian(greekWord, 0.8);
                    }}
                    className="p-2 border border-[#E5E1DA] hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer self-center"
                    title="Прослушать пример"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="p-4 border-t border-[#E5E1DA] bg-[#F9F7F2] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#2C3E50] font-sans uppercase tracking-widest text-xs transition-colors"
          >
            Закрыть справочник
          </button>
        </footer>
      </div>
    </div>
  );
};
