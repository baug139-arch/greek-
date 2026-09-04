const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const handleCompleteMorphology = (scorePercent: number, xpGained: number) => {
    if (!activeMorphologySession) return;
    
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== currentStudentId) return st;

        const assignmentId = activeMorphologySession.id;
        
        const updatedHomework = (st.assignedHomework || []).map((hw) => {
          if (hw.id === assignmentId) {
            return {
              ...hw,
              completed: true,
              scorePercent: scorePercent,
            };
          }
          return hw;
        });

        const updatedStudent: Student = {
          ...st,
          xp: st.xp + xpGained,
          assignedHomework: updatedHomework,
          lastActive: 'Только что',
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
    
    setActiveMorphologySession(null);
  };`;

const replacement = `  const handleCompleteMorphology = (scorePercent: number, xpGained: number, missedWordIds: string[] = [], masteredWordIds: string[] = []) => {
    if (!activeMorphologySession) return;
    
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id !== currentStudentId) return st;

        const assignmentId = activeMorphologySession.id;
        
        const updatedHomework = (st.assignedHomework || []).map((hw) => {
          if (hw.id === assignmentId) {
            return {
              ...hw,
              completed: true,
              scorePercent: scorePercent,
            };
          }
          return hw;
        });

        const newMorphologyMistakes = new Set(st.morphologyMistakes || []);
        missedWordIds.forEach(id => newMorphologyMistakes.add(id));
        masteredWordIds.forEach(id => newMorphologyMistakes.delete(id));

        const updatedStudent: Student = {
          ...st,
          xp: st.xp + xpGained,
          assignedHomework: updatedHomework,
          lastActive: 'Только что',
          morphologyMistakes: Array.from(newMorphologyMistakes),
        };
        saveStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
    
    setActiveMorphologySession(null);
  };`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log('patched morph');
} else {
  console.log('not found');
}

