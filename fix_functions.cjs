const fs = require('fs');
let file = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

const missingFunctions = `
  const handleSwitchModeAndDirection = (m: TrainingMode, d: TrainingDirection) => {
    setCurrentMode(m);
    setCurrentDirection(d);
  };

  const handleGreekSelect = (greek: string) => {
    if (selectedGreek === greek) {
      setSelectedGreek(null);
      return;
    }
    setSelectedGreek(greek);
    
    if (selectedRussian) {
      const pair = currentEx.pairs?.find(p => p.greek === greek && p.translation === selectedRussian);
      if (pair) {
        if (soundEffects) playSuccessChime();
        setMatchedPairs(prev => {
          const next = [...prev, pair.greek];
          if (next.length === currentEx.pairs?.length) {
             setIsCorrect(true);
             setIsAnswerChecked(true);
          }
          return next;
        });
        setSelectedGreek(null);
        setSelectedRussian(null);
      } else {
        if (soundEffects) playErrorChime();
        setHearts((prev) => Math.max(0, prev - 1));
        setSelectedGreek(null);
        setSelectedRussian(null);
      }
    }
  };

  const handleRussianSelect = (russian: string) => {
    if (selectedRussian === russian) {
      setSelectedRussian(null);
      return;
    }
    setSelectedRussian(russian);
    
    if (selectedGreek) {
      const pair = currentEx.pairs?.find(p => p.greek === selectedGreek && p.translation === russian);
      if (pair) {
        if (soundEffects) playSuccessChime();
        setMatchedPairs(prev => {
          const next = [...prev, pair.greek];
          if (next.length === currentEx.pairs?.length) {
             setIsCorrect(true);
             setIsAnswerChecked(true);
          }
          return next;
        });
        setSelectedGreek(null);
        setSelectedRussian(null);
      } else {
        if (soundEffects) playErrorChime();
        setHearts((prev) => Math.max(0, prev - 1));
        setSelectedGreek(null);
        setSelectedRussian(null);
      }
    }
  };

  const handleCheckAnswer = () => {
    if (!currentEx) return;

    let correct = false;
    let givenAnswer = '';

    if (currentEx.type === 'multiple_choice' || currentEx.type === 'reverse_choice' || currentEx.type === 'audio_quiz') {
      correct = selectedOption === currentEx.correctAnswer;
      givenAnswer = selectedOption || '';
    } else if (currentEx.type === 'typing_input') {
      const normalize = (str: string) => str.toLowerCase().trim().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
      correct = normalize(typedInput) === normalize(currentEx.correctAnswer);
      givenAnswer = typedInput;
    } else if (currentEx.type === 'word_builder') {
      const builtWord = selectedLetters.map((l) => l.char).join('');
      const normalize = (str: string) => str.toLowerCase().trim().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
      correct = normalize(builtWord) === normalize(currentEx.correctAnswer);
      givenAnswer = builtWord;
    } else if (currentEx.type === 'match_pairs') {
      correct = matchedPairs.length === (currentEx.pairs?.length || 0);
    }

    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      if (soundEffects) playSuccessChime();
      setXpEarned((prev) => prev + 5);
    } else {
      if (soundEffects) playErrorChime();
      if (currentEx.word) {
        setMistakesList((prev) => {
          if (!prev.some(m => m.word.id === currentEx.word.id)) {
             return [...prev, { word: currentEx.word, given: givenAnswer }];
          }
          return prev;
        });
      }
      setHearts((prev) => Math.max(0, prev - 1));
    }
  };
`;

file = file.replace(
  "  if (!currentEx && !isFinished && !isChunkFinished) {",
  missingFunctions + "\n  if (!currentEx && !isFinished && !isChunkFinished) {"
);

fs.writeFileSync('src/components/DuolingoEngine.tsx', file);
