const fs = require('fs');
let file = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

// Update word_builder in 'builder' mode
file = file.replace(
  "          correctAnswer: w.greek,\n          letters: createLettersForWord(w.greek),",
  "          correctAnswer: w.lemma || w.greek,\n          letters: createLettersForWord(w.lemma || w.greek),"
);

// Update typing in 'typing' mode (ru_to_greek)
file = file.replace(
  "            direction: 'ru_to_greek',\n            promptRu: `Напечатайте по-гречески: «${w.translationRu}»`,\n            correctAnswer: w.greek,",
  "            direction: 'ru_to_greek',\n            promptRu: `Напечатайте по-гречески: «${w.translationRu}»`,\n            correctAnswer: w.lemma || w.greek,"
);

// Update all_word_builder in 'all' mode
file = file.replace(
  "          promptRu: `Этап 3: Конструктор. Соберите греческое слово: «${w.translationRu}»`,\n          correctAnswer: w.greek,\n          letters: createLettersForWord(w.greek),",
  "          promptRu: `Этап 3: Конструктор. Соберите греческое слово: «${w.translationRu}»`,\n          correctAnswer: w.lemma || w.greek,\n          letters: createLettersForWord(w.lemma || w.greek),"
);

fs.writeFileSync('src/components/DuolingoEngine.tsx', file);
