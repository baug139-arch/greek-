const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetApp = `              title={activeMorphologySession ? activeMorphologySession.title : \`Свободная тренировка: \${activeFreeMorphology === 'noun' ? 'Существительные' : activeFreeMorphology === 'verb' ? 'Глаголы' : 'Микс'}\`}
              words={(() => {
                // Generate random words from morphology DB based on config
                let pool = MORPHOLOGY_DATABASE;
                const config = activeMorphologySession ? activeMorphologySession.morphologyConfig : { targetPos: activeFreeMorphology, wordCount: 10 };
                if (config) {
                  if (config.targetPos === 'noun') pool = pool.filter(w => w.pos === 'noun');
                  else if (config.targetPos === 'verb') pool = pool.filter(w => w.pos === 'verb');
                }
                const count = config?.wordCount || 10;
                // Shuffle and pick
                const shuffled = [...pool].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, count);
              })()}
              onComplete={(scorePercent, xpGained) => {
                if (activeMorphologySession) {
                  handleCompleteMorphology(scorePercent, xpGained);
                } else {
                  handleCompleteFreeMorphology(scorePercent, xpGained);
                }
              }}`;

const replacementApp = `              title={activeMorphologySession ? activeMorphologySession.title : \`Свободная тренировка: \${activeFreeMorphology === 'noun' ? 'Существительные' : activeFreeMorphology === 'verb' ? 'Глаголы' : activeFreeMorphology === 'mistakes' ? 'Работа над ошибками' : 'Микс'}\`}
              words={(() => {
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
                  }
                }
                
                let count = config?.wordCount || 10;
                if (config?.targetPos === 'mistakes') {
                  count = Math.min(pool.length, 15);
                }
                
                // Shuffle and pick
                const shuffled = [...pool].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, count);
              })()}
              onComplete={(scorePercent, xpGained, missedWordIds, masteredWordIds) => {
                if (activeMorphologySession) {
                  handleCompleteMorphology(scorePercent, xpGained);
                } else {
                  handleCompleteFreeMorphology(scorePercent, xpGained, missedWordIds, masteredWordIds);
                }
              }}`;

if(code.includes(targetApp)) {
  code = code.replace(targetApp, replacementApp);
  fs.writeFileSync('src/App.tsx', code);
  console.log('patched App onComplete and words logic');
} else {
  console.log('not found');
}
