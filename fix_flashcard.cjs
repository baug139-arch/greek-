const fs = require('fs');
let file = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

file = file.replace(
  "  const handleCheckAnswer = () => {\n    if (!currentEx) return;\n\n    let correct = false;",
  "  const handleCheckAnswer = () => {\n    if (!currentEx) return;\n\n    if (currentEx.type === 'flashcard') {\n      setIsCorrect(true);\n      setIsAnswerChecked(true);\n      return;\n    }\n\n    let correct = false;"
);

fs.writeFileSync('src/components/DuolingoEngine.tsx', file);
