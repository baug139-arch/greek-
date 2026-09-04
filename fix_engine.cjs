const fs = require('fs');
let content = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

// Replace MODE 6 logic
const oldMode6 = /\/\/ MODE 6: ALL COMBINED \(Сбалансированный микс\).*?else \{.*?pool\.forEach\(\(w, idx\) => \{.*?\}\);(.*?)if \(pool\.length >= 4\) \{/s;

const newMode6 = `// MODE 6: ALL COMBINED (Сбалансированный микс)
    // =========================================================================
    else {
      // 1. Flashcards for all
      pool.forEach((w, idx) => {
        generated.push({
          id: \`all_fc_\${idx}_\${w.id}\`,
          type: 'flashcard',
          word: w,
          promptRu: 'Этап 1: Ознакомление со словом и произношением',
          correctAnswer: w.translationRu,
          flashcardSide: 'greek_first',
        });
      });

      // 2. Multiple choice for all
      pool.forEach((w, idx) => {
        if (direction === 'greek_to_ru' || (direction === 'bidirectional' && idx % 2 === 0)) {
          const distractors = pool
            .filter((item) => item.id !== w.id)
            .map((item) => item.translationRu)
            .slice(0, 3);
          const allOptions = [w.translationRu, ...distractors].sort(() => Math.random() - 0.5);

          generated.push({
            id: \`all_mc_\${idx}_\${w.id}\`,
            type: 'multiple_choice',
            word: w,
            promptRu: 'Этап 2: Выберите правильный русский перевод',
            options: allOptions,
            correctAnswer: w.translationRu,
          });
        } else {
          const distractors = pool
            .filter((item) => item.id !== w.id)
            .map((item) => item.greek)
            .slice(0, 3);
          const allOptions = [w.greek, ...distractors].sort(() => Math.random() - 0.5);

          generated.push({
            id: \`all_rev_\${idx}_\${w.id}\`,
            type: 'reverse_choice',
            word: w,
            promptRu: \`Этап 2: Как пишется по-гречески: «\${w.translationRu}»?\`,
            options: allOptions,
            correctAnswer: w.greek,
          });
        }
      });

      // 3. Word Letter Builder for all (Greek)
      pool.forEach((w, idx) => {
        generated.push({
          id: \`all_word_builder_\${idx}_\${w.id}\`,
          type: 'word_builder',
          word: w,
          promptRu: \`Этап 3: Конструктор. Соберите греческое слово: «\${w.translationRu}»\`,
          correctAnswer: w.greek,
          letters: createLettersForWord(w.greek),
          hint: \`Греческое слово: [\${w.transliterationRu}] — «\${w.translationRu}»\`,
        });
      });

      // 4. Audio listening for all
      pool.forEach((w, idx) => {
        const audioDistractors = pool
          .filter((item) => item.id !== w.id)
          .map((item) => item.translationRu)
          .slice(0, 3);
        generated.push({
          id: \`all_audio_\${idx}_\${w.id}\`,
          type: 'audio_quiz',
          word: w,
          promptRu: 'Этап 4: Восприятие на слух (Эразмово чтение)',
          options: [w.translationRu, ...audioDistractors].sort(() => Math.random() - 0.5),
          correctAnswer: w.translationRu,
        });
      });

      // 5. Typing Input for all (Russian)
      pool.forEach((w, idx) => {
        generated.push({
          id: \`all_typing_\${idx}_\${w.id}\`,
          type: 'typing_input',
          word: w,
          direction: 'greek_to_ru', // As requested: Письмо - на русском
          promptRu: \`Этап 5: Письмо. Введите русский перевод слова\`,
          correctAnswer: w.translationRu,
          hint: \`Греческое слово: \${w.greek} (\${w.transliterationRu})\`,
        });
      });

      // 6. Match Pairs for the whole pool in chunks to finish the block
      if (pool.length >= 4) {`;

content = content.replace(oldMode6, newMode6);

// Modify handleNext to repeat incorrect exercises
const oldHandleNext = `  // Next Question or Next Chunk or Finish Session
  const handleNext = () => {
    if (currentIndex + 1 < exercises.length && hearts > 0) {
      setCurrentIndex((prev) => prev + 1);`;

const newHandleNext = `  // Next Question or Next Chunk or Finish Session
  const handleNext = () => {
    // If the answer was incorrect (and it's not a flashcard), append this exercise to the end to repeat it
    let newLength = exercises.length;
    if (!isCorrect && currentEx.type !== 'flashcard') {
      const retryEx = { ...currentEx, id: \`\${currentEx.id}_retry_\${Date.now()}\` };
      setExercises((prev) => [...prev, retryEx]);
      newLength++;
    }

    if (currentIndex + 1 < newLength && hearts > 0) {
      setCurrentIndex((prev) => prev + 1);`;

content = content.replace(oldHandleNext, newHandleNext);

fs.writeFileSync('src/components/DuolingoEngine.tsx', content);
