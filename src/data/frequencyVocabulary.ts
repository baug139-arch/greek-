import { GreekWord } from '../types';
import { FrequencyTierGroup, FrequencyTierItem } from './freqTierTypes';
import { FREQUENCY_TIERS_PART_1 } from './frequencyDataPart1';
import { FREQUENCY_TIERS_PART_2 } from './frequencyDataPart2';
import { FREQUENCY_TIERS_PART_3 } from './frequencyDataPart3';
import { convertGreekToErasmianPhonetics } from '../utils/audio';
import { getMnemonicForWord } from '../utils/mnemonics';

export * from './freqTierTypes';

// Combine all 35 frequency tiers from document
export const ALL_FREQUENCY_TIERS: FrequencyTierGroup[] = [
  ...FREQUENCY_TIERS_PART_1,
  ...FREQUENCY_TIERS_PART_2,
  ...FREQUENCY_TIERS_PART_3,
];

/**
 * Converts a FrequencyTierItem into a full GreekWord object
 * compatible with DuolingoEngine, Audio, Teacher Dashboard, and Student Hub.
 */
export function convertTierItemToGreekWord(item: FrequencyTierItem): GreekWord {
  // Extract base greek lemma (without article/endings if present)
  const parts = item.greek.split(',');
  const lemma = parts[0].trim();
  const article = parts.length > 2 ? parts[2].trim() : parts.length > 1 && (parts[1].trim() === 'ὁ' || parts[1].trim() === 'ἡ' || parts[1].trim() === 'τό') ? parts[1].trim() : undefined;

  const transliteration = convertGreekToErasmianPhonetics(lemma);
  const mnemonic = getMnemonicForWord({ greek: item.greek, lemma, translationRu: item.translationRu });

  return {
    id: item.id,
    greek: item.greek,
    lemma: lemma,
    article: article,
    transliterationRu: transliteration,
    erasmianIpa: transliteration,
    partOfSpeech: 'noun',
    translationRu: item.translationRu,
    additionalMeaningsRu: [item.translationRu],
    ntFrequency: item.count,
    frequencyCategory: item.count >= 500 ? '>500' : item.count >= 200 ? '200-500' : item.count >= 100 ? '100-200' : item.count >= 50 ? '50-100' : item.count >= 20 ? '20-50' : item.count >= 10 ? '10-20' : '<10',
    thematicGroup: 'theology_church',
    thematicGroupNameRu: 'Богословие и Церковь',
    chapters: ['john_1'],
    exampleVerse: {
      reference: `Частота: ${item.frequencyLabel} (${item.count} раз в НЗ)`,
      greekText: item.greek,
      translationRu: item.translationRu,
      highlightWord: lemma,
    },
    erasmianNotes: 'Эразмово произношение: классическая артикуляция дифтонгов и согласных (β = б, η = э, θ = тх)',
    mnemonicRu: mnemonic,
  };
}

/**
 * Get all words across all 35 tiers as GreekWord objects
 */
export const FREQUENCY_ALL_WORDS: GreekWord[] = ALL_FREQUENCY_TIERS.flatMap(tier =>
  tier.items.map(convertTierItemToGreekWord)
);

/**
 * Get words for a specific frequency tier ID
 */
export function getWordsByTierId(tierId: string): GreekWord[] {
  const tier = ALL_FREQUENCY_TIERS.find(t => t.id === tierId);
  if (!tier) return [];
  return tier.items.map(convertTierItemToGreekWord);
}
