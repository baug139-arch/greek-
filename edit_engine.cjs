const fs = require('fs');
let file = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

// 1. Add "match" mode check
const matchModeCode = `
    // =========================================================================
    // MODE 6: MATCH PAIRS (Сопоставление)
    // =========================================================================
    else if (mode === 'match') {
      if (pool.length >= 2) {
        for (let i = 0; i < pool.length; i += 5) {
          const chunk = pool.slice(i, i + 5);
          if (chunk.length >= 2) {
            generated.push({
              id: \`pairs_batch_\${i}\`,
              type: 'match_pairs',
              promptRu: 'Соедините греческие слова с их русским переводом',
              correctAnswer: 'all_matched',
              pairs: chunk.map((w) => ({
                greek: w.greek,
                translation: w.translationRu,
              })),
            });
          }
        }
      } else {
        // Fallback to flashcards if not enough words for matching
        pool.forEach((w, idx) => {
          generated.push({
            id: \`fc_fallback_\${idx}_\${w.id}\`,
            type: 'flashcard',
            word: w,
            promptRu: 'Недостаточно слов для сопоставления. Ознакомьтесь с карточкой.',
            correctAnswer: w.translationRu,
            flashcardSide: 'greek_first',
          });
        });
      }
    }
`;

file = file.replace(
  "    // MODE 6: ALL COMBINED (Сбалансированный микс)",
  matchModeCode + "\n    // =========================================================================\n    // MODE 7: ALL COMBINED (Сбалансированный микс)"
);

// 2. Change the order in ALL COMBINED
const oldAllCombinedRegex = /\/\/ MODE 7: ALL COMBINED \(Сбалансированный микс\).*?else \{.*?(?=\/\/ Next Question or Next Chunk)/s;

const newAllCombined = `// MODE 7: ALL COMBINED (Сбалансированный микс)
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

      // 2. Multiple choice for all (Тест)
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
            promptRu: 'Этап 2: Тест. Выберите правильный русский перевод',
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
            promptRu: \`Этап 2: Тест. Как пишется по-гречески: «\${w.translationRu}»?\`,
            options: allOptions,
            correctAnswer: w.greek,
          });
        }
      });

      // 3. Word Letter Builder for all (Greek) (Конструктор)
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

      // 4. Typing Input for all (Russian) (Письмо)
      pool.forEach((w, idx) => {
        generated.push({
          id: \`all_typing_\${idx}_\${w.id}\`,
          type: 'typing_input',
          word: w,
          direction: 'greek_to_ru', // As requested: Письмо - на русском
          promptRu: \`Этап 4: Письмо. Введите русский перевод слова\`,
          correctAnswer: w.translationRu,
          hint: \`Греческое слово: \${w.greek} (\${w.transliterationRu})\`,
        });
      });

      // 5. Audio listening for all (Аудио)
      pool.forEach((w, idx) => {
        const audioDistractors = pool
          .filter((item) => item.id !== w.id)
          .map((item) => item.translationRu)
          .slice(0, 3);
        generated.push({
          id: \`all_audio_\${idx}_\${w.id}\`,
          type: 'audio_quiz',
          word: w,
          promptRu: 'Этап 5: Восприятие на слух (Эразмово чтение)',
          options: [w.translationRu, ...audioDistractors].sort(() => Math.random() - 0.5),
          correctAnswer: w.translationRu,
        });
      });

      // 6. Match Pairs for the whole pool in chunks to finish the block
      if (pool.length >= 4) {
        for (let i = 0; i < pool.length; i += 5) {
          const chunk = pool.slice(i, i + 5);
          if (chunk.length >= 2) {
            generated.push({
              id: \`all_pairs_batch_\${i}\`,
              type: 'match_pairs',
              promptRu: 'Итоговое закрепление: соедините слова с переводом',
              correctAnswer: 'all_matched',
              pairs: chunk.map((w) => ({
                greek: w.greek,
                translation: w.translationRu,
              })),
            });
          }
        }
      }
    }

    return generated;
  };

  `;

file = file.replace(oldAllCombinedRegex, newAllCombined);

fs.writeFileSync('src/components/DuolingoEngine.tsx', file);
