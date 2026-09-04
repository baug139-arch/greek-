const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

// Insert the new controls into the modal
code = code.replace(
  /<div className="space-y-4">\s*<div>\s*<label className="block text-sm font-bold text-\[\#1A1A1A\] mb-1">Кому назначить\?<\/label>/,
  `<div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-1">Тип задания</label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value as 'practice' | 'exam')}
                className="w-full border-2 border-[#1A1A1A] rounded p-2 bg-white"
              >
                <option value="practice">Тренировка (микс)</option>
                <option value="exam">Контрольная работа (только письмо)</option>
              </select>
            </div>
            
            {assignmentType === 'exam' && (
              <div>
                <label className="block text-sm font-bold text-[#1A1A1A] mb-1">Количество слов в контрольной</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={examWordCount}
                  onChange={(e) => setExamWordCount(parseInt(e.target.value) || 20)}
                  className="w-full border-2 border-[#1A1A1A] rounded p-2 bg-white"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-[#1A1A1A] mb-1">Кому назначить?</label>`
);

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
