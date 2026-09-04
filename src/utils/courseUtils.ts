import { GreekWord, TeacherCustomList, HomeworkAssignment, SelectedModuleInfo } from '../types';
import { THEMATIC_GROUPS, GREEK_VOCABULARY } from '../data/greekVocabulary';
import { ALL_FREQUENCY_TIERS, getWordsByTierId } from '../data/frequencyVocabulary';
import { JOHN_GOSPEL_CHAPTERS, getJohnChapterWords } from '../data/johnGospelVocabulary';

export interface CourseOption {
  id: string;
  title: string;
  category: 'john_gospel' | 'frequency' | 'thematic' | 'custom_list';
  categoryTitle: string;
  mode: 'contextual_reader' | 'frequency' | 'thematic' | 'custom_list';
  targetId: string;
  wordCount: number;
}

export function getAllAvailableCourses(customLists: TeacherCustomList[] = []): CourseOption[] {
  const courses: CourseOption[] = [];

  // 1. All 21 Chapters of John
  JOHN_GOSPEL_CHAPTERS.forEach((ch) => {
    courses.push({
      id: `john_${ch.chapterNumber}`,
      title: `Иоанна ${ch.chapterNumber}: ${ch.chapterTitleRu}`,
      category: 'john_gospel',
      categoryTitle: 'Евангелие от Иоанна (Главы 1–21)',
      mode: 'contextual_reader',
      targetId: `john_${ch.chapterNumber}`,
      wordCount: ch.words.length,
    });
  });

  // 2. Frequency Tiers
  ALL_FREQUENCY_TIERS.forEach((tier) => {
    courses.push({
      id: `freq_${tier.id}`,
      title: `${tier.titleRu} (${tier.items.length} слов)`,
      category: 'frequency',
      categoryTitle: 'Частотный словарь Нового Завета',
      mode: 'frequency',
      targetId: tier.id,
      wordCount: tier.items.length,
    });
  });

  // 3. Thematic Groups
  THEMATIC_GROUPS.forEach((group) => {
    const count = GREEK_VOCABULARY.filter((w) => w.thematicGroup === group.id).length;
    courses.push({
      id: `thematic_${group.id}`,
      title: `${group.iconSymbol} ${group.nameRu} (${count} слов)`,
      category: 'thematic',
      categoryTitle: 'Тематические словари',
      mode: 'thematic',
      targetId: group.id,
      wordCount: count,
    });
  });

  // 4. Custom Lists
  customLists.forEach((list) => {
    courses.push({
      id: `custom_${list.id}`,
      title: `📋 ${list.title} (${list.wordIds.length} слов)`,
      category: 'custom_list',
      categoryTitle: 'Собственные списки преподавателя',
      mode: 'custom_list',
      targetId: list.id,
      wordCount: list.wordIds.length,
    });
  });

  return courses;
}

export function getWordsForCourse(
  mode: 'contextual_reader' | 'frequency' | 'thematic' | 'custom_list' | 'multi_module',
  targetId: string,
  customLists: TeacherCustomList[] = []
): GreekWord[] {
  if (mode === 'contextual_reader') {
    // targetId can be 'john_1' ... 'john_21'
    const match = targetId.match(/john_(\d+)/);
    if (match) {
      const chapterNum = parseInt(match[1], 10);
      return getJohnChapterWords(chapterNum);
    }
    // Fallback to chapter 1
    return getJohnChapterWords(1);
  }

  if (mode === 'frequency') {
    return getWordsByTierId(targetId);
  }

  if (mode === 'thematic') {
    return GREEK_VOCABULARY.filter((w) => w.thematicGroup === targetId);
  }

  if (mode === 'custom_list') {
    const list = customLists.find((l) => l.id === targetId);
    if (list) {
      return GREEK_VOCABULARY.filter((w) => list.wordIds.includes(w.id));
    }
  }

  return getJohnChapterWords(1);
}

export function getWordsForSelectedModules(
  selectedModules: SelectedModuleInfo[],
  customLists: TeacherCustomList[] = []
): GreekWord[] {
  if (!selectedModules || selectedModules.length === 0) return [];
  
  const allWords: GreekWord[] = [];
  const seenWordIds = new Set<string>();

  for (const mod of selectedModules) {
    const words = getWordsForCourse(mod.mode, mod.targetId, customLists);
    for (const w of words) {
      if (!seenWordIds.has(w.id)) {
        seenWordIds.add(w.id);
        allWords.push(w);
      }
    }
  }

  return allWords;
}

export function getWordsForAssignment(
  assignment: HomeworkAssignment,
  customLists: TeacherCustomList[] = []
): GreekWord[] {
  if (assignment.selectedModules && assignment.selectedModules.length > 0) {
    const combined = getWordsForSelectedModules(assignment.selectedModules, customLists);
    if (combined.length > 0) {
      return combined;
    }
  }

  if (assignment.targetIds && assignment.targetIds.length > 0) {
    const allWords: GreekWord[] = [];
    const seenWordIds = new Set<string>();
    for (const tid of assignment.targetIds) {
      let modMode: 'contextual_reader' | 'frequency' | 'thematic' | 'custom_list' = 'contextual_reader';
      if (tid.startsWith('john_')) modMode = 'contextual_reader';
      else if (tid.startsWith('freq_')) modMode = 'frequency';
      else if (tid.startsWith('thematic_')) modMode = 'thematic';
      else if (tid.startsWith('custom_')) modMode = 'custom_list';

      const words = getWordsForCourse(modMode, tid, customLists);
      for (const w of words) {
        if (!seenWordIds.has(w.id)) {
          seenWordIds.add(w.id);
          allWords.push(w);
        }
      }
    }
    if (allWords.length > 0) return allWords;
  }

  return getWordsForCourse(
    assignment.mode === 'multi_module' ? 'contextual_reader' : assignment.mode,
    assignment.targetId,
    customLists
  );
}

export function sampleRandomWords(words: GreekWord[], count: number): GreekWord[] {
  if (!words || words.length === 0) return [];
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
