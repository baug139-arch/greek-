const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf-8');

const newButton = `          </div>

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                const name = window.prompt('Введите имя нового ученика:');
                if (name && name.trim()) {
                  const newStudent = {
                    id: \`student_\${Date.now()}\`,
                    name: name.trim(),
                    greekAlias: 'Νέος Μαθητής',
                    avatar: '👨‍🎓',
                    xp: 0,
                    streakDays: 0,
                    lastActive: new Date().toISOString().split('T')[0],
                    accuracyRate: 0,
                    masteredWordsCount: 0,
                    completedLessons: [],
                    assignedHomework: [],
                    wordMastery: {},
                    recentMistakes: [],
                    sessionAttempts: [],
                    settings: {
                      preferredLearningMode: 'frequency',
                      audioSpeed: 0.82,
                      voiceEngine: 'latin_phonetic',
                      dailyWordGoal: 10,
                      batchSize: 8,
                      showTransliteration: true,
                      showPhoneticIpa: true,
                      greekFontSize: 'normal',
                      soundEffectsEnabled: true,
                      autoPlayAudio: true,
                    },
                  };
                  setStudents(prev => [...prev, newStudent]);
                  setCurrentStudentId(newStudent.id);
                  setCurrentRole('student');
                  setActiveSession(null);
                  setIsSidebarOpen(false);
                }
              }}
              disabled={students.length >= 10}
              className="w-full py-2 border border-[#E5E1DA] border-dashed text-[#8C7D6B] hover:text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-white text-xs font-sans uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
            >
              + Добавить ученика
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#E5E1DA]">`;

file = file.replace(
  "          </div>\n\n          <div className=\"mt-4 pt-4 border-t border-[#E5E1DA]\">",
  newButton
);

fs.writeFileSync('src/App.tsx', file);
