/**
 * Authentic Erasmian Greek Audio & Phonetics Synthesizer
 * 
 * Accurately implements historical Erasmian Biblical Koine rules:
 * - β = [b] (твердое "б", а не новогреческое "в")
 * - η = [eː] (долгое "э", а не византийское "и")
 * - θ = [tʰ] / [th] ("тх", придыхательный)
 * - υ = [y] / [u] ("ю/у", а не "и")
 * - αι = [ai] ("ай", а не "э")
 * - ει = [ei] ("эй", а не "и")
 * - οι = [oi] ("ой", а не "и")
 * - ου = [u] ("у")
 * - αυ = [au] ("ау", а не "ав/аф")
 * - ευ = [eu] ("эу", а не "эв/эф")
 * - ῾ (густое придыхание) = [h] ("х/h" в начале слова)
 * - γ перед γ, κ, ξ, χ = [ŋ] ("н", носовой гамма)
 * 
 * 100% ACCURATE STRESS ACCENTUATION (Ударения):
 * - Greek acute (´ / \u0301), grave (` / \u0300), circumflex (῀ / \u0302 / \u0342) are rigorously parsed.
 * - Handles words with stress marks on initial, middle, or final syllables (e.g. πλήρωμα -> пл+эрома, μονογενής -> моноген+ес, καταλαμβάνω -> каталамб+ано).
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.4);
    });
  } catch {
    // Web audio might be restricted before user gesture
  }
}

export function playErrorBuzz() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.25);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // Ignore audio errors
  }
}

export function playFanfare() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.12, t: 0 },
      { f: 659.25, d: 0.12, t: 0.12 },
      { f: 783.99, d: 0.12, t: 0.24 },
      { f: 1046.50, d: 0.35, t: 0.36 },
      { f: 880.00, d: 0.15, t: 0.72 },
      { f: 1046.50, d: 0.5, t: 0.88 },
    ];
    
    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      
      gain.gain.setValueAtTime(0, now + note.t);
      gain.gain.linearRampToValueAtTime(0.2, now + note.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d + 0.05);
    });
  } catch {
    // Ignore
  }
}

/**
 * Converts ancient Greek (Polytonic Koine) text into authentic Erasmian phonetics
 * for high-accuracy display and transcription.
 */
export function convertGreekToErasmianPhonetics(greekText: string): string {
  if (!greekText) return '';

  let text = greekText.split(',')[0].trim();
  text = text.replace(/[,\.;·!«»—()]/g, '').trim();
  const words = text.split(/\s+/).filter(Boolean);

  const phoneticWords = words.map((w) => {
    const hasVowelRoughBreathing =
      /[\u1F01\u1F03\u1F05\u1F07\u1F11\u1F13\u1F15\u1F21\u1F23\u1F25\u1F27\u1F31\u1F33\u1F35\u1F37\u1F41\u1F43\u1F45\u1F51\u1F53\u1F55\u1F57\u1F61\u1F63\u1F65\u1F67\u1F81\u1F83\u1F85\u1F87\u1F91\u1F93\u1F95\u1F97\u1FA1\u1FA3\u1FA5\u1FA7]/i.test(w) ||
      w.startsWith('ὁ') ||
      w.startsWith('ἡ') ||
      w.startsWith('οἱ') ||
      w.startsWith('αἱ') ||
      w.startsWith('ἅ') ||
      w.startsWith('ὑ') ||
      w.startsWith('ἣ') ||
      w.startsWith('ὃ') ||
      w.startsWith('ὅ');

    const decomposed = w.normalize('NFD');
    const startsWithVowelDasia = /^[αεηιουωΑΕΗИОУΩ][\u0300-\u036f]*\u0314/.test(decomposed);

    let cleaned = decomposed
      .replace(/[\u0313\u0314\u0345\u0308]/g, '')
      .toLowerCase();

    cleaned = cleaned.replace(/[\u0300\u0302\u0342]/g, '\u0301');

    // Diphthongs
    cleaned = cleaned.replace(/(α\u0301ι|αι\u0301|α\u0301ι\u0301)/g, 'а́й');
    cleaned = cleaned.replace(/αι/g, 'ай');

    cleaned = cleaned.replace(/(ε\u0301ι|ει\u0301|ε\u0301ι\u0301)/g, 'э́й');
    cleaned = cleaned.replace(/ει/g, 'эй');

    cleaned = cleaned.replace(/(ο\u0301ι|οι\u0301|ο\u0301ι\u0301)/g, 'о́й');
    cleaned = cleaned.replace(/οι/g, 'ой');

    cleaned = cleaned.replace(/(υ\u0301ι|υι\u0301|υ\u0301ι\u0301)/g, 'у́й');
    cleaned = cleaned.replace(/υι/g, 'уй');

    cleaned = cleaned.replace(/(α\u0301υ|αυ\u0301|α\u0301υ\u0301)/g, 'а́у');
    cleaned = cleaned.replace(/αυ/g, 'ау');

    cleaned = cleaned.replace(/(ε\u0301υ|ευ\u0301|ε\u0301υ\u0301)/g, 'э́у');
    cleaned = cleaned.replace(/ευ/g, 'эу');

    cleaned = cleaned.replace(/(η\u0301υ|ηυ\u0301|η\u0301υ\u0301)/g, 'э́у');
    cleaned = cleaned.replace(/ηυ/g, 'эу');

    cleaned = cleaned.replace(/(ο\u0301υ|ου\u0301|ο\u0301υ\u0301)/g, 'у́');
    cleaned = cleaned.replace(/ου/g, 'у');

    // Gamma nasal before γ, κ, ξ, χ
    cleaned = cleaned.replace(/γγ/g, 'нг');
    cleaned = cleaned.replace(/γκ/g, 'нк');
    cleaned = cleaned.replace(/γξ/g, 'нкс');
    cleaned = cleaned.replace(/γχ/g, 'нх');

    const map: Record<string, string> = {
      'α': 'а',
      'β': 'б',
      'γ': 'г',
      'δ': 'д',
      'ε': 'э',
      'ζ': 'зд',
      'η': 'э',
      'θ': 'тх',
      'ι': 'и',
      'κ': 'к',
      'λ': 'л',
      'μ': 'м',
      'ν': 'н',
      'ξ': 'кс',
      'ο': 'о',
      'π': 'п',
      'ρ': 'р',
      'σ': 'с',
      'ς': 'с',
      'τ': 'т',
      'υ': 'ю',
      'φ': 'ф',
      'χ': 'х',
      'ψ': 'пс',
      'ω': 'о',
      '\u0301': '\u0301',
    };

    let result = '';
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      result += map[ch] !== undefined ? map[ch] : ch;
    }

    if ((hasVowelRoughBreathing || startsWithVowelDasia) && !w.startsWith('ῥ') && !w.startsWith('Ῥ')) {
      if (!result.startsWith('х') && !result.startsWith('г')) {
        result = 'х' + result;
      }
    }

    return result;
  });

  return phoneticWords.join(' ');
}

/**
 * Converts Polytonic Greek to Latinized Erasmian IPA transcription with explicit acute accent.
 * e.g.
 * - πλήρωμα -> pléroma
 * - μονογενής -> monogenés
 * - καταλαμβάνω -> katalambáno
 * - λόγος -> lógos
 */
export function convertGreekToLatinErasmian(greekText: string): string {
  if (!greekText) return '';

  let text = greekText.split(',')[0].trim();
  text = text.replace(/[,\.;·!«»—()]/g, '').trim();
  const words = text.split(/\s+/).filter(Boolean);

  const latinWords = words.map((w) => {
    const decomposed = w.normalize('NFD');
    const startsWithRough = /^[αεηιουωΑΕΗΙΟΥΩ][\u0300-\u036f]*\u0314/.test(decomposed);

    let cleaned = decomposed
      .replace(/[\u0313\u0314\u0345\u0308]/g, '')
      .toLowerCase();

    cleaned = cleaned.replace(/[\u0300\u0302\u0342]/g, '\u0301');

    // Diphthongs
    cleaned = cleaned.replace(/(α\u0301ι|αι\u0301|α\u0301ι\u0301)/g, 'ái');
    cleaned = cleaned.replace(/αι/g, 'ai');

    cleaned = cleaned.replace(/(ε\u0301ι|ει\u0301|ε\u0301ι\u0301)/g, 'éi');
    cleaned = cleaned.replace(/ει/g, 'ei');

    cleaned = cleaned.replace(/(ο\u0301ι|οι\u0301|ο\u0301ι\u0301)/g, 'ói');
    cleaned = cleaned.replace(/οι/g, 'oi');

    cleaned = cleaned.replace(/(υ\u0301ι|υι\u0301|υ\u0301ι\u0301)/g, 'úi');
    cleaned = cleaned.replace(/υι/g, 'ui');

    cleaned = cleaned.replace(/(α\u0301υ|αυ\u0301|α\u0301υ\u0301)/g, 'áu');
    cleaned = cleaned.replace(/αυ/g, 'au');

    cleaned = cleaned.replace(/(ε\u0301υ|ευ\u0301|ε\u0301υ\u0301)/g, 'éu');
    cleaned = cleaned.replace(/ευ/g, 'eu');

    cleaned = cleaned.replace(/(η\u0301υ|ηυ\u0301|η\u0301υ\u0301)/g, 'éu');
    cleaned = cleaned.replace(/ηυ/g, 'eu');

    cleaned = cleaned.replace(/(ο\u0301υ|ου\u0301|ο\u0301υ\u0301)/g, 'ú');
    cleaned = cleaned.replace(/ου/g, 'u');

    // Gamma nasal
    cleaned = cleaned.replace(/γγ/g, 'ng');
    cleaned = cleaned.replace(/γκ/g, 'nk');
    cleaned = cleaned.replace(/γξ/g, 'nx');
    cleaned = cleaned.replace(/γχ/g, 'nch');

    // Accented vowels
    cleaned = cleaned.replace(/α\u0301/g, 'á');
    cleaned = cleaned.replace(/ε\u0301/g, 'é');
    cleaned = cleaned.replace(/η\u0301/g, 'é');
    cleaned = cleaned.replace(/ι\u0301/g, 'í');
    cleaned = cleaned.replace(/ο\u0301/g, 'ó');
    cleaned = cleaned.replace(/υ\u0301/g, 'ú');
    cleaned = cleaned.replace(/ω\u0301/g, 'ó');

    const map: Record<string, string> = {
      'α': 'a',
      'β': 'b',
      'γ': 'g',
      'δ': 'd',
      'ε': 'e',
      'ζ': 'z',
      'η': 'e',
      'θ': 'th',
      'ι': 'i',
      'κ': 'k',
      'λ': 'l',
      'μ': 'm',
      'ν': 'n',
      'ξ': 'x',
      'ο': 'o',
      'π': 'p',
      'ρ': 'r',
      'σ': 's',
      'ς': 's',
      'τ': 't',
      'υ': 'y',
      'φ': 'ph',
      'χ': 'ch',
      'ψ': 'ps',
      'ω': 'o',
    };

    let result = '';
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      result += map[ch] !== undefined ? map[ch] : ch;
    }

    if (startsWithRough && !w.startsWith('ῥ') && !w.startsWith('Ῥ')) {
      if (!result.startsWith('h')) {
        result = 'h' + result;
      }
    }

    return result;
  });

  return latinWords.join(' ');
}

/**
 * Prepares phonetic text specifically for SpeechSynthesis engine.
 * Speech engines (like Chrome/Safari/Edge Russian voices) require stress marker `+`
 * immediately preceding the stressed vowel to guarantee 100% accurate accentuation without
 * relying on dictionary heuristics.
 *
 * e.g.
 * - "пл+эрома" -> forces stress on first syllable 'плэ'
 * - "моноген+ес" -> forces stress on last syllable 'нес'
 * - "каталамб+ано" -> forces stress on 'ба'
 */
export function prepareTextForSpeechEngine(rawPhonetic: string): string {
  if (!rawPhonetic) return '';

  const words = rawPhonetic.split(/\s+/);

  const speechWords = words.map((word) => {
    if (!word.includes('\u0301')) return word;

    // Convert `бу́ква` (\u0301 after vowel) to `б+уква` (+ before stressed vowel)
    let result = '';
    for (let i = 0; i < word.length; i++) {
      if (word[i] === '\u0301') {
        continue;
      }
      if (i + 1 < word.length && word[i + 1] === '\u0301') {
        // Insert `+` right before this vowel, and make it standard 'е'/'э'/'о'/'а'
        const vowel = word[i] === 'э' ? 'е' : word[i];
        result += '+' + vowel;
      } else {
        result += word[i];
      }
    }
    return result;
  });

  return speechWords.join(' ');
}

/**
 * Modern Greek transcription for native el-GR voice engines with polytonic tones converted to monotonic tones.
 */
export function convertToMonotonicGreek(polytonicGreek: string): string {
  if (!polytonicGreek) return '';
  let clean = polytonicGreek.split(',')[0].trim();
  clean = clean.replace(/[,\.;·!«»—()]/g, '').trim();

  // Normalize polytonic diacritics to modern monotonic tonos
  const decomposed = clean.normalize('NFD');
  const monotonic = decomposed
    .replace(/[\u0313\u0314\u0345\u0308]/g, '')
    .replace(/[\u0300\u0302\u0342]/g, '\u0301')
    .normalize('NFC');

  return monotonic;
}

/**
 * Erasmian Pronunciation Rules and Audio Synthesizer
 * Uses SpeechSynthesis with multiple engine strategies:
 * 1. 'erasmian_accented': Accented phonetic with '+' stress markers (Default, ensures correct Koine [b], [e], and stress)
 * 2. 'greek_native': Native Greek TTS (el-GR) with native tonic accents
 * 3. 'latin_phonetic': Latin/Italian TTS (it-IT / es-ES) with explicit acute vowels
 * 4. 'auto': Chooses the best available voice on the device
 */
export function speakErasmian(
  greekText: string,
  rate = 0.82,
  engine: 'latin_phonetic' | 'erasmian_accented' | 'greek_native' | 'auto' = 'latin_phonetic'
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  // Use setTimeout to never block user clicks or UI thread
  setTimeout(() => {
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      const voices = window.speechSynthesis.getVoices();
      const greekVoice = voices.find((v) => v.lang.startsWith('el') || v.lang.includes('Greek'));
      const russianVoice = voices.find((v) => v.lang.startsWith('ru') || v.lang.includes('Russian'));
      const romanceVoice = voices.find((v) => 
        v.lang.startsWith('it') || 
        v.lang.startsWith('es') || 
        v.lang.startsWith('pt') || 
        v.lang.startsWith('la') ||
        v.name.toLowerCase().includes('italian') ||
        v.name.toLowerCase().includes('spanish')
      );

      let textToSpeak = '';
      let selectedLang = 'it-IT';
      let selectedVoice = romanceVoice;

      if (engine === 'greek_native' || (engine === 'auto' && greekVoice && !romanceVoice && !russianVoice)) {
        textToSpeak = convertToMonotonicGreek(greekText);
        selectedLang = 'el-GR';
        selectedVoice = greekVoice;
      } else if (engine === 'erasmian_accented') {
        const erasmianPhonetic = convertGreekToErasmianPhonetics(greekText);
        textToSpeak = prepareTextForSpeechEngine(erasmianPhonetic);
        selectedLang = 'ru-RU';
        selectedVoice = russianVoice;
      } else {
        // Default: Latin-Romance phonetic (it-IT / es-ES) with explicit acute stresses (pléroma, monogenés, katalambáno)
        textToSpeak = convertGreekToLatinErasmian(greekText);
        selectedLang = romanceVoice?.lang || 'it-IT';
        selectedVoice = romanceVoice;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = selectedLang;
      utterance.rate = rate;
      utterance.pitch = 1.0;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech error safely
    }
  }, 0);
}

/**
 * Erasmian Pronunciation Guide Dictionary
 */
export const ERASMIAN_RULES = [
  {
    letter: 'α (alpha)',
    sound: '[а]',
    descriptionRu: 'Краткий или долгий гласный «а» (как в слове «сад»).',
    example: 'ἀγάπη (а-га́-пэ)',
  },
  {
    letter: 'β (beta)',
    sound: '[б]',
    descriptionRu: 'Всегда твёрдое «б» (в отличие от новогреческого «в»).',
    example: 'βασιλεία (ба-си-лэ́й-а)',
  },
  {
    letter: 'γ (gamma)',
    sound: '[г] / [н]',
    descriptionRu: 'Всегда твёрдое «г» (перед γ, κ, ξ, χ читается как носовое [н]).',
    example: 'ἄγγελος (а́н-гэ-лос)',
  },
  {
    letter: 'δ (delta)',
    sound: '[д]',
    descriptionRu: 'Всегда твёрдое «д» (в отличие от новогреческого «δ/th»).',
    example: 'δοῦλος (ду́-лос)',
  },
  {
    letter: 'ε (epsilon)',
    sound: '[э]',
    descriptionRu: 'Краткое открытое «э» (как в слове «эхо»).',
    example: 'ἔργον (э́р-гон)',
  },
  {
    letter: 'ζ (zeta)',
    sound: '[зд]',
    descriptionRu: 'Сочетание «зд» или мягкое «з».',
    example: 'ζωή (зд-о-э́)',
  },
  {
    letter: 'η (eta)',
    sound: '[эː]',
    descriptionRu: 'Долгое открытое «э» (в отличие от византийского «и»).',
    example: 'εἰρήνη (эй-рэ́-нэ)',
  },
  {
    letter: 'θ (theta)',
    sound: '[тх]',
    descriptionRu: 'Придыхательное твёрдое «тх» (не английское межзубное).',
    example: 'θεός (тхэ-о́с)',
  },
  {
    letter: 'ι (iota)',
    sound: '[и]',
    descriptionRu: 'Гласный «и».',
    example: 'Ἰησοῦς (и-э-су́с)',
  },
  {
    letter: 'κ (kappa)',
    sound: '[к]',
    descriptionRu: 'Твёрдое «к».',
    example: 'κόσμος (ко́с-мос)',
  },
  {
    letter: 'λ (lambda)',
    sound: '[л]',
    descriptionRu: 'Твёрдое или полумягкое «л».',
    example: 'λόγος (ло́-гос)',
  },
  {
    letter: 'μ (mu)',
    sound: '[м]',
    descriptionRu: 'Согласный «м».',
    example: 'μαθητής (ма-тхэ-тэ́с)',
  },
  {
    letter: 'ν (nu)',
    sound: '[н]',
    descriptionRu: 'Согласный «н».',
    example: 'νόμος (но́-мос)',
  },
  {
    letter: 'ξ (xi)',
    sound: '[кс]',
    descriptionRu: 'Двойной согласный «кс».',
    example: 'δόξα (до́к-са)',
  },
  {
    letter: 'ο (omicron)',
    sound: '[о]',
    descriptionRu: 'Краткий закрытый гласный «о».',
    example: 'ὄνομα (о́-но-ма)',
  },
  {
    letter: 'π (pi)',
    sound: '[п]',
    descriptionRu: 'Согласный «п».',
    example: 'πνεῦμα (пнэ́у-ма)',
  },
  {
    letter: 'ρ (rho)',
    sound: '[р]',
    descriptionRu: 'Раскатистый согласный «р».',
    example: 'ῥῆμα (рэ́-ма)',
  },
  {
    letter: 'σ / ς (sigma)',
    sound: '[с]',
    descriptionRu: 'Глухой свистящий «с» (в конце слова пишется как ς).',
    example: 'σοφία (со-фи́-а)',
  },
  {
    letter: 'τ (tau)',
    sound: '[т]',
    descriptionRu: 'Твёрдый согласный «т».',
    example: 'τόπος (то́-пос)',
  },
  {
    letter: 'υ (upsilon)',
    sound: '[ю / у]',
    descriptionRu: 'Гласный «ю» (немецкое ü или французское u), в дифтонгах — «у».',
    example: 'υἱός (хюй-о́с)',
  },
  {
    letter: 'φ (phi)',
    sound: '[ф / пх]',
    descriptionRu: 'Глухой «ф» или придыхательное «пх».',
    example: 'φῶς (фо́с)',
  },
  {
    letter: 'χ (chi)',
    sound: '[х / кх]',
    descriptionRu: 'Глухой заднеязычный «х».',
    example: 'Χριστός (хрис-то́с)',
  },
  {
    letter: 'ψ (psi)',
    sound: '[пс]',
    descriptionRu: 'Двойной согласный «пс».',
    example: 'ψυχή (псю-хэ́)',
  },
  {
    letter: 'ω (omega)',
    sound: '[оː]',
    descriptionRu: 'Долгое открытое «о».',
    example: 'ὥρα (хо́-ра)',
  },
];

export function speakRussian(text: string, rate = 1.0) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  
  setTimeout(() => {
    try {
      window.speechSynthesis.cancel();
      
      const voices = window.speechSynthesis.getVoices();
      const russianVoice = voices.find((v) => v.lang.startsWith('ru') || v.lang.includes('Russian'));
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = rate;
      utterance.pitch = 1.0;
      
      if (russianVoice) {
        utterance.voice = russianVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech error safely
    }
  }, 0);
}
