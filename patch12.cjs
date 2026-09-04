const fs = require('fs');
let code = fs.readFileSync('src/components/MorphologyRunner.tsx', 'utf8');

const targetMap = `  const CATEGORY_MAP: Record<string, { label: string, options: any[] }> = {
    pos: { label: 'Часть речи', options: POS_OPTIONS },
    case: { label: 'Падеж', options: NOUN_CASES },
    number: { label: 'Число', options: NUMBERS },
    gender: { label: 'Род', options: GENDERS },
    tense: { label: 'Время', options: TENSES },
    voice: { label: 'Залог', options: VOICES },
    mood: { label: 'Наклонение', options: MOODS },
    person: { label: 'Лицо', options: PERSONS }
  };`;

const replacementMap = `  const PERSON_NUMBERS = [
    { value: '1sg', label: '1-е лицо, ед.ч.' },
    { value: '2sg', label: '2-е лицо, ед.ч.' },
    { value: '3sg', label: '3-е лицо, ед.ч.' },
    { value: '1pl', label: '1-е лицо, мн.ч.' },
    { value: '2pl', label: '2-е лицо, мн.ч.' },
    { value: '3pl', label: '3-е лицо, мн.ч.' },
  ];

  const CATEGORY_MAP: Record<string, { label: string, options: any[] }> = {
    pos: { label: 'Часть речи', options: POS_OPTIONS },
    case: { label: 'Падеж', options: NOUN_CASES },
    number: { label: 'Число', options: NUMBERS },
    gender: { label: 'Род', options: GENDERS },
    tense: { label: 'Время', options: TENSES },
    voice: { label: 'Залог', options: VOICES },
    mood: { label: 'Наклонение', options: MOODS },
    person: { label: 'Лицо', options: PERSONS },
    personNumber: { label: 'Лицо и число', options: PERSON_NUMBERS }
  };`;

if(code.includes(targetMap)) {
  code = code.replace(targetMap, replacementMap);
  fs.writeFileSync('src/components/MorphologyRunner.tsx', code);
  console.log('patched CATEGORY_MAP');
} else {
  console.log('not found CATEGORY_MAP');
}
