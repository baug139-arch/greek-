import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, RefreshCw, Trophy, AlertCircle, Heart, Star, LayoutGrid, Check, CheckCircle2, XCircle } from 'lucide-react';
import { MorphologyWord, MorphPartOfSpeech } from '../types';
import { MORPHOLOGY_DATABASE } from '../data/morphologyDatabase';

interface MorphologyRunnerProps {
  words: MorphologyWord[];
  onComplete: (scorePercent: number, xpGained: number, missedWordIds: string[], masteredWordIds: string[]) => void;
  onExit: () => void;
  title: string;
}

const generateGrammarHint = (word: MorphologyWord | undefined): string => {
  if (!word) return "";
  const lemma = word.lemma;
  const tense = word.tense;
  const pos = word.pos;
  const voice = Array.isArray(word.voice) ? word.voice[0] : word.voice;
  const mood = word.mood;

  if (tense === 'aor') {
    if (lemma === 'λέγω') return "Супплетивный глагол (меняет корень). Аорист от λέγω — это всегда формы от корня εἰπ- (εἶπον, εἰπεῖν, εἰπών и т.д.). Второго такого нет, его нужно просто запомнить!";
    if (lemma === 'ὁράω') return "Супплетивный глагол. Аорист образуется от совершенно другого корня ἰδ- (εἶδον, ἰδεῖν, ἰδών). Отсюда происходит русское слово 'идея' (то, что увидено).";
    if (lemma === 'ἔρχομαι') return "Супплетивный глагол. В аористе он отбрасывает корень ἐρχ- и использует корень ἐλθ- (ἦλθον, ἐλθεῖν, ἐλθών).";
    if (lemma === 'ἐσθίω') return "Супплетивный глагол. Корень полностью меняется на φαγ- (фаг-), как в слове 'бактериофаг'. Отсюда аорист: ἔφαγον, φαγεῖν.";
    if (lemma === 'λαμβάνω') return "Это второй (сильный) аорист. Основа полностью меняется с λαμβ- на λαβ-, а стандартный суффикс -σα- не используется. К новой основе сразу добавляются личные окончания.";
    if (lemma === 'εὑρίσκω') return "Второй (сильный) аорист. Основа εὑρισκ- упрощается до εὑρ- (например, εὗρον, εὑρεῖν).";
    if (lemma === 'γινώσκω') return "Особый корневой аорист (ἔγνων, γνῶναι). Корень γινωσκ- упрощается до γνω-.";
    if (lemma === 'φέρω') return "Супплетивный глагол. Аорист образуется от невероятного корня ἐνεγκ- (ἤνεγκον, ἐνεγκεῖν). Это нужно просто запомнить!";
    if (lemma === 'πίπτω') return "Второй аорист. Основа меняется на πεσ- (ἔπεσον, πεσεῖν).";
    if (lemma === 'ἄγω') return "У этого глагола так называемый 'аттический' (удвоенный) второй аорист: ἤγαγον, ἀγαγεῖν. Корень ἀγ- удваивается.";
    if (lemma === 'ἔχω') return "Второй аорист. Основа меняется на σχ- (ἔσχον, σχεῖν, σχών). Приращение дает форму ἔσχον.";
    if (lemma === 'γίνομαι') return "Второй аорист. Основа γινομ- упрощается до γεν- (ἐγενόμην, γενέσθαι).";
    if (lemma === 'βάλλω') return "Второй аорист. Основа βάλλ- (с двумя лямбдами) упрощается до βαλ- (с одной лямбдой: ἔβαλον, βαλεῖν).";
    if (lemma === 'ἀποθνῄσκω') return "Второй аорист. Основа меняется на -θαν- (ἀπέθανον, ἀποθανεῖν).";
  }

  const rules: string[] = [];

  if (pos === 'participle') {
    rules.push("Это причастие.");
    if (voice === 'act') {
      rules.push("У активных причастий часто можно заметить суффикс -ντ- или -τ- в косвенных падежах.");
    } else if (voice === 'mid' || voice === 'pass' || voice === 'midpass') {
      rules.push("У медиально-страдательных причастий характерен суффикс -μεν- (например, -μενος, -μένη, -μενον).");
    }
  }

  if (pos === 'verb' || pos === 'participle') {
    if (tense === 'impf') {
      rules.push("Имперфект (прошедшее время несовершенного вида) всегда строится от основы настоящего времени. В изъявительном наклонении в начале слова обязательно стоит приращение (например, ἐ- или удлинение гласной).");
    } else if (tense === 'fut') {
      rules.push("Главный маркер будущего времени — суффикс -σ- (сигма) сразу после корня перед окончанием. Если корень оканчивается на согласную (π, β, φ, κ, γ, χ), при слиянии с сигмой образуются буквы ψ (пс) или ξ (кс).");
    } else if (tense === 'perf') {
      rules.push("Характернейший признак Перфекта — удвоение (редупликация) начального согласного с буквой эпсилон (например, λέ-λυ-), а у активного залога часто встречается суффикс -κ- (каппа).");
    } else if (tense === 'plup') {
      rules.push("Плюсквамперфект имеет и приращение (как прошедшее время), и удвоение корня (как перфект).");
    } else if (tense === 'aor') {
      let aorHint = "Это Аорист (прошедшее время совершенного вида).";
      if (mood === 'ind') aorHint += " В изъявительном наклонении он имеет приращение (ἐ-).";
      if (voice === 'pass') {
        aorHint += " Для пассивного аориста характерен суффикс -θη- (тета-эта) или просто -η-.";
      } else {
        aorHint += " Обычно (в слабом аористе) используется суффикс -σα- или -σ- перед окончанием. Если вы его не видите, это сильный аорист, у которого изменилась основа (корень).";
      }
      rules.push(aorHint);
    }

    if (mood === 'inf') {
      rules.push("Это инфинитив (неопределенная форма). Характерные окончания: -ειν или -ναι для актива, и -σθαι для медия/пассива.");
    } else if (mood === 'subj') {
      rules.push("Это сослагательное наклонение (Конъюнктив). Обратите внимание на удлиненную соединительную гласную (ω вместо ο, η вместо ε) перед личным окончанием.");
    } else if (mood === 'impv') {
      rules.push("Повелительное наклонение выражает приказ или просьбу.");
    }
  } else if (pos === 'noun') {
     rules.push("Существительное. Его форма зависит от склонения (1-е, 2-е или 3-е), которое определяет набор окончаний для падежей и чисел.");
  } else if (pos === 'adjective') {
     rules.push("Прилагательное. Оно согласуется с существительным в роде, числе и падеже, поэтому использует те же окончания, что и существительные.");
  } else if (pos === 'pronoun') {
     rules.push("Местоимение. Местоимения часто имеют неправильные и древние формы склонения, которые лучше просто запоминать.");
  }

  if (rules.length === 0) {
     rules.push("Эта форма образуется по стандартным правилам греческой грамматики для данной части речи.");
  }

  return rules.join(' ');
};

export const isVariantInfinitive = (v: MorphologyWord | undefined): boolean => {
  if (!v) return false;
  return v.pos === 'infinitive' || (v.pos === 'verb' && v.mood === 'inf');
};

export const isVariantFiniteVerb = (v: MorphologyWord | undefined): boolean => {
  if (!v) return false;
  return v.pos === 'verb' && v.mood !== 'inf';
};

const POS_OPTIONS = [
  { value: 'verb', label: 'Личный глагол' },
  { value: 'infinitive', label: 'Инфинитив' },
  { value: 'participle', label: 'Причастие' },
  { value: 'noun', label: 'Существительное' },
  { value: 'adjective', label: 'Прилагательное' },
  { value: 'pronoun', label: 'Местоимение' },
];

const NOUN_CASES = [
  { value: 'nom', label: 'Именительный' },
  { value: 'gen', label: 'Родительный' },
  { value: 'dat', label: 'Дательный' },
  { value: 'acc', label: 'Винительный' },
  { value: 'voc', label: 'Звательный' },
];

const GENDERS = [
  { value: 'm', label: 'Мужской' },
  { value: 'f', label: 'Женский' },
  { value: 'n', label: 'Средний' },
];

const NUMBERS = [
  { value: 'sg', label: 'Единственное' },
  { value: 'pl', label: 'Множественное' },
];

const TENSES = [
  { value: 'pres', label: 'Настоящее' },
  { value: 'impf', label: 'Имперфект' },
  { value: 'fut', label: 'Будущее' },
  { value: 'aor', label: 'Аорист' },
  { value: 'perf', label: 'Перфект' },
  { value: 'plup', label: 'Плюсквамперфект' },
];

const VOICES = [
  { value: 'act', label: 'Действительный' },
  { value: 'mid', label: 'Медиальный' },
  { value: 'pass', label: 'Страдательный' },
];

const MOODS = [
  { value: 'ind', label: 'Изъявительное (Ind)' },
  { value: 'subj', label: 'Сослагательное (Subj)' },
  { value: 'opt', label: 'Оптатив' },
  { value: 'impv', label: 'Повелительное (Imp)' },
];

const PERSONS = [
  { value: '1', label: '1-е лицо' },
  { value: '2', label: '2-е лицо' },
  { value: '3', label: '3-е лицо' },
];

const PERSON_NUMBERS = [
  { value: '1sg', label: '1-е лицо, ед.ч.' },
  { value: '2sg', label: '2-е лицо, ед.ч.' },
  { value: '3sg', label: '3-е лицо, ед.ч.' },
  { value: '1pl', label: '1-е лицо, мн.ч.' },
  { value: '2pl', label: '2-е лицо, мн.ч.' },
  { value: '3pl', label: '3-е лицо, мн.ч.' },
];

const CATEGORY_MAP: Record<string, { label: string, options: any[] }> = {
  pos: { label: 'Часть речи', options: POS_OPTIONS },
  case: { label: 'Падеж', options: NOUN_CASES },
  number: { label: 'Число', options: NUMBERS },
  gender: { label: 'Род', options: GENDERS },
  tense: { label: 'Время', options: TENSES },
  voice: { label: 'Залог', options: VOICES },
  mood: { label: 'Наклонение', options: MOODS },
  person: { label: 'Лицо', options: PERSONS },
  personNumber: { label: 'Лицо и число', options: PERSON_NUMBERS }
};

let sharedAudioCtx: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
};

export const MorphologyRunner: React.FC<MorphologyRunnerProps> = ({ words, onComplete, onExit, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  const currentForm = words[currentIndex]?.form;

  const currentVariants = useMemo(() => {
    if (!currentForm) return [];
    return MORPHOLOGY_DATABASE.filter(w => w.form === currentForm);
  }, [currentForm]);
  
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [correctSelections, setCorrectSelections] = useState<Record<string, string>>({});
  const [wrongSelections, setWrongSelections] = useState<Record<string, string[]>>({});
  const [categoryAlternatives, setCategoryAlternatives] = useState<Record<string, string[]>>({});
  const [sessionMissedIds, setSessionMissedIds] = useState<Set<string>>(new Set());
  const [sessionMasteredIds, setSessionMasteredIds] = useState<Set<string>>(new Set());
  const [madeMistakeOnCurrent, setMadeMistakeOnCurrent] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  // Check if voice should be single "Медиально-страдательный" (pres, impf, perf, plup)
  const isMediopassive = useMemo(() => {
    return currentVariants.some(v => {
      const t = v.tense;
      const isPresOrImpf = !t || t === 'pres' || t === 'impf' || t === 'perf' || t === 'plup';
      const hasMidOrPass = v.voice === 'mid' || v.voice === 'pass' || v.voice === 'midpass' ||
        (Array.isArray(v.voice) && (v.voice.includes('mid') || v.voice.includes('pass')));
      return isPresOrImpf && hasMidOrPass;
    });
  }, [currentVariants]);

  // Check if current form is polysemic / has multiple parsing interpretations (Variant 1)
  const { isPolysemic, variantCountDescription, allKnownVariantLabels } = useMemo(() => {
    if (!currentVariants || currentVariants.length === 0) {
      return { isPolysemic: false, variantCountDescription: '', allKnownVariantLabels: [] };
    }

    const labels: string[] = [];
    currentVariants.forEach((v) => {
      let desc = '';
      if (isVariantInfinitive(v)) {
        const tLabel = TENSES.find(t => t.value === v.tense)?.label || '';
        const vLabel = Array.isArray(v.voice) 
          ? v.voice.map(x => VOICES.find(y => y.value === x)?.label || x).join('/') 
          : (VOICES.find(x => x.value === v.voice)?.label || (v.voice === 'midpass' ? 'Медиально-страдательный' : ''));
        desc = ['Инфинитив', tLabel, vLabel].filter(Boolean).join(', ');
      } else if (isVariantFiniteVerb(v)) {
        const pLabel = v.person ? (Array.isArray(v.person) ? v.person.join('/') : v.person) : '';
        const nLabel = v.number ? (Array.isArray(v.number) ? v.number.join('/') : v.number) : '';
        const pnStr = pLabel && nLabel ? `${pLabel} л. ${nLabel === 'sg' ? 'ед.ч.' : 'мн.ч.'}` : '';
        const mLabel = MOODS.find(m => m.value === v.mood)?.label.split(' ')[0] || '';
        const tLabel = TENSES.find(t => t.value === v.tense)?.label || '';
        desc = [pnStr, mLabel, tLabel].filter(Boolean).join(', ');
      } else if (v.pos === 'noun' || v.pos === 'adjective' || v.pos === 'pronoun') {
        const cLabel = Array.isArray(v.case) 
          ? v.case.map(c => NOUN_CASES.find(x => x.value === c)?.label).join('/') 
          : (NOUN_CASES.find(x => x.value === v.case)?.label || '');
        const nLabel = NUMBERS.find(n => n.value === v.number)?.label || '';
        const gLabel = v.gender ? (Array.isArray(v.gender) ? v.gender.join('/') : GENDERS.find(g => g.value === v.gender)?.label) : '';
        desc = [cLabel, nLabel, gLabel].filter(Boolean).join(', ');
      } else if (v.pos === 'participle') {
        const cLabel = Array.isArray(v.case) 
          ? v.case.map(c => NOUN_CASES.find(x => x.value === c)?.label).join('/') 
          : (NOUN_CASES.find(x => x.value === v.case)?.label || '');
        const tLabel = TENSES.find(t => t.value === v.tense)?.label || '';
        desc = ['Причастие', tLabel, cLabel].filter(Boolean).join(', ');
      }
      if (desc && !labels.includes(desc)) {
        labels.push(desc);
      }
    });

    const hasArrayMultis = currentVariants.some(v => 
      ['case', 'gender', 'number', 'tense', 'mood', 'person'].some(k => {
        const val = v[k as keyof MorphologyWord];
        return Array.isArray(val) && val.length > 1;
      })
    );

    const isMulti = currentVariants.length > 1 || hasArrayMultis || labels.length > 1;
    const count = Math.max(currentVariants.length, labels.length, hasArrayMultis ? 2 : 1);

    return {
      isPolysemic: isMulti,
      variantCountDescription: `${count} варианта разбора`,
      allKnownVariantLabels: labels,
    };
  }, [currentVariants]);

  const possibleVariants = useMemo(() => {
    if (currentVariants.length === 0) return [];
    return currentVariants.filter(variant => {
      for (const [cat, val] of Object.entries(correctSelections)) {
        if (cat === 'person' || cat === 'number') {
          // Handled safely because we store person and number separately even if chosen together
        }

        if (cat === 'pos') {
          if (val === 'infinitive') {
            if (!isVariantInfinitive(variant)) return false;
          } else if (val === 'verb') {
            if (!isVariantFiniteVerb(variant)) return false;
          } else {
            if (variant.pos !== val) return false;
          }
          continue;
        }
        
        const expected = variant[cat as keyof MorphologyWord];
        if (expected === undefined) return false;
        
        if (cat === 'voice' && val === 'midpass') {
          const match = (expected === 'mid' || expected === 'pass' || expected === 'midpass' || (Array.isArray(expected) && (expected.includes('mid') || expected.includes('pass'))));
          if (!match) return false;
        } else {
          const match = Array.isArray(expected) ? expected.includes(val) : expected === val;
          if (!match) return false;
        }
      }
      return true;
    });
  }, [currentVariants, correctSelections]);

  const playClickSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const playErrorSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const playSuccessSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  const getRequiredCategories = (word: MorphologyWord) => {
    if (isVariantInfinitive(word)) {
      // Infinitives only require POS, Tense, and Voice (no mood, person, number, case, gender)
      return ['pos', 'tense', 'voice'];
    }
    const allCats = ['pos', 'case', 'number', 'gender', 'tense', 'voice', 'mood', 'person'];
    return allCats.filter(cat => word[cat as keyof MorphologyWord] !== undefined);
  };

  const isWordComplete = (selections: Record<string, string>) => {
    return currentVariants.some(variant => {
       const req = getRequiredCategories(variant);
       return req.every(cat => {
         const val = selections[cat];
         if (val === undefined) return false;
         
         if (cat === 'pos') {
           if (val === 'infinitive') return isVariantInfinitive(variant);
           if (val === 'verb') return isVariantFiniteVerb(variant);
           return variant.pos === val;
         }

         const expected = variant[cat as keyof MorphologyWord];
         if (cat === 'voice' && val === 'midpass') {
           return (expected === 'mid' || expected === 'pass' || expected === 'midpass' || (Array.isArray(expected) && (expected.includes('mid') || expected.includes('pass'))));
         } else {
           return Array.isArray(expected) ? expected.includes(val) : expected === val;
         }
       });
    });
  };

  const triggerSuccess = (finalSelections: Record<string, string>) => {
    setFeedback('success');
    playSuccessSound();
  };

  const handleOptionClick = (category: string, value: string) => {
    if (currentVariants.length === 0 || feedback !== 'idle') return;
    
    if (category === 'personNumber') {
      if (correctSelections['person'] && correctSelections['number']) return;
    } else {
      if (correctSelections[category]) return;
    }

    const testSelections = { ...correctSelections };
    if (category === 'personNumber') {
      testSelections['person'] = value[0];
      testSelections['number'] = value.substring(1);
    } else {
      testSelections[category] = value;
    }
    
    const isValid = currentVariants.some(variant => {
      for (const [cat, val] of Object.entries(testSelections)) {
        if (cat === 'pos') {
          if (val === 'infinitive') {
            if (!isVariantInfinitive(variant)) return false;
          } else if (val === 'verb') {
            if (!isVariantFiniteVerb(variant)) return false;
          } else {
            if (variant.pos !== val) return false;
          }
          continue;
        }

        const expected = variant[cat as keyof MorphologyWord];
        if (expected === undefined) return false;
        
        if (cat === 'voice' && val === 'midpass') {
           const match = (expected === 'mid' || expected === 'pass' || expected === 'midpass' || (Array.isArray(expected) && (expected.includes('mid') || expected.includes('pass'))));
           if (!match) return false;
        } else {
           const match = Array.isArray(expected) ? expected.includes(val) : expected === val;
           if (!match) return false;
        }
      }
      return true;
    });

    if (isValid) {
      playClickSound();
      setCorrectSelections(testSelections);

      // On-the-fly Variant 1: Calculate other valid alternatives for this category
      if (category === 'personNumber') {
        const altOptions = PERSON_NUMBERS.filter(pn => {
          if (pn.value === value) return false;
          const p = pn.value[0];
          const n = pn.value.substring(1);
          const testObj = { ...correctSelections, person: p, number: n };
          return currentVariants.some(variant => {
            for (const [cat, val] of Object.entries(testObj)) {
              if (cat === 'pos') {
                if (val === 'infinitive') {
                  if (!isVariantInfinitive(variant)) return false;
                } else if (val === 'verb') {
                  if (!isVariantFiniteVerb(variant)) return false;
                } else {
                  if (variant.pos !== val) return false;
                }
                continue;
              }

              const expected = variant[cat as keyof MorphologyWord];
              if (expected === undefined) return false;
              if (cat === 'voice' && val === 'midpass') {
                if (expected !== 'mid' && expected !== 'pass' && expected !== 'midpass' && !(Array.isArray(expected) && (expected.includes('mid') || expected.includes('pass')))) return false;
              } else {
                if (Array.isArray(expected) ? !expected.includes(val) : expected !== val) return false;
              }
            }
            return true;
          });
        });
        if (altOptions.length > 0) {
          setCategoryAlternatives(prev => ({
            ...prev,
            personNumber: altOptions.map(o => o.label)
          }));
        }
      } else {
        const meta = CATEGORY_MAP[category];
        if (meta) {
          let checkOptions = meta.options;
          if (category === 'voice' && isMediopassive) {
            checkOptions = [
              { value: 'act', label: 'Действительный' },
              { value: 'midpass', label: 'Медиально-страдательный' }
            ];
          }
          const altOptions = checkOptions.filter(opt => {
            if (opt.value === value) return false;
            const testObj = { ...correctSelections, [category]: opt.value };
            return currentVariants.some(variant => {
              for (const [cat, val] of Object.entries(testObj)) {
                if (cat === 'pos') {
                  if (val === 'infinitive') {
                    if (!isVariantInfinitive(variant)) return false;
                  } else if (val === 'verb') {
                    if (!isVariantFiniteVerb(variant)) return false;
                  } else {
                    if (variant.pos !== val) return false;
                  }
                  continue;
                }

                const expected = variant[cat as keyof MorphologyWord];
                if (expected === undefined) return false;
                if (cat === 'voice' && val === 'midpass') {
                  if (expected !== 'mid' && expected !== 'pass' && expected !== 'midpass' && !(Array.isArray(expected) && (expected.includes('mid') || expected.includes('pass')))) return false;
                } else {
                  if (Array.isArray(expected) ? !expected.includes(val) : expected !== val) return false;
                }
              }
              return true;
            });
          });
          if (altOptions.length > 0) {
            setCategoryAlternatives(prev => ({
              ...prev,
              [category]: altOptions.map(o => o.label)
            }));
          }
        }
      }

      if (isWordComplete(testSelections)) {
        if (!madeMistakeOnCurrent && hintLevel === 0) {
          setSessionMasteredIds(prev => new Set(prev).add(currentVariants[0].id));
          setScore(s => s + 1);
        }
        triggerSuccess(testSelections);
      }
    } else {
      playErrorSound();
      setMadeMistakeOnCurrent(true);
      setSessionMissedIds(prev => new Set(prev).add(currentVariants[0].id));
      
      setWrongSelections(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), value]
      }));
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= words.length) {
      const accuracyPercent = Math.round((score / words.length) * 100);
      const earnedXp = Math.max(10, score * 15);
      onComplete(accuracyPercent, earnedXp, Array.from(sessionMissedIds), Array.from(sessionMasteredIds));
    } else {
      setCurrentIndex(i => i + 1);
      setFeedback('idle');
      setErrorDetails([]);
      setHintLevel(0);
      setCorrectSelections({});
      setWrongSelections({});
      setCategoryAlternatives({});
      setMadeMistakeOnCurrent(false);
    }
  };

  const requestHint = () => {
    if (currentVariants.length === 0 || feedback !== 'idle') return;
    
    const nextLevel = hintLevel + 1;
    if (nextLevel > 5) return;
    setHintLevel(nextLevel);
    
    const activeVariant = possibleVariants[0] || currentVariants[0];
    const reqCats = getRequiredCategories(activeVariant);

    if (nextLevel === 4) {
      const toFill = reqCats.slice(0, Math.ceil(reqCats.length / 2));
      const newSels = { ...correctSelections };
      toFill.forEach(c => {
        if (!newSels[c]) {
           const expected = activeVariant[c as keyof MorphologyWord];
           newSels[c] = Array.isArray(expected) ? expected[0] : (expected as string);
        }
      });
      setCorrectSelections(newSels);
      if (isWordComplete(newSels)) triggerSuccess(newSels);
    } else if (nextLevel === 5) {
      const newSels = { ...correctSelections };
      reqCats.forEach(c => {
        const expected = activeVariant[c as keyof MorphologyWord];
        newSels[c] = Array.isArray(expected) ? expected[0] : (expected as string);
      });
      setCorrectSelections(newSels);
      triggerSuccess(newSels);
    }
  };

  const renderOptionGroup = (category: string) => {
    let meta = CATEGORY_MAP[category];
    if (!meta) return null;
    
    let options = meta.options;

    // If mediopassive applies, collapse to single "Медиально-страдательный" button
    if (category === 'voice' && isMediopassive) {
      options = [
        { value: 'act', label: 'Действительный' },
        { value: 'midpass', label: 'Медиально-страдательный' }
      ];
    }

    return (
      <div className="space-y-1.5 sm:space-y-3" key={category}>
        <h4 className="text-xs sm:text-sm font-bold text-[#8C7D6B] uppercase tracking-wider">{meta.label}</h4>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {options.map(opt => {
            let isCorrect = false;
            
            if (category === 'personNumber') {
               isCorrect = correctSelections['person'] === opt.value[0] && correctSelections['number'] === opt.value.substring(1);
            } else if (category === 'voice' && opt.value === 'midpass') {
               isCorrect = correctSelections['voice'] === 'mid' || correctSelections['voice'] === 'pass' || correctSelections['voice'] === 'midpass';
            } else {
               isCorrect = correctSelections[category] === opt.value;
            }
            
            const isWrong = wrongSelections[category]?.includes(opt.value);
            
            let btnClass = "px-2.5 sm:px-4 py-1 sm:py-2 rounded-full font-bold text-xs sm:text-sm transition-colors cursor-pointer ";
            if (isCorrect) {
              btnClass += "bg-[#2D4A32] text-white border-2 border-[#2D4A32]";
            } else if (isWrong) {
              btnClass += "bg-[#FEE2E2] text-[#991B1B] border-2 border-[#FCA5A5] opacity-50 cursor-not-allowed";
            } else {
              btnClass += "bg-white text-[#1A1A1A] border-2 border-[#E5E1DA] hover:border-[#D97706] hover:text-[#D97706]";
            }

            return (
              <button
                key={opt.value}
                onClick={() => handleOptionClick(category, opt.value)}
                disabled={isCorrect || isWrong || feedback !== 'idle'}
                className={btnClass}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* On-the-fly Variant 1 Hint: Display alternative valid parsing */}
        {category === 'personNumber' ? (
          correctSelections.person && correctSelections.number && categoryAlternatives.personNumber && categoryAlternatives.personNumber.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#2D4A32] bg-[#E8F3EB] border border-[#C5D9C8] px-3 py-1.5 rounded-lg shadow-2xs animate-fade-in mt-1">
              <Check className="w-3.5 h-3.5 text-[#2D4A32] shrink-0" />
              <span>
                Принято: <strong>{PERSON_NUMBERS.find(o => o.value === `${correctSelections.person}${correctSelections.number}`)?.label}</strong>. 
                Также верно для этой формы: <strong>{categoryAlternatives.personNumber.join(' или ')}</strong>.
              </span>
            </div>
          )
        ) : (
          correctSelections[category] && categoryAlternatives[category] && categoryAlternatives[category].length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#2D4A32] bg-[#E8F3EB] border border-[#C5D9C8] px-3 py-1.5 rounded-lg shadow-2xs animate-fade-in mt-1">
              <Check className="w-3.5 h-3.5 text-[#2D4A32] shrink-0" />
              <span>
                Принято: <strong>{meta.options.find(o => o.value === correctSelections[category])?.label || correctSelections[category]}</strong>. 
                Также верно для этой формы: <strong>{categoryAlternatives[category].join(' или ')}</strong>.
              </span>
            </div>
          )
        )}
      </div>
    );
  };

  const completedVariant = possibleVariants[0] || currentVariants[0];
  const requiredCategories = completedVariant ? getRequiredCategories(completedVariant) : [];
  const showAdditionalCategories = !!correctSelections.pos;

  const hasMultiplePaths = currentVariants.length > 1;
  const hasMultipleInternalVariants = completedVariant && Object.keys(completedVariant).some(k => 
    Array.isArray(completedVariant[k as keyof MorphologyWord]) && (completedVariant[k as keyof MorphologyWord] as string[]).length > 1
  );

  return (
    <div className={`fixed inset-0 z-50 flex flex-col transition-colors duration-500 ${feedback === 'success' ? 'bg-[#F4F9F5]' : 'bg-[#FAF8F5]'}`}>
      <div className={`h-auto min-h-[3rem] sm:min-h-[4rem] pt-[max(env(safe-area-inset-top),44px)] sm:pt-3 pb-2 sm:pb-3 border-b px-3 sm:px-4 flex items-center justify-between shrink-0 transition-colors duration-500 ${feedback === 'success' ? 'bg-[#F4F9F5] border-[#C5D9C8]' : 'bg-white border-[#E5E1DA]'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={onExit} className={`p-1.5 sm:p-2 rounded-full ${feedback === 'success' ? 'text-[#2D4A32] hover:bg-[#C5D9C8]' : 'text-[#8C7D6B] hover:text-[#1A1A1A] hover:bg-[#FAF8F5]'}`}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className={`h-1.5 sm:h-2 w-24 sm:w-32 rounded-full overflow-hidden ${feedback === 'success' ? 'bg-[#C5D9C8]' : 'bg-[#E5E1DA]'}`}>
            <div 
              className={`h-full transition-all duration-500 ${feedback === 'success' ? 'bg-[#2D4A32]' : 'bg-[#D97706]'}`} 
              style={{ width: `${(currentIndex / words.length) * 100}%` }}
            />
          </div>
          <span className={`text-xs sm:text-sm font-bold ${feedback === 'success' ? 'text-[#2D4A32]' : 'text-[#D97706]'}`}>{currentIndex + 1} / {words.length}</span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={requestHint}
            disabled={hintLevel >= 5 || feedback !== 'idle'}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] hover:bg-[#FEF3C7] rounded text-[10px] sm:text-xs font-bold uppercase disabled:opacity-50"
          >
            💡 Подсказка {hintLevel > 0 ? `(${hintLevel}/5)` : ''}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 pb-20 sm:pb-32">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-6">
          
          <div className="text-center space-y-1 sm:space-y-2 py-2 sm:py-4">
            <span className={`font-medium uppercase tracking-wider text-[10px] sm:text-xs ${feedback === 'success' ? 'text-[#2D4A32]' : 'text-[#8C7D6B]'}`}>{title}</span>
            <div className={`text-3xl sm:text-5xl font-serif font-black ${feedback === 'success' ? 'text-[#2D4A32]' : 'text-[#1A1A1A]'}`}>
              {hintLevel >= 1 && (completedVariant?.stem || completedVariant?.ending) ? (
                <span>
                  {completedVariant?.stem}<span className="text-[#D97706] border-b-2 border-[#D97706]">{completedVariant?.ending}</span>
                </span>
              ) : (
                currentForm
              )}
            </div>

            {isPolysemic && (
              <div className="mt-2.5 inline-flex flex-col sm:flex-row items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-sans rounded-lg font-medium shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">ℹ️</span>
                  <span className="font-bold">Многозначная форма:</span>
                  <span>{variantCountDescription} (подходит любой)</span>
                </div>
                {allKnownVariantLabels.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1 text-[11px] text-[#78350F] bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                    {allKnownVariantLabels.map((lbl, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="opacity-40">•</span>}
                        <span>{lbl}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {hintLevel >= 2 && (
              <div className="text-xs sm:text-sm text-[#92400E] font-medium bg-[#FFFBEB] inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 rounded">
                Лемма: <strong>{completedVariant?.lemma}</strong> — {completedVariant?.translation.split('(')[0]}
              </div>
            )}

            {hintLevel >= 3 && (
              <div className="mt-2 sm:mt-4 p-2.5 sm:p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs sm:text-sm text-[#166534] text-left shadow-2xs">
                <h4 className="font-bold flex items-center gap-1.5 mb-1">
                  <span className="text-base sm:text-lg">🎓</span> Грамматическая подсказка
                </h4>
                <p className="leading-relaxed">{generateGrammarHint(completedVariant)}</p>
              </div>
            )}

            {hintLevel >= 5 && (
              <div className="mt-2 sm:mt-4 p-2.5 sm:p-4 bg-white border border-[#E5E1DA] rounded-lg shadow-2xs text-xs sm:text-sm text-left">
                <h4 className="font-bold text-[#1A1A1A] mb-1.5 flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-[#D97706]" /> 
                  Шпаргалка: Полный разбор
                </h4>
                <p><strong>Форма:</strong> {completedVariant?.form}</p>
                <p><strong>Часть речи:</strong> {
                  isVariantInfinitive(completedVariant) ? 'Инфинитив' :
                  completedVariant?.pos === 'noun' ? 'Существительное' : 
                  completedVariant?.pos === 'verb' ? 'Личный глагол' : 
                  completedVariant?.pos === 'participle' ? 'Причастие' : 
                  completedVariant?.pos === 'adjective' ? 'Прилагательное' : 'Местоимение'
                }</p>
                {isVariantInfinitive(completedVariant) && (
                  <p><strong>Морфология:</strong> {TENSES.find(t => t.value === completedVariant.tense)?.label}, {
                    Array.isArray(completedVariant.voice) 
                    ? completedVariant.voice.map(v => VOICES.find(x => x.value === v)?.label).join(' / ') 
                    : (VOICES.find(v => v.value === completedVariant.voice)?.label || (completedVariant.voice === 'midpass' ? 'Медиально-страдательный' : ''))
                  }. (Неличная форма глагола, без лица и числа).</p>
                )}
                {(completedVariant?.pos === 'noun' || completedVariant?.pos === 'adjective' || completedVariant?.pos === 'pronoun') && (
                  <p><strong>Морфология:</strong> {NOUN_CASES.find(c => c.value === (Array.isArray(completedVariant.case) ? completedVariant.case[0] : completedVariant.case))?.label} падеж, {NUMBERS.find(n => n.value === (Array.isArray(completedVariant.number) ? completedVariant.number[0] : completedVariant.number))?.label} число{completedVariant.gender ? `, ${GENDERS.find(g => g.value === (Array.isArray(completedVariant.gender) ? completedVariant.gender[0] : completedVariant.gender))?.label} род` : ''}.</p>
                )}
                {isVariantFiniteVerb(completedVariant) && (
                  <p><strong>Морфология:</strong> {TENSES.find(t => t.value === completedVariant.tense)?.label}, {
                    Array.isArray(completedVariant.voice) 
                    ? completedVariant.voice.map(v => VOICES.find(x => x.value === v)?.label).join(' / ') 
                    : (VOICES.find(v => v.value === completedVariant.voice)?.label || (completedVariant.voice === 'midpass' ? 'Медиально-страдательный' : ''))
                  }, {MOODS.find(m => m.value === completedVariant.mood)?.label}{completedVariant.person ? `, ${PERSONS.find(p => p.value === completedVariant.person)?.label}` : ''}{completedVariant.number ? `, ${NUMBERS.find(n => n.value === completedVariant.number)?.label} число` : ''}.</p>
                )}
                {completedVariant?.pos === 'participle' && (
                  <p><strong>Морфология:</strong> {TENSES.find(t => t.value === completedVariant.tense)?.label}, {
                    Array.isArray(completedVariant.voice) 
                    ? completedVariant.voice.map(v => VOICES.find(x => x.value === v)?.label).join(' / ') 
                    : (VOICES.find(v => v.value === completedVariant.voice)?.label || (completedVariant.voice === 'midpass' ? 'Медиально-страдательный' : ''))
                  }, {NOUN_CASES.find(c => c.value === (Array.isArray(completedVariant.case) ? completedVariant.case[0] : completedVariant.case))?.label} падеж, {NUMBERS.find(n => n.value === (Array.isArray(completedVariant.number) ? completedVariant.number[0] : completedVariant.number))?.label} число, {GENDERS.find(g => g.value === (Array.isArray(completedVariant.gender) ? completedVariant.gender[0] : completedVariant.gender))?.label} род.</p>
                )}
              </div>
            )}
            
            {feedback === 'success' && (hasMultiplePaths || hasMultipleInternalVariants) && (
              <div className="mt-2 sm:mt-4 p-2.5 sm:p-4 bg-[#E8F3EB] border border-[#C5D9C8] rounded-lg text-xs sm:text-sm text-[#2D4A32] font-medium flex flex-col gap-2 text-left">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>Обратите внимание: эта форма многозначна.</span>
                </div>
                
                {hasMultiplePaths && (
                  <div className="flex flex-col gap-1.5 bg-white/50 p-2 sm:p-3 rounded border border-[#C5D9C8]/50">
                    <span className="font-bold opacity-70 mb-0.5">Разные грамматические пути:</span>
                    {currentVariants.map((v, idx) => (
                       <div key={idx} className="text-[11px] sm:text-xs">
                          • {isVariantInfinitive(v) ? 'Инфинитив' : v.pos === 'noun' ? 'Существительное' : v.pos === 'verb' ? 'Личный глагол' : v.pos === 'participle' ? 'Причастие' : v.pos === 'adjective' ? 'Прилагательное' : 'Местоимение'}: {
                             getRequiredCategories(v).filter(c => c !== 'pos').map(c => {
                                const val = v[c as keyof MorphologyWord];
                                const strVal = Array.isArray(val) ? val.map(x => CATEGORY_MAP[c]?.options.find(o=>o.value===x)?.label || x).join('/') : (CATEGORY_MAP[c]?.options.find(o=>o.value===val)?.label || val);
                                return `${CATEGORY_MAP[c]?.label}: ${strVal}`;
                             }).join(', ')
                          }
                       </div>
                    ))}
                  </div>
                )}

                {hasMultipleInternalVariants && !hasMultiplePaths && (
                  <div className="flex flex-col gap-1 text-[11px] sm:text-xs bg-white/50 p-2 sm:p-3 rounded border border-[#C5D9C8]/50">
                    <span className="font-bold opacity-70 mb-0.5">Варианты внутри этого разбора:</span>
                    {['case', 'gender', 'number', 'tense', 'voice', 'mood', 'person'].map(cat => {
                      if (completedVariant && Array.isArray(completedVariant[cat as keyof typeof completedVariant]) && (completedVariant[cat as keyof typeof completedVariant] as string[]).length > 1) {
                        const meta = CATEGORY_MAP[cat];
                        const vals = completedVariant[cat as keyof typeof completedVariant] as string[];
                        const labels = vals.map(v => meta?.options.find(o => o.value === v)?.label || v);
                        return (
                          <div key={cat} className="flex gap-1.5">
                            <span className="font-bold opacity-70 w-20 sm:w-24 shrink-0 text-right">{meta?.label}:</span>
                            <span className="font-semibold">{labels.join(' или ')}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xs border space-y-3 sm:space-y-6 transition-colors duration-500 ${feedback === 'success' ? 'bg-[#F4F9F5] border-[#C5D9C8]' : 'bg-white border-[#E5E1DA]'}`}>
            
            {renderOptionGroup('pos')}

            {showAdditionalCategories && (
              <div className="space-y-3 sm:space-y-6 border-t border-[#E5E1DA] pt-3 sm:pt-4 mt-3 sm:mt-4">
                {(() => {
                  let cats = requiredCategories.filter(cat => cat !== 'pos');
                  if (cats.includes('person') && cats.includes('number')) {
                    cats = cats.filter(c => c !== 'person' && c !== 'number');
                    cats.push('personNumber');
                  }
                  return cats.map(cat => renderOptionGroup(cat));
                })()}
              </div>
            )}

          </div>
        </div>
      </div>

      <div className={`fixed bottom-0 left-0 right-0 p-2.5 sm:p-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] border-t transition-colors ${
        feedback === 'success' 
          ? 'bg-[#F4F9F5] border-[#C5D9C8]' 
          : feedback === 'error'
          ? 'bg-[#FEF2F2] border-[#FECDD3]'
          : 'bg-white border-[#E5E1DA]'
      }`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {feedback === 'success' && (
            <div className="flex items-center gap-2 sm:gap-3 text-[#2D4A32]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-lg">Верно!</h3>
                <p className="text-xs sm:text-sm opacity-80">Отличный разбор.</p>
              </div>
            </div>
          )}
          
          {feedback === 'error' && (
            <div className="flex items-center gap-2 sm:gap-3 text-[#E11D48]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-2xs">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-lg">Ошибки:</h3>
                <ul className="text-[11px] sm:text-xs space-y-0.5 mt-0.5">
                  {errorDetails.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            </div>
          )}

          {feedback === 'idle' && <div className="flex-1" />}

          {feedback !== 'idle' && (
            <button
              onClick={handleNext}
              className={`px-5 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm transition-colors cursor-pointer ${
                feedback === 'success'
                  ? 'bg-[#2D4A32] text-white hover:bg-[#1E3322]'
                  : 'bg-[#E11D48] text-white hover:bg-[#BE123C]'
              }`}
            >
              Дальше
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
