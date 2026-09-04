const fs = require('fs');
let file = fs.readFileSync('src/components/StudentProfileModal.tsx', 'utf-8');

const newFooter = `        <footer className="p-4 border-t border-[#E5E1DA] bg-[#F9F7F2] flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Вы уверены, что хотите обнулить прогресс? Это действие необратимо.')) {
                  onResetProgress();
                }
              }}
              className="px-4 py-2 bg-white border border-[#9E3B3B] text-[#9E3B3B] hover:bg-[#9E3B3B] hover:text-white text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer"
            >
              Сбросить прогресс
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Вы уверены, что хотите удалить ученика? Это действие необратимо.')) {
                  onDelete();
                }
              }}
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
        </footer>`;

file = file.replace(
  /<footer className="p-4 border-t border-\[#E5E1DA\] bg-\[#F9F7F2\] flex justify-between items-center">[\s\S]*?<\/footer>/,
  newFooter
);

file = file.replace(
  "export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({\n  student,\n  isOpen,\n  onClose,\n  onUpdateSettings,\n  onUpdateProfile,\n}) => {",
  "export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({\n  student,\n  isOpen,\n  onClose,\n  onUpdateSettings,\n  onUpdateProfile,\n  onDelete,\n  onResetProgress,\n}) => {"
);

fs.writeFileSync('src/components/StudentProfileModal.tsx', file);
