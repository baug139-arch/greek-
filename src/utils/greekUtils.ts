/**
 * Normalization utilities for Greek and Russian input validation
 * 
 * - Strips all Greek diacritics (acute, grave, circumflex, rough/smooth breathings, iota subscript, diaeresis)
 * - Normalizes sigma variants (ς -> σ)
 * - Normalizes Russian text (lowercase, replaces ё with е, ignores punctuation, allows any valid synonym or phrase)
 */

/**
 * Strips all diacritics and accents from Ancient / Koine Greek text
 */
export function stripGreekAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    // Remove all combining diacritical marks (Unicode range U+0300 - U+036F)
    .replace(/[\u0300-\u036F]/g, '')
    // Also remove specific Greek combining marks if any remain
    .replace(/[\u1F00-\u1FFF]/g, (char) => {
      // Decompose precomposed Greek polytonic characters
      return char.normalize('NFD').replace(/[\u0300-\u036F]/g, '');
    })
    .toLowerCase()
    // Convert final sigma ς to regular sigma σ for comparison
    .replace(/ς/g, 'σ')
    .trim();
}

/**
 * Normalizes Russian string: lowercase, ё -> е, removes punctuation and extra spaces
 */
export function normalizeRussian(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»""''`’()\[\]{}–—\-]/g, ' ')
    .replace(/[,\.;:!?/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleans and tokenizes Russian text into array of base words/synonyms
 */
export function extractRussianKeywords(str: string): string[] {
  if (!str) return [];
  // Split on commas, semicolons, slashes, brackets or 'или'
  const segments = str
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"()]/g, ' ')
    .split(/[,;\/\–\—\-]|\s+или\s+|\s+т\.е\.\s+/);

  const keywords: string[] = [];

  for (const seg of segments) {
    const trimmed = seg
      .trim()
      .replace(/^тот\s+же|^то\s+же|^так\s+же/i, '')
      .replace(/[,\.;:!?]/g, '')
      .trim();
    if (trimmed) {
      if (!keywords.includes(trimmed)) {
        keywords.push(trimmed);
      }
      // Also add individual words inside the segment if it's a short phrase (e.g. "раскидываю шатер" -> "раскидываю", "шатер")
      const words = trimmed.split(/\s+/).filter((w) => w.length > 2);
      for (const w of words) {
        if (!keywords.includes(w)) {
          keywords.push(w);
        }
      }
    }
  }

  return keywords;
}

/**
 * Checks if user input matches expected Greek text (ignoring accents, breathings, cases, final sigmas)
 */
export function matchGreekInput(input: string, expected: string): boolean {
  const cleanInput = stripGreekAccents(input).replace(/[,\.\s;:·!«»—\-_]/g, '');
  const cleanExpected = stripGreekAccents(expected).replace(/[,\.\s;:·!«»—\-_]/g, '');

  if (!cleanInput || !cleanExpected) return false;
  
  if (cleanInput === cleanExpected) return true;

  // Also check if expected contains article or comma (e.g. "λόγος, -ου, ὁ" -> "логос")
  const expectedParts = expected.split(',').map((p) => stripGreekAccents(p.trim()).replace(/[,\.\s;:·!«»—\-_]/g, ''));
  if (expectedParts.includes(cleanInput)) return true;

  const firstPart = stripGreekAccents(expected.split(/[,(\s]/)[0]).replace(/[,\.\s;:·!«»—\-_]/g, '');
  if (cleanInput === firstPart) return true;

  return false;
}

/**
 * Checks if user input in Russian matches at least ONE synonym/word in the answer.
 * Handles variations like:
 * - "еще" vs "всё ещё" vs "даже" vs "еще, все еще"
 * - ё/е equivalence
 * - Case-insensitivity & punctuation insensitivity
 * - Comma-separated or multiple user synonyms
 */
export function matchRussianInput(input: string, expectedRu: string, additionalMeanings: string[] = []): boolean {
  const normalizedInput = normalizeRussian(input);
  if (!normalizedInput) return false;

  const allPossibleTargets = [expectedRu, ...additionalMeanings];
  const targetKeywords = allPossibleTargets.flatMap(extractRussianKeywords);

  // 1. Direct exact normalized match with the full expected string
  const normalizedExpected = normalizeRussian(expectedRu);
  if (normalizedInput === normalizedExpected) return true;

  // 2. Exact match with any extracted target synonym/keyword
  if (targetKeywords.some((k) => k === normalizedInput)) return true;

  // 3. User might have entered multiple comma-separated synonyms (e.g. "Еще, все еще")
  const userSubSegments = input
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[,;\/\–\—\-]|\s+или\s+/)
    .map((s) => s.replace(/[«»""''`’()\[\]{}–—\-,.;:!?]/g, '').trim())
    .filter(Boolean);

  for (const userSeg of userSubSegments) {
    if (targetKeywords.some((k) => k === userSeg)) {
      return true;
    }
  }

  // 4. Check partial phrase inclusion
  for (const kw of targetKeywords) {
    if (normalizedInput === kw) return true;
    if (kw.length >= 3 && normalizedInput.length >= 3) {
      // e.g. "все еще" vs "еще"
      if (normalizedInput.includes(kw) || kw.includes(normalizedInput)) {
        return true;
      }
      // Root-level match (first 4-5 characters)
      if (kw.length >= 4 && normalizedInput.length >= 4) {
        if (
          normalizedInput.startsWith(kw.slice(0, Math.min(kw.length, 5))) ||
          kw.startsWith(normalizedInput.slice(0, Math.min(normalizedInput.length, 5)))
        ) {
          return true;
        }
      }
    }
  }

  // 5. Check if any individual words from user input match any target keyword
  const userWords = normalizedInput.split(/\s+/).filter((w) => w.length > 2);
  for (const uw of userWords) {
    if (
      targetKeywords.some(
        (kw) =>
          kw === uw ||
          (kw.length >= 4 && kw.startsWith(uw.slice(0, 4))) ||
          (uw.length >= 4 && uw.startsWith(kw.slice(0, 4)))
      )
    ) {
      return true;
    }
  }

  return false;
}
