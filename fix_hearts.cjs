const fs = require('fs');
let file = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

file = file.replace(/&& hearts > 0/g, "");

fs.writeFileSync('src/components/DuolingoEngine.tsx', file);
