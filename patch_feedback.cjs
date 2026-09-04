const fs = require('fs');
let code = fs.readFileSync('src/components/MorphologyRunner.tsx', 'utf8');

const tVerb = `<p><strong>Морфология:</strong> {TENSES.find(t => t.value === currentWord.tense)?.label}, {VOICES.find(v => v.value === currentWord.voice)?.label}, {MOODS.find(m => m.value === currentWord.mood)?.label}, {PERSONS.find(p => p.value === currentWord.person)?.label}, {NUMBERS.find(n => n.value === currentWord.number)?.label} число.</p>`;

const rVerb = `<p><strong>Морфология:</strong> {TENSES.find(t => t.value === currentWord.tense)?.label}, {
                    Array.isArray(currentWord.voice) 
                    ? currentWord.voice.map(v => VOICES.find(x => x.value === v)?.label).join(' / ') 
                    : VOICES.find(v => v.value === currentWord.voice)?.label
                  }, {MOODS.find(m => m.value === currentWord.mood)?.label}{currentWord.person ? \`, \${PERSONS.find(p => p.value === currentWord.person)?.label}\` : ''}{currentWord.number ? \`, \${NUMBERS.find(n => n.value === currentWord.number)?.label} число\` : ''}.</p>`;

const tPart = `<p><strong>Морфология:</strong> {TENSES.find(t => t.value === currentWord.tense)?.label}, {VOICES.find(v => v.value === currentWord.voice)?.label}, {NOUN_CASES.find(c => c.value === (Array.isArray(currentWord.case) ? currentWord.case[0] : currentWord.case))?.label} падеж, {NUMBERS.find(n => n.value === (Array.isArray(currentWord.number) ? currentWord.number[0] : currentWord.number))?.label} число, {GENDERS.find(g => g.value === (Array.isArray(currentWord.gender) ? currentWord.gender[0] : currentWord.gender))?.label} род.</p>`;

const rPart = `<p><strong>Морфология:</strong> {TENSES.find(t => t.value === currentWord.tense)?.label}, {
                    Array.isArray(currentWord.voice) 
                    ? currentWord.voice.map(v => VOICES.find(x => x.value === v)?.label).join(' / ') 
                    : VOICES.find(v => v.value === currentWord.voice)?.label
                  }, {NOUN_CASES.find(c => c.value === (Array.isArray(currentWord.case) ? currentWord.case[0] : currentWord.case))?.label} падеж, {NUMBERS.find(n => n.value === (Array.isArray(currentWord.number) ? currentWord.number[0] : currentWord.number))?.label} число, {GENDERS.find(g => g.value === (Array.isArray(currentWord.gender) ? currentWord.gender[0] : currentWord.gender))?.label} род.</p>`;

if (code.includes(tVerb)) {
  code = code.replace(tVerb, rVerb);
  code = code.replace(tPart, rPart);
  fs.writeFileSync('src/components/MorphologyRunner.tsx', code);
  console.log('Successfully patched morphology runner feedback strings');
} else {
  console.log('Could not find target strings to patch');
}
