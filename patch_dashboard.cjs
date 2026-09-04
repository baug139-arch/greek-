const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

// Add Exam option in Assignment Modal
code = code.replace(
  /<option value="practice">Тренировка \(микс\)<\/option>/g,
  `<option value="practice">Тренировка (микс)</option>
                <option value="exam">Контрольная работа (только письмо)</option>`
);

code = code.replace(
  /const \[assignmentMode, setAssignmentMode\] = useState<TrainingMode \| 'all'>\('all'\);/g,
  `const [assignmentMode, setAssignmentMode] = useState<TrainingMode | 'all'>('all');
  const [assignmentType, setAssignmentType] = useState<'practice' | 'exam'>('practice');
  const [examWordCount, setExamWordCount] = useState<number>(20);`
);

code = code.replace(
  /onAssignHomework\(\{\n\s*title: `Задание:\s*\$\{assignmentTargetId\}`,\n\s*mode: assignmentSource,\n\s*targetId: assignmentTargetId,\n\s*assignedDate: new Date\(\)\.toISOString\(\),\n\s*dueDate: assignmentDueDate,\n\s*xpReward: 50,\n\s*trainingMode: assignmentMode === 'all' \? undefined : assignmentMode,\n\s*direction: assignmentDirection === 'mix' \? undefined : assignmentDirection\n\s*\}, assignmentStudentId\);/g,
  `onAssignHomework({
      title: \`Задание: \${assignmentTargetId}\`,
      mode: assignmentSource,
      targetId: assignmentTargetId,
      assignedDate: new Date().toISOString(),
      dueDate: assignmentDueDate || null,
      xpReward: assignmentType === 'exam' ? 100 : 50,
      trainingMode: assignmentMode === 'all' ? undefined : assignmentMode,
      direction: assignmentDirection === 'mix' ? undefined : assignmentDirection,
      assignmentType: assignmentType,
      examConfig: assignmentType === 'exam' ? { wordCount: examWordCount } : undefined,
      teacherGradeStatus: assignmentType === 'exam' ? 'pending' : undefined
    }, assignmentStudentId);`
);

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
