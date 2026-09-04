const fs = require('fs');
let file = fs.readFileSync('src/data/johnGospelVocabulary.ts', 'utf-8');

// I will overwrite JOHN_CHAPTER_2_WORDS_RAW to include 'greek' field
const rawWords = `export const JOHN_CHAPTER_2_WORDS_RAW = [
  { lemma: 'τρίτος', greek: 'τρίτῃ', translation: 'третий', frequency: 46, verseRef: 'Ин 2:1' },
  { lemma: 'γάμος', greek: 'γάμος / γάμον', translation: 'брак, свадьба', frequency: 17, verseRef: 'Ин 2:1' },
  { lemma: 'ὑστερέω', greek: 'ὑστερήσαντος', translation: 'нуждаюсь, терплю недостаток, кончаюсь', frequency: 16, verseRef: 'Ин 2:3' },
  { lemma: 'οὔπω', greek: 'οὔπω', translation: 'ещё не', frequency: 28, verseRef: 'Ин 2:4' },
  { lemma: 'ἥκω', greek: 'ἥκει', translation: 'пришел, настал', frequency: 26, verseRef: 'Ин 2:4' },
  { lemma: 'διάκονος', greek: 'διακόνοις', translation: 'слуга, служитель', frequency: 28, verseRef: 'Ин 2:5' },
  { lemma: 'λίθινος', greek: 'λίθιναι', translation: 'каменный', frequency: 3, verseRef: 'Ин 2:6' },
  { lemma: 'ὑδρία', greek: 'ὑδρίαι / ὑδρίας', translation: 'сосуд для воды, водонос', frequency: 3, verseRef: 'Ин 2:6' },
  { lemma: 'ἓξ', greek: 'ἓξ', translation: 'шесть', frequency: 13, verseRef: 'Ин 2:6' },
  { lemma: 'καθαρισμός', greek: 'καθαρισμὸν', translation: 'очищение, обряд очищения', frequency: 7, verseRef: 'Ин 2:6' },
  { lemma: 'κεῖμαι', greek: 'κείμεναι', translation: 'лежу, нахожусь, стою', frequency: 24, verseRef: 'Ин 2:6' },
  { lemma: 'χωρέω', greek: 'χωροῦσαι', translation: 'вмещаю, держу в себе', frequency: 10, verseRef: 'Ин 2:6' },
  { lemma: 'μετρητής', greek: 'μετρητὰς', translation: 'метрет (мера объема ~39 л)', frequency: 1, verseRef: 'Ин 2:6' },
  { lemma: 'γεμίζω', greek: 'γεμίσατε / ἐγέμισαν', translation: 'наполняю', frequency: 8, verseRef: 'Ин 2:7' },
  { lemma: 'ἄνω', greek: 'ἕως ἄνω', translation: 'вверх; доверху', frequency: 9, verseRef: 'Ин 2:7' },
  { lemma: 'ἀντλέω', greek: 'ἀντλήσατε / ἠντληκότες', translation: 'черпаю, наливаю', frequency: 4, verseRef: 'Ин 2:8' },
  { lemma: 'ἀρχιτρίκλινος', greek: 'ἀρχιτρικλίνῳ / ἀρχιτρίκλινος', translation: 'распорядитель пира', frequency: 3, verseRef: 'Ин 2:8' },
  { lemma: 'γεύομαι', greek: 'ἐγεύσατο', translation: 'вкушаю, пробую на вкус', frequency: 15, verseRef: 'Ин 2:9' },
  { lemma: 'πόθεν', greek: 'πόθεν', translation: 'откуда?', frequency: 28, verseRef: 'Ин 2:9' },
  { lemma: 'νυμφίος', greek: 'νυμφίον', translation: 'жених', frequency: 17, verseRef: 'Ин 2:9' },
  { lemma: 'μεθύσκω', greek: 'μεθυσθῶσιν', translation: 'напиваюсь, упиваюсь', frequency: 5, verseRef: 'Ин 2:10' },
  { lemma: 'ἐλάσσων', greek: 'ἐλάσσω', translation: 'худший, меньший', frequency: 4, verseRef: 'Ин 2:10' },
  { lemma: 'πάσχα', greek: 'πάσχα', translation: 'пасха', frequency: 29, verseRef: 'Ин 2:13' },
  { lemma: 'ἐγγύς', greek: 'ἐγγύς', translation: 'близко', frequency: 33, verseRef: 'Ин 2:13' },
  { lemma: 'βοῦς', greek: 'βόας', translation: 'вол, бык, скот', frequency: 8, verseRef: 'Ин 2:14' },
  { lemma: 'πρόβατον', greek: 'πρόβατα', translation: 'овца', frequency: 39, verseRef: 'Ин 2:14' },
  { lemma: 'περιστερά', greek: 'περιστεράς', translation: 'голубь', frequency: 10, verseRef: 'Ин 2:14' },
  { lemma: 'κερματιστής', greek: 'κερματιστὰς', translation: 'меняла мелких денег', frequency: 1, verseRef: 'Ин 2:14' },
  { lemma: 'φραγέλλιον', greek: 'φραγέλλιον', translation: 'бич, плеть', frequency: 1, verseRef: 'Ин 2:15' },
  { lemma: 'σχοινίον', greek: 'σχοινίων', translation: 'веревка, шнур', frequency: 2, verseRef: 'Ин 2:15' },
  { lemma: 'ἐκχέω', greek: 'ἐξέχεεν', translation: 'изливаю, рассыпаю', frequency: 16, verseRef: 'Ин 2:15' },
  { lemma: 'κέρμα', greek: 'κέρμα', translation: 'монета, мелкие деньги', frequency: 1, verseRef: 'Ин 2:15' },
  { lemma: 'τράπεζα', greek: 'τραπέζας', translation: 'стол, трапеза', frequency: 15, verseRef: 'Ин 2:15' },
  { lemma: 'ἀνατρέπω', greek: 'ἀνέτρεψεν', translation: 'опрокидываю', frequency: 3, verseRef: 'Ин 2:15' },
  { lemma: 'κολλυβιστής', greek: 'κολλυβιστῶν', translation: 'меняла денег', frequency: 3, verseRef: 'Ин 2:15' },
  { lemma: 'ἐμπόριον', greek: 'ἐμπορίου', translation: 'торговля, дом торговли', frequency: 1, verseRef: 'Ин 2:16' },
  { lemma: 'μνημονεύω', greek: 'ἐμνήσθησαν', translation: 'помню, вспоминаю', frequency: 21, verseRef: 'Ин 2:17' },
  { lemma: 'ζῆλος', greek: 'ζῆλος', translation: 'ревность, рвение', frequency: 16, verseRef: 'Ин 2:17' },
  { lemma: 'κατεσθίω', greek: 'καταφάγεταί', translation: 'съедаю, поглощаю', frequency: 15, verseRef: 'Ин 2:17' },
  { lemma: 'τεσσαράκοντα', greek: 'τεσσεράκοντα', translation: 'сорок', frequency: 21, verseRef: 'Ин 2:20' },
  { lemma: 'οἰκοδομέω', greek: 'οἰκοδομήθη', translation: 'строю, воздвигаю', frequency: 40, verseRef: 'Ин 2:20' },
  { lemma: 'χρεία', greek: 'χρείαν', translation: 'нужда, потребность', frequency: 49, verseRef: 'Ин 2:25' },
];`;

file = file.replace(/export const JOHN_CHAPTER_2_WORDS_RAW = \[\s+.*?(?=function convertRawToWord)/s, rawWords + '\n\n');

// Also add greek field to JOHN_CHAPTER_1_WORDS_RAW to prevent typescript error if we change type
file = file.replace(/lemma: '스코τία'/g, "lemma: '스코τία'"); // just a regex trick not to break it
file = file.replace(/lemma: '(.*?)',/g, "lemma: '$1', greek: '$1',");

// now let's change convertRawToWord signature to expect greek
// wait, we can just use item.greek || item.lemma
file = file.replace(
  'greek: item.lemma,',
  'greek: (item as any).greek || item.lemma,'
);
// Also highlightWord should be item.greek || item.lemma
file = file.replace(
  'highlightWord: item.lemma,',
  'highlightWord: (item as any).greek || item.lemma,'
);

fs.writeFileSync('src/data/johnGospelVocabulary.ts', file);
