export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function checkAnswerFlexible(input: string, currentEx: any): { isCorrect: boolean; typoWarning?: string } {
  if (!input || !input.trim()) return { isCorrect: false };

  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove greek accents
    .replace(/ё/g, 'е')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()«»"]/g, "") // remove punctuation
    .replace(/\s{2,}/g, " "); // remove extra spaces

  const cleanInput = normalize(input);

  let validAnswers: string[] = [currentEx.correctAnswer];

  // Add synonyms from word dictionary
  if (currentEx.word) {
    if (currentEx.direction === 'greek_to_ru') {
      validAnswers.push(currentEx.word.translationRu);
      if (currentEx.word.additionalMeaningsRu) {
        validAnswers.push(...currentEx.word.additionalMeaningsRu);
      }
    } else if (currentEx.direction === 'ru_to_greek') {
      validAnswers.push(currentEx.word.greek);
    }
  }

  // Clean up lists (split comma-separated meanings into individual acceptable answers)
  if (currentEx.direction === 'greek_to_ru') {
    validAnswers = validAnswers.flatMap(ans => ans.split(',').map(s => s.trim()));
  }

  // Filter out empty and normalize valid answers
  validAnswers = validAnswers.filter(ans => Boolean(ans));

  for (const ans of validAnswers) {
    const cleanAns = normalize(ans);
    if (!cleanAns) continue;

    // Exact match after normalization
    if (cleanInput === cleanAns) {
      return { isCorrect: true };
    }

    // Fuzzy match for Typos (Levenshtein distance)
    // Only apply typo forgiveness for words/phrases of sufficient length
    const distance = levenshteinDistance(cleanInput, cleanAns);
    
    // Max typos allowed based on length
    const allowedTypos = cleanAns.length >= 8 ? 2 : cleanAns.length >= 5 ? 1 : 0;

    if (distance <= allowedTypos) {
      return {
        isCorrect: true,
        typoWarning: `Опечатка! Правильно: ${ans}`
      };
    }
  }

  return { isCorrect: false };
}
