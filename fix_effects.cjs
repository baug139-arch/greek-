const fs = require('fs');
let file = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

const useEffectsCode = `
  useEffect(() => {
    const generated = generateExercisesForPool(currentChunkWords, currentMode, currentDirection);
    setExercises(generated);
    setCurrentIndex(0);
    setIsFinished(false);
    setIsChunkFinished(false);
    setMistakesList([]);
    setHearts(3);
    setXpEarned(0);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setSelectedOption(null);
    setTypedInput('');
    setIsCardFlipped(false);
    setSelectedLetters([]);
    setAvailableLetters([]);
    setMatchedPairs([]);
    setSelectedGreek(null);
    setSelectedRussian(null);
  }, [currentChunkWords, currentMode, currentDirection]);

  useEffect(() => {
    if (!currentEx) return;

    setIsAnswerChecked(false);
    setIsCorrect(false);
    setSelectedOption(null);
    setTypedInput('');
    setIsCardFlipped(false);
    setSelectedLetters([]);
    setSelectedGreek(null);
    setSelectedRussian(null);
    setMatchedPairs([]);

    if (currentEx.type === 'word_builder' && currentEx.letters) {
      setAvailableLetters([...currentEx.letters].sort(() => Math.random() - 0.5));
    }
    
    if (currentEx.type === 'match_pairs' && currentEx.pairs) {
      const gList = currentEx.pairs.map(p => p.greek).sort(() => Math.random() - 0.5);
      const rList = currentEx.pairs.map(p => p.translation).sort(() => Math.random() - 0.5);
      setPairOptions({ greekList: gList, russianList: rList });
    }

    if (autoPlay && currentEx.word && (currentEx.type === 'audio_quiz' || currentEx.type === 'flashcard')) {
      speakErasmian(currentEx.word.greek, audioSpeed, voiceEngine);
    }
  }, [currentEx, autoPlay, audioSpeed, voiceEngine]);
`;

file = file.replace(
  "  const currentEx = exercises[currentIndex];\n\n  // Next Question or Next Chunk or Finish Session",
  "  const currentEx = exercises[currentIndex];\n\n" + useEffectsCode + "\n  // Next Question or Next Chunk or Finish Session"
);

fs.writeFileSync('src/components/DuolingoEngine.tsx', file);
