const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf-8');

const handlersCode = `      <StudentProfileModal
        student={currentStudent}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdateSettings={handleUpdateStudentSettings}
        onUpdateProfile={handleUpdateStudentProfile}
        onDelete={() => {
          setStudents((prev) => prev.filter((s) => s.id !== currentStudent.id));
          if (students.length > 1) {
            const nextStudent = students.find((s) => s.id !== currentStudent.id);
            if (nextStudent) setCurrentStudentId(nextStudent.id);
          } else {
            // Need at least one student, so we reset to initial state if last one is deleted
            setStudents([{
              id: 'student_1',
              name: 'Новый ученик',
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
            }]);
            setCurrentStudentId('student_1');
          }
          setIsProfileModalOpen(false);
        }}
        onResetProgress={() => {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === currentStudent.id
                ? {
                    ...s,
                    xp: 0,
                    streakDays: 0,
                    accuracyRate: 0,
                    masteredWordsCount: 0,
                    completedLessons: [],
                    completedChunks: {},
                    wordsForReview: [],
                    assignedHomework: s.assignedHomework.map(hw => ({ ...hw, completed: false, scorePercent: 0 })),
                    wordMastery: {},
                    recentMistakes: [],
                    sessionAttempts: [],
                  }
                : s
            )
          );
          setIsProfileModalOpen(false);
        }}
      />`;

file = file.replace(
  /<StudentProfileModal[\s\S]*?\/>/,
  handlersCode
);

fs.writeFileSync('src/App.tsx', file);
