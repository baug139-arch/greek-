const fs = require('fs');

const verbs = [
  { lemma: 'ἀγαπάω', form: 'ἠγάπησεν', trans: 'он возлюбил', t: 'aor', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ἄγω', form: 'ἄγετε', trans: 'вы ведете / ведите', t: 'pres', v: 'act', m: ['ind', 'impv'], p: '2', n: 'pl' },
  { lemma: 'αἴρω', form: 'ἆρον', trans: 'возьми', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'αἰτέω', form: 'αἰτοῦμεν', trans: 'мы просим', t: 'pres', v: 'act', m: 'ind', p: '1', n: 'pl' },
  { lemma: 'ἀκολουθέω', form: 'ἠκολούθει', trans: 'он следовал', t: 'impf', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ἀναβαίνω', form: 'ἀναβέβηκεν', trans: 'он взошел', t: 'perf', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ἀνίστημι', form: 'ἀναστήτω', trans: 'пусть он встанет', t: 'aor', v: 'act', m: 'impv', p: '3', n: 'sg' },
  { lemma: 'ἀνοίγω', form: 'ἀνοιγήσεται', trans: 'откроется', t: 'fut', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ἀπέρχομαι', form: 'ἀπέλθωμεν', trans: 'пойдем / давайте пойдем', t: 'aor', v: 'act', m: 'subj', p: '1', n: 'pl' },
  { lemma: 'ἀποθνῄσκω', form: 'ἀπέθανεν', trans: 'он умер', t: 'aor', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ἀποκρίνομαι', form: 'ἀπεκρίθη', trans: 'он ответил', t: 'aor', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ἀποκτείνω', form: 'ἀποκτανθῆναι', trans: 'быть убитым', t: 'aor', v: 'pass', m: 'inf' },
  { lemma: 'ἀπόλλυμι', form: 'ἀπόληται', trans: 'погибнет', t: 'aor', v: 'mid', m: 'subj', p: '3', n: 'sg' },
  { lemma: 'ἀπολύω', form: 'ἀπολύειν', trans: 'отпускать', t: 'pres', v: 'act', m: 'inf' },
  { lemma: 'ἀποστέλλω', form: 'ἀπεστάλη', trans: 'он был послан', t: 'aor', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ἄρχω / ἄρχομαι', form: 'ἄρξομαι', trans: 'я начну', t: 'fut', v: 'mid', m: 'ind', p: '1', n: 'sg', l2: 'ἄρχω' },
  { lemma: 'ἀσπάζομαι', form: 'ἀσπάσασθε', trans: 'приветствуйте', t: 'aor', v: 'mid', m: 'impv', p: '2', n: 'pl' },
  { lemma: 'ἀφίημι', form: 'ἀφέωνται', trans: 'прощены', t: 'perf', v: 'pass', m: 'ind', p: '3', n: 'pl' },
  { lemma: 'βάλλω', form: 'βάλε', trans: 'брось', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'βαπτίζω', form: 'βαπτισθήτω', trans: 'да крестится', t: 'aor', v: 'pass', m: 'impv', p: '3', n: 'sg' },
  { lemma: 'βλέπω', form: 'βλέπεις', trans: 'ты видишь', t: 'pres', v: 'act', m: 'ind', p: '2', n: 'sg' },
  { lemma: 'γεννάω', form: 'γεγέννηται', trans: 'рожден', t: 'perf', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'γίνομαι', form: 'γένοιτο', trans: 'да будет', t: 'aor', v: 'mid', m: 'opt', p: '3', n: 'sg' },
  { lemma: 'γινώσκω', form: 'γνώσεσθε', trans: 'вы узнаете', t: 'fut', v: 'mid', m: 'ind', p: '2', n: 'pl' },
  { lemma: 'γράφω', form: 'γέγραπται', trans: 'написано', t: 'perf', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'δεῖ', form: 'ἔδει', trans: 'надлежало', t: 'impf', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'δέχομαι', form: 'δέξαι', trans: 'прими', t: 'aor', v: 'mid', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'διδάσκω', form: 'ἐδίδασκεν', trans: 'он учил', t: 'impf', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'δίδωμι', form: 'δός', trans: 'дай', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'δοκέω', form: 'δοκεῖ', trans: 'кажется', t: 'pres', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'δοξάζω', form: 'δοξασθῇ', trans: 'прославится / пусть прославится', t: 'aor', v: 'pass', m: 'subj', p: '3', n: 'sg' },
  { lemma: 'δύναμαι', form: 'δύνασαι', trans: 'ты можешь', t: 'pres', v: ['mid', 'pass'], m: 'ind', p: '2', n: 'sg' },
  { lemma: 'ἐγείρω', form: 'ἐγήγερται', trans: 'воскрес', t: 'perf', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'εἰμί', form: 'ἦσαν', trans: 'они были', t: 'impf', v: 'act', m: 'ind', p: '3', n: 'pl' },
  { lemma: 'εἰσέρχομαι', form: 'εἰσέλθωμεν', trans: 'давайте войдем', t: 'aor', v: 'act', m: 'subj', p: '1', n: 'pl' },
  { lemma: 'ἐκβάλλω', form: 'ἐκβάλλειν', trans: 'изгонять', t: 'pres', v: 'act', m: 'inf' },
  { lemma: 'ἐξέρχομαι', form: 'ἐξελήλυθεν', trans: 'он вышел', t: 'perf', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ἐπερωτάω', form: 'ἐπηρώτων', trans: 'они спрашивали', t: 'impf', v: 'act', m: 'ind', p: '3', n: 'pl' },
  { lemma: 'ἔρχομαι', form: 'ἐλεύσονται', trans: 'они придут', t: 'fut', v: 'mid', m: 'ind', p: '3', n: 'pl' },
  { lemma: 'ἐρωτάω', form: 'ἐρωτῶ', trans: 'я прошу', t: 'pres', v: 'act', m: 'ind', p: '1', n: 'sg' },
  { lemma: 'ἐσθίω', form: 'φάγετε', trans: 'ешьте', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'pl' },
  { lemma: 'εὐαγγελίζω', form: 'εὐηγγελισάμην', trans: 'я благовествовал', t: 'aor', v: 'mid', m: 'ind', p: '1', n: 'sg' },
  { lemma: 'εὑρίσκω', form: 'εὑρέθη', trans: 'был найден', t: 'aor', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ἔχω', form: 'ἕξουσιν', trans: 'они будут иметь', t: 'fut', v: 'act', m: 'ind', p: '3', n: 'pl' },
  { lemma: 'ζάω', form: 'ζῇ', trans: 'он живет', t: 'pres', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ζητέω', form: 'ζητεῖτε', trans: 'вы ищете / ищите', t: 'pres', v: 'act', m: ['ind', 'impv'], p: '2', n: 'pl' },
  { lemma: 'θέλω', form: 'ἠθέλησεν', trans: 'он захотел', t: 'aor', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'θεωρέω', form: 'θεωρεῖν', trans: 'созерцать / смотреть', t: 'pres', v: 'act', m: 'inf' },
  { lemma: 'ἵστημι', form: 'στῆναι', trans: 'встать', t: 'aor', v: 'act', m: 'inf' },
  { lemma: 'κάθημαι', form: 'κάθου', trans: 'сиди', t: 'pres', v: 'mid', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'καλέω', form: 'ἐκλήθη', trans: 'был назван', t: 'aor', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'καταβαίνω', form: 'κατάβηθι', trans: 'сойди', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'κηρύσσω', form: 'κηρυχθῆναι', trans: 'быть проповеданным', t: 'aor', v: 'pass', m: 'inf' },
  { lemma: 'κράζω', form: 'ἔκραξαν', trans: 'они закричали', t: 'aor', v: 'act', m: 'ind', p: '3', n: 'pl' },
  { lemma: 'κρίνω', form: 'κρίνετε', trans: 'вы судите / судите', t: 'pres', v: 'act', m: ['ind', 'impv'], p: '2', n: 'pl' },
  { lemma: 'λαλέω', form: 'λελάληκα', trans: 'я сказал', t: 'perf', v: 'act', m: 'ind', p: '1', n: 'sg' },
  { lemma: 'λαμβάνω', form: 'λήμψεται', trans: 'он получит', t: 'fut', v: 'mid', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'λέγω', form: 'εἴπω', trans: 'скажу', t: 'aor', v: 'act', m: 'subj', p: '1', n: 'sg' },
  { lemma: 'μαρτυρέω', form: 'μεμαρτύρηκεν', trans: 'он засвидетельствовал', t: 'perf', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'μέλλω', form: 'ἔμελλον', trans: 'я намеревался', t: 'impf', v: 'act', m: 'ind', p: '1', n: 'sg' },
  { lemma: 'μένω', form: 'μείνατε', trans: 'пребудьте', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'pl' },
  { lemma: 'οἶδα', form: 'οἴδαμεν', trans: 'мы знаем', t: 'perf', v: 'act', m: 'ind', p: '1', n: 'pl' },
  { lemma: 'ὁράω', form: 'ὄψεσθε', trans: 'вы увидите', t: 'fut', v: 'mid', m: 'ind', p: '2', n: 'pl' },
  { lemma: 'παραδίδωμι', form: 'παραδοθῆναι', trans: 'быть преданным', t: 'aor', v: 'pass', m: 'inf' },
  { lemma: 'παρακαλέω', form: 'παρακαλῶ', trans: 'прошу', t: 'pres', v: 'act', m: 'ind', p: '1', n: 'sg' },
  { lemma: 'πείθω', form: 'πέποιθα', trans: 'я уверен / убежден', t: 'perf', v: 'act', m: 'ind', p: '1', n: 'sg' },
  { lemma: 'πέμπω', form: 'πέμψω', trans: 'я пошлю', t: 'fut', v: 'act', m: 'ind', p: '1', n: 'sg' },
  { lemma: 'περιπατέω', form: 'περιπατεῖ', trans: 'он ходит', t: 'pres', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'πίνω', form: 'πίετε', trans: 'пейте', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'pl' },
  { lemma: 'πίπτω', form: 'ἔπεσον', trans: 'я упал', t: 'aor', v: 'act', m: 'ind', p: '1', n: 'sg' },
  { lemma: 'πιστεύω', form: 'πίστευσον', trans: 'поверь', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'πληρόω', form: 'πεπλήρωται', trans: 'исполнено', t: 'perf', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'ποιέω', form: 'ποιήσωμεν', trans: 'сделаем / давайте сделаем', t: 'aor', v: 'act', m: 'subj', p: '1', n: 'pl' },
  { lemma: 'πορεύομαι', form: 'πορεύου', trans: 'иди', t: 'pres', v: ['mid', 'pass'], m: 'impv', p: '2', n: 'sg' },
  { lemma: 'προσέρχομαι', form: 'προσῆλθον', trans: 'я подошел', t: 'aor', v: 'act', m: 'ind', p: '1', n: 'sg' },
  { lemma: 'προσεύχομαι', form: 'προσεύξασθε', trans: 'молитесь', t: 'aor', v: 'mid', m: 'impv', p: '2', n: 'pl' },
  { lemma: 'προσκυνέω', form: 'προσκυνήσουσιν', trans: 'они поклонятся', t: 'fut', v: 'act', m: 'ind', p: '3', n: 'pl' },
  { lemma: 'σπείρω', form: 'ἐσπάρη', trans: 'посеян', t: 'aor', v: 'pass', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'συνάγω', form: 'συνήχθησαν', trans: 'они собрались', t: 'aor', v: 'pass', m: 'ind', p: '3', n: 'pl' },
  { lemma: 'σῴζω', form: 'σέσωκεν', trans: 'спас(ла)', t: 'perf', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'τηρέω', form: 'τήρησον', trans: 'сохрани', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'τίθημι', form: 'θές', trans: 'положи', t: 'aor', v: 'act', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'ὑπάγω', form: 'ὕπαγε', trans: 'иди', t: 'pres', v: 'act', m: 'impv', p: '2', n: 'sg' },
  { lemma: 'φέρω', form: 'ἤνεγκεν', trans: 'он принес', t: 'aor', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'φημί', form: 'ἔφη', trans: 'он сказал', t: 'aor', v: 'act', m: 'ind', p: '3', n: 'sg' },
  { lemma: 'φοβέομαι', form: 'φοβοῦ', trans: 'бойся', t: 'pres', v: ['mid', 'pass'], m: 'impv', p: '2', n: 'sg' },
  { lemma: 'χαίρω', form: 'χαίρετε', trans: 'радуйтесь', t: 'pres', v: 'act', m: 'impv', p: '2', n: 'pl' },
];

let extraDb = fs.readFileSync('src/data/morphologyExtra.ts', 'utf8');

let appendStr = '';
let cId = 100;

for (const v of verbs) {
  const actualLemma = v.l2 || v.lemma; // Use l2 if provided, else lemma
  const lemmaEng = actualLemma
    .replace('ἡ', 'he').replace('έ', 'e').replace('ρ', 'r').replace('α', 'a').replace('η', 'e')
    .replace('μ', 'm').replace('θ', 'th').replace('τ', 't').replace('ς', 's').replace('ή', 'e')
    .replace('ἔ', 'e').replace('γ', 'g').replace('ο', 'o').replace('ν', 'n')
    .replace('π', 'p').replace('ύ', 'y').replace('λ', 'l').replace('έ', 'e')
    .replace('ε', 'e').replace('ῦ', 'eu').replace('ὄ', 'o').replace('ί', 'i')
    .replace('ἀ', 'a').replace('ή', 'e').replace('έ', 'e')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
  const idStr = `m_v_${lemmaEng}_${cId++}`;
  
  const mStr = Array.isArray(v.m) ? `['${v.m.join("', '")}']` : `'${v.m}'`;
  const vStr = Array.isArray(v.v) ? `['${v.v.join("', '")}']` : `'${v.v}'`;
  
  let line = `  { id: '${idStr}', form: '${v.form}', stem: '', ending: '', lemma: '${v.lemma}', translation: '${v.trans}', pos: 'verb', tense: '${v.t}', voice: ${vStr}, mood: ${mStr}`;
  if (v.p) {
    const pStr = Array.isArray(v.p) ? `['${v.p.join("', '")}']` : `'${v.p}'`;
    line += `, person: ${pStr}`;
  }
  if (v.n) {
    const nStr = Array.isArray(v.n) ? `['${v.n.join("', '")}']` : `'${v.n}'`;
    line += `, number: ${nStr}`;
  }
  line += ` },\n`;
  appendStr += line;
}

const closingIndex = extraDb.lastIndexOf('];');
if (closingIndex !== -1) {
  extraDb = extraDb.substring(0, closingIndex) + appendStr + extraDb.substring(closingIndex);
  fs.writeFileSync('src/data/morphologyExtra.ts', extraDb);
  console.log('Successfully wrote new verbs to morphologyExtra.ts');
} else {
  console.log('Could not find ]; in morphologyExtra.ts');
}
