import { MorphologyWord, StudentMorphologyFormSelection } from '../types';
import { MORPHOLOGY_DATABASE } from '../data/morphologyDatabase';

export const POS_RU: Record<string, string> = {
  verb: 'Глагол',
  noun: 'Существительное',
  adjective: 'Прилагательное',
  participle: 'Причастие',
  pronoun: 'Местоимение',
  other: 'Другое',
};

export const TENSE_RU: Record<string, string> = {
  pres: 'Настоящее',
  impf: 'Имперфект',
  fut: 'Будущее',
  aor: 'Аорист',
  perf: 'Перфект',
  plup: 'Плюсквамперфект',
};

export const VOICE_RU: Record<string, string> = {
  act: 'Действительный',
  mid: 'Медиальный (Средний)',
  pass: 'Страдательный (Пассивный)',
  midpass: 'Медиально-пассивный',
};

export const MOOD_RU: Record<string, string> = {
  ind: 'Изъявительное',
  subj: 'Сослагательное',
  opt: 'Желательное',
  impv: 'Повелительное',
  imp: 'Повелительное',
  inf: 'Инфинитив',
  ptcp: 'Причастие',
  ptc: 'Причастие',
};

export const CASE_RU: Record<string, string> = {
  nom: 'Именительный',
  gen: 'Родительный',
  dat: 'Дательный',
  acc: 'Винительный',
  voc: 'Звательный',
};

export const NUMBER_RU: Record<string, string> = {
  sg: 'Единственное',
  pl: 'Множественное',
};

export const GENDER_RU: Record<string, string> = {
  masc: 'Мужской род',
  m: 'Мужской род',
  fem: 'Женский род',
  f: 'Женский род',
  neut: 'Средний род',
  n: 'Средний род',
};

export const PERSON_RU: Record<string, string> = {
  '1': '1-е лицо',
  '2': '2-е лицо',
  '3': '3-е лицо',
};

export function findMorphologyWord(greekWord?: string, wordId?: string): MorphologyWord | undefined {
  if (!greekWord && !wordId) return undefined;
  
  if (wordId) {
    const byId = MORPHOLOGY_DATABASE.find((w) => w.id === wordId || `mm_${w.id}` === wordId);
    if (byId) return byId;
  }
  
  if (greekWord) {
    const cleanWord = greekWord.trim().toLowerCase();
    const byForm = MORPHOLOGY_DATABASE.find((w) => w.form.toLowerCase() === cleanWord);
    if (byForm) return byForm;
  }
  
  return undefined;
}

export function formatMorphologyGrammar(word: MorphologyWord): string {
  const parts: string[] = [];

  // Part of speech
  if (word.pos && POS_RU[word.pos]) {
    parts.push(POS_RU[word.pos]);
  }

  // Case
  const c = Array.isArray(word.case) ? word.case[0] : word.case;
  if (c && CASE_RU[c]) parts.push(`${CASE_RU[c]} падеж`);

  // Number
  const n = Array.isArray(word.number) ? word.number[0] : word.number;
  if (n && NUMBER_RU[n]) parts.push(`${NUMBER_RU[n]} число`);

  // Gender
  const g = Array.isArray(word.gender) ? word.gender[0] : word.gender;
  if (g && GENDER_RU[g]) parts.push(GENDER_RU[g]);

  // Person
  const p = Array.isArray(word.person) ? word.person[0] : word.person;
  if (p && PERSON_RU[p]) parts.push(PERSON_RU[p]);

  // Tense
  const t = Array.isArray(word.tense) ? word.tense[0] : word.tense;
  if (t && TENSE_RU[t]) parts.push(t === 'pres' || t === 'fut' ? `${TENSE_RU[t]} время` : TENSE_RU[t]);

  // Voice
  const v = Array.isArray(word.voice) ? word.voice[0] : word.voice;
  if (v && VOICE_RU[v]) parts.push(`${VOICE_RU[v]} залог`);

  // Mood
  const m = Array.isArray(word.mood) ? word.mood[0] : word.mood;
  if (m && MOOD_RU[m]) {
    parts.push(m === 'ind' || m === 'subj' || m === 'opt' || m === 'imp' || m === 'impv' ? `${MOOD_RU[m]} наклонение` : MOOD_RU[m]);
  }

  return parts.join(' • ');
}

export interface MorphologyComparisonRow {
  label: string; // "Словарная форма", "Часть речи", "Время" и т.д.
  refValue: string; // Значение преподавателя/эталона
  studentValue: string; // Значение ученика
  isMatch: boolean; // Совпадает ли ответ
  hasStudentValue: boolean; // Заполнил ли ученик
}

export function buildMorphologyComparison(
  greekWord: string,
  studentSelection?: StudentMorphologyFormSelection,
  refWordDb?: MorphologyWord,
  teacherNotes?: string
): MorphologyComparisonRow[] {
  const ref = refWordDb || findMorphologyWord(greekWord);
  const sel = studentSelection || {};

  const rows: MorphologyComparisonRow[] = [];

  // 1. Словарная форма (Лемма)
  const refLemma = ref?.lemma || '';
  const stuLemma = sel.lemma?.trim() || '';
  if (refLemma || stuLemma) {
    const isMatch = !!refLemma && !!stuLemma && refLemma.toLowerCase() === stuLemma.toLowerCase();
    rows.push({
      label: 'Словарная форма',
      refValue: refLemma || '—',
      studentValue: stuLemma || '—',
      isMatch,
      hasStudentValue: !!stuLemma,
    });
  }

  // 2. Часть речи
  const refPos = ref?.pos ? POS_RU[ref.pos] || ref.pos : '';
  const stuPos = sel.partOfSpeech ? POS_RU[sel.partOfSpeech] || sel.partOfSpeech : '';
  if (refPos || stuPos) {
    const isMatch = !!refPos && !!stuPos && refPos.toLowerCase() === stuPos.toLowerCase();
    rows.push({
      label: 'Часть речи',
      refValue: refPos || '—',
      studentValue: stuPos || '—',
      isMatch,
      hasStudentValue: !!stuPos,
    });
  }

  // 3. Время
  const refTenseRaw = ref?.tense ? (Array.isArray(ref.tense) ? ref.tense[0] : ref.tense) : undefined;
  const refTense = refTenseRaw ? TENSE_RU[refTenseRaw] || refTenseRaw : '';
  const stuTenseRaw = sel.tense;
  const stuTense = stuTenseRaw ? TENSE_RU[stuTenseRaw] || stuTenseRaw : '';
  if (refTense || stuTense) {
    const isMatch = !!refTense && !!stuTense && refTenseRaw === stuTenseRaw;
    rows.push({
      label: 'Время',
      refValue: refTense || '—',
      studentValue: stuTense || '—',
      isMatch,
      hasStudentValue: !!stuTense,
    });
  }

  // 4. Залог
  const refVoiceRaw = ref?.voice ? (Array.isArray(ref.voice) ? ref.voice[0] : ref.voice) : undefined;
  const refVoice = refVoiceRaw ? VOICE_RU[refVoiceRaw] || refVoiceRaw : '';
  const stuVoiceRaw = sel.voice;
  const stuVoice = stuVoiceRaw ? VOICE_RU[stuVoiceRaw] || stuVoiceRaw : '';
  if (refVoice || stuVoice) {
    const isMatch = !!refVoice && !!stuVoice && (refVoiceRaw === stuVoiceRaw || (refVoiceRaw === 'midpass' && (stuVoiceRaw === 'mid' || stuVoiceRaw === 'pass')));
    rows.push({
      label: 'Залог',
      refValue: refVoice || '—',
      studentValue: stuVoice || '—',
      isMatch,
      hasStudentValue: !!stuVoice,
    });
  }

  // 5. Наклонение
  const refMoodRaw = ref?.mood ? (Array.isArray(ref.mood) ? ref.mood[0] : ref.mood) : undefined;
  const refMood = refMoodRaw ? MOOD_RU[refMoodRaw] || refMoodRaw : '';
  const stuMoodRaw = sel.mood;
  const stuMood = stuMoodRaw ? MOOD_RU[stuMoodRaw] || stuMoodRaw : '';
  if (refMood || stuMood) {
    const isMatch = !!refMood && !!stuMood && (refMoodRaw === stuMoodRaw || (refMoodRaw === 'imp' && stuMoodRaw === 'impv') || (refMoodRaw === 'ptc' && stuMoodRaw === 'ptcp'));
    rows.push({
      label: 'Наклонение',
      refValue: refMood || '—',
      studentValue: stuMood || '—',
      isMatch,
      hasStudentValue: !!stuMood,
    });
  }

  // 6. Лицо
  const refPersonRaw = ref?.person ? (Array.isArray(ref.person) ? ref.person[0] : ref.person) : undefined;
  const refPerson = refPersonRaw ? PERSON_RU[refPersonRaw] || `${refPersonRaw}-е лицо` : '';
  const stuPersonRaw = sel.person;
  const stuPerson = stuPersonRaw ? PERSON_RU[stuPersonRaw] || `${stuPersonRaw}-е лицо` : '';
  if (refPerson || stuPerson) {
    const isMatch = !!refPerson && !!stuPerson && refPersonRaw === stuPersonRaw;
    rows.push({
      label: 'Лицо',
      refValue: refPerson || '—',
      studentValue: stuPerson || '—',
      isMatch,
      hasStudentValue: !!stuPerson,
    });
  }

  // 7. Падеж
  const refCaseRaw = ref?.case ? (Array.isArray(ref.case) ? ref.case[0] : ref.case) : undefined;
  const refCase = refCaseRaw ? CASE_RU[refCaseRaw] || refCaseRaw : '';
  const stuCaseRaw = sel.case || (sel as any).grammaticalCase;
  const stuCase = stuCaseRaw ? CASE_RU[stuCaseRaw] || stuCaseRaw : '';
  if (refCase || stuCase) {
    const isMatch = !!refCase && !!stuCase && refCaseRaw === stuCaseRaw;
    rows.push({
      label: 'Падеж',
      refValue: refCase || '—',
      studentValue: stuCase || '—',
      isMatch,
      hasStudentValue: !!stuCase,
    });
  }

  // 8. Число
  const refNumRaw = ref?.number ? (Array.isArray(ref.number) ? ref.number[0] : ref.number) : undefined;
  const refNum = refNumRaw ? NUMBER_RU[refNumRaw] || refNumRaw : '';
  const stuNumRaw = sel.number;
  const stuNum = stuNumRaw ? NUMBER_RU[stuNumRaw] || stuNumRaw : '';
  if (refNum || stuNum) {
    const isMatch = !!refNum && !!stuNum && refNumRaw === stuNumRaw;
    rows.push({
      label: 'Число',
      refValue: refNum || '—',
      studentValue: stuNum || '—',
      isMatch,
      hasStudentValue: !!stuNum,
    });
  }

  // 9. Род
  const refGenRaw = ref?.gender ? (Array.isArray(ref.gender) ? ref.gender[0] : ref.gender) : undefined;
  const refGen = refGenRaw ? GENDER_RU[refGenRaw] || refGenRaw : '';
  const stuGenRaw = sel.gender;
  const stuGen = stuGenRaw ? GENDER_RU[stuGenRaw] || stuGenRaw : '';
  if (refGen || stuGen) {
    const isMatch = !!refGen && !!stuGen && (
      refGenRaw === stuGenRaw ||
      (refGenRaw === 'm' && stuGenRaw === 'masc') ||
      (refGenRaw === 'f' && stuGenRaw === 'fem') ||
      (refGenRaw === 'n' && stuGenRaw === 'neut')
    );
    rows.push({
      label: 'Род',
      refValue: refGen || '—',
      studentValue: stuGen || '—',
      isMatch,
      hasStudentValue: !!stuGen,
    });
  }

  return rows;
}
