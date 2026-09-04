const fs = require('fs');
let file = fs.readFileSync('src/data/johnGospelVocabulary.ts', 'utf-8');

// I will overwrite JOHN_CHAPTER_2_WORDS_RAW to keep the exact form in a 'textForm' field
const rawWords = `export const JOHN_CHAPTER_2_WORDS_RAW = [
  { lemma: 'τρίτος', textForm: 'τρίτῃ', translation: 'третий', frequency: 46, verseRef: 'Ин 2:1' },
  { lemma: 'γάμος', textForm: 'γάμος / γάμον', translation: 'брак, свадьба', frequency: 17, verseRef: 'Ин 2:1' },
  { lemma: 'ὑστερέω', textForm: 'ὑστερήσαντος', translation: 'нуждаюсь, терплю недостаток, кончаюсь', frequency: 16, verseRef: 'Ин 2:3' },
  { lemma: 'οὔπω', textForm: 'οὔπω', translation: 'ещё не', frequency: 28, verseRef: 'Ин 2:4' },
  { lemma: 'ἥκω', textForm: 'ἥκει', translation: 'пришел, настал', frequency: 26, verseRef: 'Ин 2:4' },
  { lemma: 'διάκονος', textForm: 'διακόνοις', translation: 'слуга, служитель', frequency: 28, verseRef: 'Ин 2:5' },
  { lemma: 'λίθινος', textForm: 'λίθιναι', translation: 'каменный', frequency: 3, verseRef: 'Ин 2:6' },
  { lemma: 'ὑδρία', textForm: 'ὑδρίαι / ὑδρίας', translation: 'сосуд для воды, водонос', frequency: 3, verseRef: 'Ин 2:6' },
  { lemma: 'ἓξ', textForm: 'ἓξ', translation: 'шесть', frequency: 13, verseRef: 'Ин 2:6' },
  { lemma: 'καθαρισμός', textForm: 'καθαρισμὸν', translation: 'очищение, обряд очищения', frequency: 7, verseRef: 'Ин 2:6' },
  { lemma: 'κεῖμαι', textForm: 'κείμεναι', translation: 'лежу, нахожусь, стою', frequency: 24, verseRef: 'Ин 2:6' },
  { lemma: 'χωρέω', textForm: 'χωροῦσαι', translation: 'вмещаю, держу в себе', frequency: 10, verseRef: 'Ин 2:6' },
  { lemma: 'μετρητής', textForm: 'μετρητὰς', translation: 'метрет (мера объема ~39 л)', frequency: 1, verseRef: 'Ин 2:6' },
  { lemma: 'γεμίζω', textForm: 'γεμίσατε / ἐγέμισαν', translation: 'наполняю', frequency: 8, verseRef: 'Ин 2:7' },
  { lemma: 'ἄνω', textForm: 'ἕως ἄνω', translation: 'вверх; доверху', frequency: 9, verseRef: 'Ин 2:7' },
  { lemma: 'ἀντλέω', textForm: 'ἀντλήσατε / ἠντληκότες', translation: 'черпаю, наливаю', frequency: 4, verseRef: 'Ин 2:8' },
  { lemma: 'ἀρχιτρίκλινος', textForm: 'ἀρχιτρικλίνῳ / ἀρχιτρίκλινος', translation: 'распорядитель пира', frequency: 3, verseRef: 'Ин 2:8' },
  { lemma: 'γεύομαι', textForm: 'ἐγεύσατο', translation: 'вкушаю, пробую на вкус', frequency: 15, verseRef: 'Ин 2:9' },
  { lemma: 'πόθεν', textForm: 'πόθεν', translation: 'откуда?', frequency: 28, verseRef: 'Ин 2:9' },
  { lemma: 'νυμφίος', textForm: 'νυμφίον', translation: 'жених', frequency: 17, verseRef: 'Ин 2:9' },
  { lemma: 'μεθύσκω', textForm: 'μεθυσθῶσιν', translation: 'напиваюсь, упиваюсь', frequency: 5, verseRef: 'Ин 2:10' },
  { lemma: 'ἐλάσσων', textForm: 'ἐλάσσω', translation: 'худший, меньший', frequency: 4, verseRef: 'Ин 2:10' },
  { lemma: 'πάσχα', textForm: 'πάσχα', translation: 'пасха', frequency: 29, verseRef: 'Ин 2:13' },
  { lemma: 'ἐγγύς', textForm: 'ἐγγύς', translation: 'близко', frequency: 33, verseRef: 'Ин 2:13' },
  { lemma: 'βοῦς', textForm: 'βόας', translation: 'вол, бык, скот', frequency: 8, verseRef: 'Ин 2:14' },
  { lemma: 'πρόβατον', textForm: 'πρόβατα', translation: 'овца', frequency: 39, verseRef: 'Ин 2:14' },
  { lemma: 'περιστερά', textForm: 'περιστεράς', translation: 'голубь', frequency: 10, verseRef: 'Ин 2:14' },
  { lemma: 'κερματιστής', textForm: 'κερματιστὰς', translation: 'меняла мелких денег', frequency: 1, verseRef: 'Ин 2:14' },
  { lemma: 'φραγέλλιον', textForm: 'φραγέλλιον', translation: 'бич, плеть', frequency: 1, verseRef: 'Ин 2:15' },
  { lemma: 'σχοινίον', textForm: 'σχοινίων', translation: 'веревка, шнур', frequency: 2, verseRef: 'Ин 2:15' },
  { lemma: 'ἐκχέω', textForm: 'ἐξέχεεν', translation: 'изливаю, рассыпаю', frequency: 16, verseRef: 'Ин 2:15' },
  { lemma: 'κέρμα', textForm: 'κέρμα', translation: 'монета, мелкие деньги', frequency: 1, verseRef: 'Ин 2:15' },
  { lemma: 'τράπεζα', textForm: 'τραπέζας', translation: 'стол, трапеза', frequency: 15, verseRef: 'Ин 2:15' },
  { lemma: 'ἀνατρέπω', textForm: 'ἀνέτρεψεν', translation: 'опрокидываю', frequency: 3, verseRef: 'Ин 2:15' },
  { lemma: 'κολλυβιστής', textForm: 'κολλυβιστῶν', translation: 'меняла денег', frequency: 3, verseRef: 'Ин 2:15' },
  { lemma: 'ἐμπόριον', textForm: 'ἐμπορίου', translation: 'торговля, дом торговли', frequency: 1, verseRef: 'Ин 2:16' },
  { lemma: 'μνημονεύω', textForm: 'ἐμνήσθησαν', translation: 'помню, вспоминаю', frequency: 21, verseRef: 'Ин 2:17' },
  { lemma: 'ζῆλος', textForm: 'ζῆλος', translation: 'ревность, рвение', frequency: 16, verseRef: 'Ин 2:17' },
  { lemma: 'κατεσθίω', textForm: 'καταφάγεταί', translation: 'съедаю, поглощаю', frequency: 15, verseRef: 'Ин 2:17' },
  { lemma: 'τεσσαράκοντα', textForm: 'τεσσεράκοντα', translation: 'сорок', frequency: 21, verseRef: 'Ин 2:20' },
  { lemma: 'οἰκοδομέω', textForm: 'οἰκοδομήθη', translation: 'строю, воздвигаю', frequency: 40, verseRef: 'Ин 2:20' },
  { lemma: 'χρεία', textForm: 'χρείαν', translation: 'нужда, потребность', frequency: 49, verseRef: 'Ин 2:25' },
];`;

file = file.replace(/export const JOHN_CHAPTER_2_WORDS_RAW = \[\s+.*?(?=function convertRawToWord)/s, rawWords + '\n\n');

// Restore JOHN_CHAPTER_1_WORDS_RAW
file = file.replace(/greek: '[^']+', /g, '');

// Fix convertRawToWord
file = file.replace(/const greekForm = \(item as any\).greek \|\| item\.lemma;/g, 'const greekForm = item.lemma;');
file = file.replace(/greekText: greekForm,/g, "greekText: (item as any).textForm ? `Форма в тексте: ${(item as any).textForm}` : item.lemma,");

fs.writeFileSync('src/data/johnGospelVocabulary.ts', file);
