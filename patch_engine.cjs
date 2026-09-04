const fs = require('fs');
let code = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf8');

// Disable immediate feedback if we are in exam mode
code = code.replace(
  /const isAnswerChecked = /g,
  'const isAnswerChecked = '
);

fs.writeFileSync('src/components/DuolingoEngine.tsx', code);
