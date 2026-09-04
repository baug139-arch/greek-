const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const tWords = `words={(() => {
                // Generate random words from morphology DB based on config
                let pool = MORPHOLOGY_DATABASE;
                const config = activeMorphologySession ? activeMorphologySession.morphologyConfig : { targetPos: activeFreeMorphology, wordCount: 10 };
                
                if (config) {
                  if (config.targetPos === 'mistakes') {
                    const activeStudent = students.find(s => s.id === currentStudentId);
                    const mistakes = activeStudent?.morphologyMistakes || [];
                    pool = pool.filter(w => mistakes.includes(w.id));
                  } else if (config.targetPos === 'noun') {
                    pool = pool.filter(w => w.pos === 'noun');
                  } else if (config.targetPos === 'verb') {
                    pool = pool.filter(w => w.pos === 'verb');
                  } else if (config.targetPos === 'adjective') {
                    pool = pool.filter(w => w.pos === 'adjective');
                  }
                }
                
                let count = config?.wordCount || 10;
                if (config?.targetPos === 'mistakes') {
                  count = Math.min(pool.length, 15);
                }
                
                // Proper Fisher-Yates shuffle for maximum randomness
                const shuffled = [...pool];
                for (let i = shuffled.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                return shuffled.slice(0, count);
              })()}`;

const rWords = `words={useMemo(() => {
                // Generate random words from morphology DB based on config
                let pool = MORPHOLOGY_DATABASE;
                const config = activeMorphologySession ? activeMorphologySession.morphologyConfig : { targetPos: activeFreeMorphology, wordCount: 10 };
                
                if (config) {
                  if (config.targetPos === 'mistakes') {
                    const activeStudent = students.find(s => s.id === currentStudentId);
                    const mistakes = activeStudent?.morphologyMistakes || [];
                    pool = pool.filter(w => mistakes.includes(w.id));
                  } else if (config.targetPos === 'noun') {
                    pool = pool.filter(w => w.pos === 'noun');
                  } else if (config.targetPos === 'verb') {
                    pool = pool.filter(w => w.pos === 'verb');
                  } else if (config.targetPos === 'adjective') {
                    pool = pool.filter(w => w.pos === 'adjective');
                  }
                }
                
                let count = config?.wordCount || 10;
                if (config?.targetPos === 'mistakes') {
                  count = Math.min(pool.length, 15);
                }
                
                // Proper Fisher-Yates shuffle for maximum randomness
                const shuffled = [...pool];
                for (let i = shuffled.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                return shuffled.slice(0, count);
              }, [activeMorphologySession, activeFreeMorphology, currentStudentId])}`;

if (code.includes(tWords)) {
  code = code.replace(tWords, rWords);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Patched App.tsx useMemo');
} else {
  console.log('Failed to patch App.tsx, target not found');
}
