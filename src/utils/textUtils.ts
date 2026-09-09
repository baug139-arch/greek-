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

  // Clean up lists: preserve the full original phrases AND add individual comma-separated meanings
  if (currentEx.direction === 'greek_to_ru') {
    const splitParts = validAnswers.flatMap(ans => ans.split(/[,;\/]/).map(s => s.trim()));
    validAnswers = [...validAnswers, ...splitParts];

    // Expand verb forms with/without pronoun 'я' (e.g., 'я ухожу' <-> 'ухожу')
    const pronounVariants: string[] = [];
    for (const ans of validAnswers) {
      const trimmed = ans.trim();
      if (/^я\s+/i.test(trimmed)) {
        pronounVariants.push(trimmed.replace(/^я\s+/i, ''));
      } else if (trimmed && !trimmed.includes(' ')) {
        pronounVariants.push(`я ${trimmed}`);
      }
    }
    validAnswers = [...validAnswers, ...pronounVariants];
  }

  // Filter out empty and normalize valid answers
  validAnswers = validAnswers.filter(ans => Boolean(ans));

  const stripPronoun = (s: string) => s.replace(/^я\s+/, '').trim();
  const cleanInputNoPronoun = stripPronoun(cleanInput);

  for (const ans of validAnswers) {
    const cleanAns = normalize(ans);
    if (!cleanAns) continue;
    const cleanAnsNoPronoun = stripPronoun(cleanAns);

    // Exact match after normalization (or with/without 'я')
    if (cleanInput === cleanAns || cleanInputNoPronoun === cleanAnsNoPronoun) {
      return { isCorrect: true };
    }

    // Fuzzy match for Typos (Levenshtein distance)
    // Compare both raw cleaned and without pronoun
    const distanceRaw = levenshteinDistance(cleanInput, cleanAns);
    const distanceNoPronoun = levenshteinDistance(cleanInputNoPronoun, cleanAnsNoPronoun);
    const distance = Math.min(distanceRaw, distanceNoPronoun);
    
    // Max typos allowed based on length
    const effectiveTarget = cleanInputNoPronoun.length < cleanAnsNoPronoun.length ? cleanAnsNoPronoun : cleanAns;
    const allowedTypos = effectiveTarget.length >= 8 ? 2 : effectiveTarget.length >= 5 ? 1 : 0;

    if (distance <= allowedTypos) {
      return {
        isCorrect: true,
        typoWarning: `Опечатка! Правильно: ${ans}`
      };
    }
  }

  // Also check if student entered multiple terms (e.g. separated by commas) that are all valid sub-meanings
  if (currentEx.direction === 'greek_to_ru') {
    const inputParts = input.split(/[,;\/]/).map(p => normalize(p)).filter(Boolean);
    if (inputParts.length > 1) {
      const normalizedAcceptableParts = new Set(
        validAnswers.flatMap(ans => ans.split(/[,;\/]/).map(s => normalize(s)).filter(Boolean))
      );
      const allPartsValid = inputParts.every(part => {
        const partNoPronoun = stripPronoun(part);
        if (normalizedAcceptableParts.has(part) || normalizedAcceptableParts.has(partNoPronoun)) return true;
        return Array.from(normalizedAcceptableParts).some(target => {
          const targetNoPronoun = stripPronoun(target);
          const d = Math.min(
            levenshteinDistance(part, target),
            levenshteinDistance(partNoPronoun, targetNoPronoun)
          );
          const allowed = targetNoPronoun.length >= 8 ? 2 : targetNoPronoun.length >= 5 ? 1 : 0;
          return d <= allowed;
        });
      });
      if (allPartsValid) {
        return { isCorrect: true };
      }
    }
  }

  return { isCorrect: false };
}
