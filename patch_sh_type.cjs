const fs = require('fs');
let code = fs.readFileSync('src/components/StudentHub.tsx', 'utf8');

const tType = `onStartFreeMorphology?: (pos: 'all' | 'noun' | 'verb' | 'mistakes') => void;`;
const rType = `onStartFreeMorphology?: (pos: 'all' | 'noun' | 'verb' | 'adjective' | 'mistakes') => void;`;

if (code.includes(tType)) {
  code = code.replace(tType, rType);
  fs.writeFileSync('src/components/StudentHub.tsx', code);
  console.log('Patched StudentHub type');
} else {
  console.log('Failed to patch StudentHub type');
}
