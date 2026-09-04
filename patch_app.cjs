const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const tType = `const [activeFreeMorphology, setActiveFreeMorphology] = useState<'all' | 'noun' | 'verb' | 'mistakes' | null>(null);`;
const rType = `const [activeFreeMorphology, setActiveFreeMorphology] = useState<'all' | 'noun' | 'verb' | 'adjective' | 'mistakes' | null>(null);`;

code = code.replace(tType, rType);

const tTitle = `activeFreeMorphology === 'noun' ? 'Существительные' : activeFreeMorphology === 'verb' ? 'Глаголы' : activeFreeMorphology === 'mistakes' ? 'Работа над ошибками' : 'Микс'}`;
const rTitle = `activeFreeMorphology === 'noun' ? 'Существительные' : activeFreeMorphology === 'verb' ? 'Глаголы' : activeFreeMorphology === 'adjective' ? 'Прилагательные' : activeFreeMorphology === 'mistakes' ? 'Работа над ошибками' : 'Микс'}`;

code = code.replace(tTitle, rTitle);

const tFilter = `                  } else if (config.targetPos === 'verb') {
                    pool = pool.filter(w => w.pos === 'verb');
                  }`;
const rFilter = `                  } else if (config.targetPos === 'verb') {
                    pool = pool.filter(w => w.pos === 'verb');
                  } else if (config.targetPos === 'adjective') {
                    pool = pool.filter(w => w.pos === 'adjective');
                  }`;

code = code.replace(tFilter, rFilter);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx');
