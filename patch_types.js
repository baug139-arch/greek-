const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  /export interface HomeworkAssignment \{[\s\S]*?gradedDate\?: string;\s*\}/,
  `export interface ExamAnswer {
  wordId: string;
  wordGreek: string;
  correctAnswerRu: string;
  studentAnswer: string;
  teacherMark?: 'full' | 'half' | 'zero';
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  mode: 'frequency' | 'thematic' | 'contextual_reader' | 'custom_list';
  assignmentType: 'practice' | 'exam';
  examConfig?: { wordCount: number };
  examAnswers?: ExamAnswer[];
  trainingMode?: TrainingMode;
  direction?: TrainingDirection;
  targetId: string;
  assignedDate: string;
  dueDate: string | null;
  completed: boolean;
  scorePercent?: number;
  xpReward: number;
  teacherFeedback?: string;
  teacherGrade?: number;
  teacherGradeStatus?: 'pending' | 'graded' | 'passed' | 'revision' | 'excellent';
  gradedDate?: string;
}`
);

fs.writeFileSync('src/types.ts', code);
