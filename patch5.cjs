const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `const [activeFreeMorphology, setActiveFreeMorphology] = useState<'all' | 'noun' | 'verb' | null>(null);`;
const replacement = `const [activeFreeMorphology, setActiveFreeMorphology] = useState<'all' | 'noun' | 'verb' | 'mistakes' | null>(null);`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log('patched free morph state');
} else {
  console.log('not found');
}
