const fs = require('fs');
let code = fs.readFileSync('src/components/StudentHub.tsx', 'utf8');

const target = `onStartFreeMorphology?: (pos: 'all' | 'noun' | 'verb') => void;`;
const replacement = `onStartFreeMorphology?: (pos: 'all' | 'noun' | 'verb' | 'mistakes') => void;`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/StudentHub.tsx', code);
  console.log('patched hub props');
} else {
  console.log('not found');
}
