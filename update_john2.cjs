const fs = require('fs');
const file = fs.readFileSync('src/data/johnGospelVocabulary.ts', 'utf-8');

const rawWords = `export const JOHN_CHAPTER_2_WORDS_RAW = [
  { lemma: 'τρίτος', translation: 'третий', frequency: 46, verseRef: 'Ин 2:1' },
  { lemma: 'γάμος', translation: 'брак, свадьба', frequency: 17, verseRef: 'Ин 2:1' },
  { lemma: 'ὑστερέω', translation: 'нуждаюсь, терплю недостаток, кончаюсь', frequency: 16, verseRef: 'Ин 2:3' },
  { lemma: 'οὔπω', translation: 'ещё не', frequency: 28, verseRef: 'Ин 2:4' },
  { lemma: 'ἥκω', translation: 'пришел, настал', frequency: 26, verseRef: 'Ин 2:4' },
  { lemma: 'διάκονος', translation: 'слуга, служитель', frequency: 28, verseRef: 'Ин 2:5' },
  { lemma: 'λίθινος', translation: 'каменный', frequency: 3, verseRef: 'Ин 2:6' },
  { lemma: 'ὑδρία', translation: 'сосуд для воды, водонос', frequency: 3, verseRef: 'Ин 2:6' },
  { lemma: 'ἓξ', translation: 'шесть', frequency: 13, verseRef: 'Ин 2:6' },
  { lemma: 'καθαρισμός', translation: 'очищение, обряд очищения', frequency: 7, verseRef: 'Ин 2:6' },
  { lemma: 'κεῖμαι', translation: 'лежу, нахожусь, стою', frequency: 24, verseRef: 'Ин 2:6' },
  { lemma: 'χωρέω', translation: 'вмещаю, держу в себе', frequency: 10, verseRef: 'Ин 2:6' },
  { lemma: 'μετρητής', translation: 'метрет (мера объема ~39 л)', frequency: 1, verseRef: 'Ин 2:6' },
  { lemma: 'γεμίζω', translation: 'наполняю', frequency: 8, verseRef: 'Ин 2:7' },
  { lemma: 'ἄνω', translation: 'вверх; доверху', frequency: 9, verseRef: 'Ин 2:7' },
  { lemma: 'ἀντλέω', translation: 'черпаю, наливаю', frequency: 4, verseRef: 'Ин 2:8' },
  { lemma: 'ἀρχιτρίκλινος', translation: 'распорядитель пира', frequency: 3, verseRef: 'Ин 2:8' },
  { lemma: 'γεύομαι', translation: 'вкушаю, пробую на вкус', frequency: 15, verseRef: 'Ин 2:9' },
  { lemma: 'πόθεν', translation: 'откуда?', frequency: 28, verseRef: 'Ин 2:9' },
  { lemma: 'νυμφίος', translation: 'жених', frequency: 17, verseRef: 'Ин 2:9' },
  { lemma: 'μεθύσκω', translation: 'напиваюсь, упиваюсь', frequency: 5, verseRef: 'Ин 2:10' },
  { lemma: 'ἐλάσσων', translation: 'худший, меньший', frequency: 4, verseRef: 'Ин 2:10' },
  { lemma: 'πάσχα', translation: 'пасха', frequency: 29, verseRef: 'Ин 2:13' },
  { lemma: 'ἐγγύς', translation: 'близко', frequency: 33, verseRef: 'Ин 2:13' },
  { lemma: 'βοῦς', translation: 'вол, бык, скот', frequency: 8, verseRef: 'Ин 2:14' },
  { lemma: 'πρόβατον', translation: 'овца', frequency: 39, verseRef: 'Ин 2:14' },
  { lemma: 'περιστερά', translation: 'голубь', frequency: 10, verseRef: 'Ин 2:14' },
  { lemma: 'κερματιστής', translation: 'меняла мелких денег', frequency: 1, verseRef: 'Ин 2:14' },
  { lemma: 'φραγέλλιον', translation: 'бич, плеть', frequency: 1, verseRef: 'Ин 2:15' },
  { lemma: 'σχοινίον', translation: 'веревка, шнур', frequency: 2, verseRef: 'Ин 2:15' },
  { lemma: 'ἐκχέω', translation: 'изливаю, рассыпаю', frequency: 16, verseRef: 'Ин 2:15' },
  { lemma: 'κέρμα', translation: 'монета, мелкие деньги', frequency: 1, verseRef: 'Ин 2:15' },
  { lemma: 'τράπεζα', translation: 'стол, трапеза', frequency: 15, verseRef: 'Ин 2:15' },
  { lemma: 'ἀνατρέπω', translation: 'опрокидываю', frequency: 3, verseRef: 'Ин 2:15' },
  { lemma: 'κολλυβιστής', translation: 'меняла денег', frequency: 3, verseRef: 'Ин 2:15' },
  { lemma: 'ἐμπόριον', translation: 'торговля, дом торговли', frequency: 1, verseRef: 'Ин 2:16' },
  { lemma: 'μνημονεύω', translation: 'помню, вспоминаю', frequency: 21, verseRef: 'Ин 2:17' },
  { lemma: 'ζῆλος', translation: 'ревность, рвение', frequency: 16, verseRef: 'Ин 2:17' },
  { lemma: 'κατεσθίω', translation: 'съедаю, поглощаю', frequency: 15, verseRef: 'Ин 2:17' },
  { lemma: 'τεσσαράκοντα', translation: 'сорок', frequency: 21, verseRef: 'Ин 2:20' },
  { lemma: 'οἰκοδομέω', translation: 'строю, воздвигаю', frequency: 40, verseRef: 'Ин 2:20' },
  { lemma: 'χρεία', translation: 'нужда, потребность', frequency: 49, verseRef: 'Ин 2:25' },
];`;

let newContent = file.replace(
  'function convertRawToWord',
  rawWords + '\n\nfunction convertRawToWord'
);

newContent = newContent.replace(
  "chapters: ['john_1']",
  "chapters: [`john_${item.verseRef.split(' ')[1].split(':')[0]}`]"
);

// We should update the mapping in JOHN_GOSPEL_CHAPTERS
newContent = newContent.replace(
  `...Array.from({ length: 20 }, (_, i) => {
    const chapterNum = i + 2;
    return {
      chapterId: \`john_\${chapterNum}\`,
      chapterNumber: chapterNum,
      bookTitleRu: 'Евангелие от Иоанна',
      chapterTitleRu: \`Слова для Иоанна \${chapterNum}\`,
      descriptionRu: \`Слова для чтения \${chapterNum}-й главы Евангелия от Иоанна. Ожидаются данные.\`,
      words: [] as GreekWord[],
    };
  }),`,
  `{
    chapterId: 'john_2',
    chapterNumber: 2,
    bookTitleRu: 'Евангелие от Иоанна',
    chapterTitleRu: 'Слова для Иоанна 2',
    descriptionRu: '42 ключевых слова для чтения второй главы Евангелия от Иоанна.',
    words: JOHN_CHAPTER_2_WORDS_RAW.map(convertRawToWord),
  },
  ...Array.from({ length: 19 }, (_, i) => {
    const chapterNum = i + 3;
    return {
      chapterId: \`john_\${chapterNum}\`,
      chapterNumber: chapterNum,
      bookTitleRu: 'Евангелие от Иоанна',
      chapterTitleRu: \`Слова для Иоанна \${chapterNum}\`,
      descriptionRu: \`Слова для чтения \${chapterNum}-й главы Евангелия от Иоанна. Ожидаются данные.\`,
      words: [] as GreekWord[],
    };
  }),`
);

fs.writeFileSync('src/data/johnGospelVocabulary.ts', newContent);
