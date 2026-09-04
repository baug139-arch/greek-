import React from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import { StudentMorphologyFormSelection } from '../types';
import { buildMorphologyComparison, findMorphologyWord } from '../utils/morphologyFormat';

interface MorphologyComparisonViewProps {
  greekWord: string;
  wordId?: string;
  studentSelection?: StudentMorphologyFormSelection;
  teacherReferenceNotes?: string;
  verseRef?: string;
  showCommentary?: boolean;
}

export const MorphologyComparisonView: React.FC<MorphologyComparisonViewProps> = ({
  greekWord,
  wordId,
  studentSelection,
  teacherReferenceNotes,
  verseRef,
  showCommentary = true,
}) => {
  const refDbWord = findMorphologyWord(greekWord, wordId);
  const rows = buildMorphologyComparison(greekWord, studentSelection, refDbWord, teacherReferenceNotes);

  const hasAnyData = rows.length > 0;

  return (
    <div className="space-y-3">
      {/* Comparison Grid */}
      {hasAnyData ? (
        <div className="bg-white border border-[#E5E1DA] rounded-lg overflow-hidden shadow-2xs">
          {/* Table Header */}
          <div className="bg-[#FAF8F5] border-b border-[#E5E1DA] px-3 py-2 text-[11px] font-bold text-[#8C7D6B] uppercase tracking-wider flex items-center justify-between">
            <span>Сопоставление характеристик (друг под другом)</span>
            <div className="flex items-center gap-3 text-[10px] lowercase font-normal">
              <span className="flex items-center gap-1 text-[#2D4A32] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#2D4A32]"></span> Эталон
              </span>
              <span className="flex items-center gap-1 text-[#1A1A1A] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#1A1A1A]"></span> Ответ ученика
              </span>
            </div>
          </div>

          {/* Grid of categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[#E5E1DA]">
            {rows.map((row, idx) => {
              const hasRef = row.refValue && row.refValue !== '—';
              const hasStu = row.hasStudentValue;

              return (
                <div key={idx} className="bg-white p-2.5 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-1">
                    <span className="text-[11px] font-bold uppercase text-[#8C7D6B] tracking-wide">
                      {row.label}
                    </span>
                    {hasRef && hasStu ? (
                      row.isMatch ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2D4A32] bg-[#F2F7F3] px-1.5 py-0.2 rounded">
                          <Check className="w-3 h-3 text-[#2D4A32]" />
                          Совпадает
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#9E3B3B] bg-[#FCF5F5] px-1.5 py-0.2 rounded">
                          <X className="w-3 h-3 text-[#9E3B3B]" />
                          Ошибка
                        </span>
                      )
                    ) : hasRef && !hasStu ? (
                      <span className="text-[10px] text-[#8C7D6B] italic">Не заполнено</span>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {/* Top: Teacher/Reference value */}
                    <div className="bg-[#F4F9F5] border border-[#D5E5D8] rounded p-1.5">
                      <div className="text-[9px] uppercase font-bold text-[#2D4A32] tracking-wider mb-0.5">
                        Эталон:
                      </div>
                      <div className={`font-medium text-[#1E3A24] ${row.label === 'Словарная форма' ? 'font-serif text-sm font-bold' : ''}`}>
                        {row.refValue}
                      </div>
                    </div>

                    {/* Bottom: Student value (strictly under reference!) */}
                    <div
                      className={`border rounded p-1.5 ${
                        !hasStu
                          ? 'bg-[#FAF8F5] border-[#E5E1DA] text-[#8C7D6B]'
                          : row.isMatch
                          ? 'bg-[#F9FCF9] border-[#C5D9C8] text-[#1A1A1A]'
                          : 'bg-[#FCF5F5] border-[#FADBD8] text-[#9E3B3B]'
                      }`}
                    >
                      <div className="text-[9px] uppercase font-bold text-[#6B655C] tracking-wider mb-0.5">
                        Ответ ученика:
                      </div>
                      <div
                        className={`font-semibold ${
                          !hasStu
                            ? 'italic text-[#8C7D6B]'
                            : row.label === 'Словарная форма'
                            ? 'font-serif text-sm font-bold text-[#1A1A1A]'
                            : row.isMatch
                            ? 'text-[#2D4A32]'
                            : 'text-[#9E3B3B]'
                        }`}
                      >
                        {hasStu ? row.studentValue : '(не указано)'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white border border-[#E5E1DA] rounded-lg text-center text-xs text-[#8C7D6B]">
          Характеристики не заполнены
        </div>
      )}

      {/* Reference note text from teacher (if present and provides extra info) */}
      {teacherReferenceNotes && (
        <div className="p-2.5 bg-[#FAF8F5] border border-[#E5E1DA] rounded text-xs">
          <span className="text-[10px] uppercase font-bold text-[#2D4A32] block mb-0.5">
            Справка / Заметка преподавателя:
          </span>
          <p className="font-serif text-xs text-[#1A1A1A] font-medium leading-relaxed">
            {teacherReferenceNotes}
          </p>
        </div>
      )}

      {/* Student commentary if available */}
      {showCommentary && studentSelection?.commentaryRu && (
        <div className="p-2.5 bg-white border border-[#E5E1DA] rounded text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#8C7D6B] block">
            Комментарий / Перевод ученика:
          </span>
          <p className="italic text-[#1A1A1A] bg-[#FAF8F5] p-2 rounded border border-[#E5E1DA]/60">
            «{studentSelection.commentaryRu}»
          </p>
        </div>
      )}
    </div>
  );
};
