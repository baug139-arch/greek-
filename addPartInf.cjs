const fs = require('fs');

const extra = [
  // 1
  { lemma: 'ἀγαπάω', form: 'ἀγαπᾶν', trans: 'любить', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'ἀγαπάω', form: 'ἀγαπήσας', trans: 'возлюбивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 2
  { lemma: 'ἄγω', form: 'ἄγειν', trans: 'вести', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'ἄγω', form: 'ἀγαγών', trans: 'приведший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 3
  { lemma: 'αἴρω', form: 'ἆραι', trans: 'взять / поднять', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'αἴρω', form: 'ἄρας', trans: 'взявший / поднявший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 4
  { lemma: 'αἰτέω', form: 'αἰτεῖν', trans: 'просить', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'αἰτέω', form: 'αἰτῶν', trans: 'просящий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 5
  { lemma: 'ἀκολουθέω', form: 'ἀκολουθεῖν', trans: 'следовать', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'ἀκολουθέω', form: 'ἀκολουθῶν', trans: 'следующий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 6
  { lemma: 'ἀναβαίνω', form: 'ἀναβῆναι', trans: 'взойти', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀναβαίνω', form: 'ἀναβάς', trans: 'взошедший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 7
  { lemma: 'ἀνίστημι', form: 'ἀναστῆναι', trans: 'встать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀνίστημι', form: 'ἀναστάς', trans: 'вставший / воскресший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 8
  { lemma: 'ἀνοίγω', form: 'ἀνοῖξαι', trans: 'открыть', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀνοίγω', form: 'ἀνοίξας', trans: 'открывший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 9
  { lemma: 'ἀπέρχομαι', form: 'ἀπελθεῖν', trans: 'уйти', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀπέρχομαι', form: 'ἀπελθών', trans: 'ушедший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 10
  { lemma: 'ἀποθνῄσκω', form: 'ἀποθανεῖν', trans: 'умереть', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀποθνῄσκω', form: 'ἀποθανών', trans: 'умерший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 11
  { lemma: 'ἀποκρίνομαι', form: 'ἀποκριθῆναι', trans: 'ответить (быть отвеченным)', pos: 'verb', tense: 'aor', voice: 'pass', mood: 'inf' },
  { lemma: 'ἀποκρίνομαι', form: 'ἀποκριθείς', trans: 'ответивший (страд. форма, актив. значение)', pos: 'participle', tense: 'aor', voice: 'pass', case: 'nom', gender: 'm', number: 'sg' },
  // 12
  { lemma: 'ἀποκτείνω', form: 'ἀποκτεῖναι', trans: 'убить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀποκτείνω', form: 'ἀποκτείνας', trans: 'убивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 13
  { lemma: 'ἀπόλλυμι', form: 'ἀπολέσαι', trans: 'погубить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀπόλλυμι', form: 'ἀπολέσας', trans: 'погубивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 14
  { lemma: 'ἀπολύω', form: 'ἀπολῦσαι', trans: 'отпустить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀπολύω', form: 'ἀπολύσας', trans: 'отпустивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 15
  { lemma: 'ἀποστέλλω', form: 'ἀποστεῖλαι', trans: 'послать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀποστέλλω', form: 'ἀποστείλας', trans: 'пославший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 16
  { lemma: 'ἄρχω / ἄρχομαι', form: 'ἄρξασθαι', trans: 'начать', pos: 'verb', tense: 'aor', voice: 'mid', mood: 'inf' },
  { lemma: 'ἄρχω / ἄρχομαι', form: 'ἀρξάμενος', trans: 'начавший', pos: 'participle', tense: 'aor', voice: 'mid', case: 'nom', gender: 'm', number: 'sg' },
  // 17
  { lemma: 'ἀσπάζομαι', form: 'ἀσπάσασθαι', trans: 'приветствовать', pos: 'verb', tense: 'aor', voice: 'mid', mood: 'inf' },
  { lemma: 'ἀσπάζομαι', form: 'ἀσπασάμενος', trans: 'приветствовавший', pos: 'participle', tense: 'aor', voice: 'mid', case: 'nom', gender: 'm', number: 'sg' },
  // 18
  { lemma: 'ἀφίημι', form: 'ἀφεῖναι', trans: 'простить / оставить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἀφίημι', form: 'ἀφείς', trans: 'простивший / оставивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 19
  { lemma: 'βάλλω', form: 'βαλεῖν', trans: 'бросить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'βάλλω', form: 'βαλών', trans: 'бросивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 20
  { lemma: 'βαπτίζω', form: 'βαπτίσαι', trans: 'крестить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'βαπτίζω', form: 'βαπτίσας', trans: 'крестивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 21
  { lemma: 'βλέπω', form: 'βλέπειν', trans: 'видеть / смотреть', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'βλέπω', form: 'βλέπων', trans: 'видящий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 22
  { lemma: 'γεννάω', form: 'γεννῆσαι', trans: 'родить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'γεννάω', form: 'γεννήσας', trans: 'родивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 23
  { lemma: 'γίνομαι', form: 'γενέσθαι', trans: 'стать / произойти', pos: 'verb', tense: 'aor', voice: 'mid', mood: 'inf' },
  { lemma: 'γίνομαι', form: 'γενόμενος', trans: 'ставший / произошедший', pos: 'participle', tense: 'aor', voice: 'mid', case: 'nom', gender: 'm', number: 'sg' },
  // 24
  { lemma: 'γινώσκω', form: 'γνῶναι', trans: 'узнать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'γινώσκω', form: 'γνούς', trans: 'узнавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 25
  { lemma: 'γράφω', form: 'γράψαι', trans: 'написать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'γράφω', form: 'γράψας', trans: 'написавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 26
  { lemma: 'δέχομαι', form: 'δέξασθαι', trans: 'принять', pos: 'verb', tense: 'aor', voice: 'mid', mood: 'inf' },
  { lemma: 'δέχομαι', form: 'δεξάμενος', trans: 'принявший', pos: 'participle', tense: 'aor', voice: 'mid', case: 'nom', gender: 'm', number: 'sg' },
  // 27
  { lemma: 'διδάσκω', form: 'διδάξαι', trans: 'научить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'διδάσκω', form: 'διδάξας', trans: 'научивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 28
  { lemma: 'δίδωμι', form: 'δοῦναι', trans: 'дать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'δίδωμι', form: 'δούς', trans: 'давший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 29
  { lemma: 'δοκέω', form: 'δοκεῖν', trans: 'думать / казаться', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'δοκέω', form: 'δοκῶν', trans: 'думающий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 30
  { lemma: 'δοξάζω', form: 'δοξάσαι', trans: 'прославить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'δοξάζω', form: 'δοξάσας', trans: 'прославивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 31
  { lemma: 'δύναμαι', form: 'δύνασθαι', trans: 'мочь / быть способным', pos: 'verb', tense: 'pres', voice: ['mid', 'pass'], mood: 'inf' },
  { lemma: 'δύναμαι', form: 'δυνάμενος', trans: 'могущий', pos: 'participle', tense: 'pres', voice: ['mid', 'pass'], case: 'nom', gender: 'm', number: 'sg' },
  // 32
  { lemma: 'ἐγείρω', form: 'ἐγεῖραι', trans: 'поднять / воскресить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἐγείρω', form: 'ἐγείρας', trans: 'поднявший / воскресивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 33
  { lemma: 'εἰμί', form: 'εἶναι', trans: 'быть', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'εἰμί', form: 'ὤν', trans: 'сущий / будучи', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 34
  { lemma: 'εἰσέρχομαι', form: 'εἰσελθεῖν', trans: 'войти', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'εἰσέρχομαι', form: 'εἰσελθών', trans: 'вошедший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 35
  { lemma: 'ἐκβάλλω', form: 'ἐκβαλεῖν', trans: 'изгнать / выгнать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἐκβάλλω', form: 'ἐκβαλών', trans: 'изгнавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 36
  { lemma: 'ἐξέρχομαι', form: 'ἐξελθεῖν', trans: 'выйти', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἐξέρχομαι', form: 'ἐξελθών', trans: 'вышедший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 37
  { lemma: 'ἐπερωτάω', form: 'ἐπερωτῆσαι', trans: 'спросить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἐπερωτάω', form: 'ἐπερωτήσας', trans: 'спросивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 38
  { lemma: 'ἔρχομαι', form: 'ἐλθεῖν', trans: 'прийти', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἔρχομαι', form: 'ἐλθών', trans: 'пришедший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 39
  { lemma: 'ἐρωτάω', form: 'ἐρωτῆσαι', trans: 'попросить / спросить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἐρωτάω', form: 'ἐρωτήσας', trans: 'попросивший / спросивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 40
  { lemma: 'ἐσθίω', form: 'φαγεῖν', trans: 'поесть', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἐσθίω', form: 'φαγών', trans: 'поевший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 41
  { lemma: 'εὐαγγελίζω', form: 'εὐαγγελίσασθαι', trans: 'благовествовать', pos: 'verb', tense: 'aor', voice: 'mid', mood: 'inf' },
  { lemma: 'εὐαγγελίζω', form: 'εὐαγγελισάμενος', trans: 'благовествовавший', pos: 'participle', tense: 'aor', voice: 'mid', case: 'nom', gender: 'm', number: 'sg' },
  // 42
  { lemma: 'εὑρίσκω', form: 'εὑρεῖν', trans: 'найти', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'εὑρίσκω', form: 'εὑρών', trans: 'нашедший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 43
  { lemma: 'ἔχω', form: 'ἔχειν', trans: 'иметь', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'ἔχω', form: 'ἔχων', trans: 'имеющий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 44
  { lemma: 'ζάω', form: 'ζῆν', trans: 'жить', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'ζάω', form: 'ζῶν', trans: 'живущий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 45
  { lemma: 'ζητέω', form: 'ζητεῖν', trans: 'искать', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'ζητέω', form: 'ζητῶν', trans: 'ищущий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 46
  { lemma: 'θέλω', form: 'θελῆσαι', trans: 'захотеть', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'θέλω', form: 'θελήσας', trans: 'захотевший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 47
  { lemma: 'θεωρέω', form: 'θεωρεῖν', trans: 'смотреть / созерцать', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'θεωρέω', form: 'θεωρῶν', trans: 'смотрящий / созерцающий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 48
  { lemma: 'ἵστημι', form: 'στῆναι', trans: 'встать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ἵστημι', form: 'στάς', trans: 'вставший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 49
  { lemma: 'κάθημαι', form: 'καθῆσθαι', trans: 'сидеть', pos: 'verb', tense: 'pres', voice: ['mid', 'pass'], mood: 'inf' },
  { lemma: 'κάθημαι', form: 'καθήμενος', trans: 'сидящий', pos: 'participle', tense: 'pres', voice: ['mid', 'pass'], case: 'nom', gender: 'm', number: 'sg' },
  // 50
  { lemma: 'καλέω', form: 'καλέσαι', trans: 'позвать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'καλέω', form: 'καλέσας', trans: 'позвавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 51
  { lemma: 'καταβαίνω', form: 'καταβῆναι', trans: 'спуститься', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'καταβαίνω', form: 'καταβάς', trans: 'спустившийся', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 52
  { lemma: 'κηρύσσω', form: 'κηρύξαι', trans: 'проповедовать (аор)', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'κηρύσσω', form: 'κηρύξας', trans: 'проповедовавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 53
  { lemma: 'κράζω', form: 'κράξαι', trans: 'закричать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'κράζω', form: 'κράξας', trans: 'закричавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 54
  { lemma: 'κρίνω', form: 'κρῖναι', trans: 'осудить / решить (аор)', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'κρίνω', form: 'κρίνας', trans: 'осудивший / решивший (аор)', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 55
  { lemma: 'λαλέω', form: 'λαλῆσαι', trans: 'сказать / заговорить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'λαλέω', form: 'λαλήσας', trans: 'сказавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 56
  { lemma: 'λαμβάνω', form: 'λαβεῖν', trans: 'взять', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'λαμβάνω', form: 'λαβών', trans: 'взявший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 57
  { lemma: 'λέγω', form: 'εἰπεῖν', trans: 'сказать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'λέγω', form: 'εἰπών', trans: 'сказавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 58
  { lemma: 'μαρτυρέω', form: 'μαρτυρῆσαι', trans: 'засвидетельствовать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'μαρτυρέω', form: 'μαρτυρήσας', trans: 'засвидетельствовавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 59
  { lemma: 'μέλλω', form: 'μέλλειν', trans: 'намереваться', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'μέλλω', form: 'μέλλων', trans: 'намеревающийся', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 60
  { lemma: 'μένω', form: 'μεῖναι', trans: 'остаться', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'μένω', form: 'μείνας', trans: 'оставшийся', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 61
  { lemma: 'οἶδα', form: 'εἰδέναι', trans: 'знать', pos: 'verb', tense: 'perf', voice: 'act', mood: 'inf' },
  { lemma: 'οἶδα', form: 'εἰδώς', trans: 'знающий', pos: 'participle', tense: 'perf', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 62
  { lemma: 'ὁράω', form: 'ἰδεῖν', trans: 'увидеть', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ὁράω', form: 'ἰδών', trans: 'увидевший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 63
  { lemma: 'παραδίδωμι', form: 'παραδοῦναι', trans: 'предать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'παραδίδωμι', form: 'παραδούς', trans: 'предавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 64
  { lemma: 'παρακαλέω', form: 'παρακαλέσαι', trans: 'утешить / попросить (аор)', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'παρακαλέω', form: 'παρακαλέσας', trans: 'утешивший / попросивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 65
  { lemma: 'πείθω', form: 'πεῖσαι', trans: 'убедить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'πείθω', form: 'πείσας', trans: 'убедивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 66
  { lemma: 'πέμπω', form: 'πέμψαι', trans: 'послать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'πέμπω', form: 'πέμψας', trans: 'пославший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 67
  { lemma: 'περιπατέω', form: 'περιπατεῖν', trans: 'ходить', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'περιπατέω', form: 'περιπατῶν', trans: 'ходящий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 68
  { lemma: 'πίνω', form: 'πιεῖν', trans: 'выпить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'πίνω', form: 'πιών', trans: 'выпивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 69
  { lemma: 'πίπτω', form: 'πεσεῖν', trans: 'упасть', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'πίπτω', form: 'πεσών', trans: 'упавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 70
  { lemma: 'πιστεύω', form: 'πιστεῦσαι', trans: 'поверить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'πιστεύω', form: 'πιστεύσας', trans: 'поверивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 71
  { lemma: 'πληρόω', form: 'πληρῶσαι', trans: 'исполнить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'πληρόω', form: 'πληρώσας', trans: 'исполнивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 72
  { lemma: 'ποιέω', form: 'ποιῆσαι', trans: 'сделать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'ποιέω', form: 'ποιήσας', trans: 'сделавший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 73
  { lemma: 'πορεύομαι', form: 'πορευθῆναι', trans: 'пойти / отправиться (быть отправленным)', pos: 'verb', tense: 'aor', voice: 'pass', mood: 'inf' },
  { lemma: 'πορεύομαι', form: 'πορευθείς', trans: 'отправившийся (страд. форма, актив. значение)', pos: 'participle', tense: 'aor', voice: 'pass', case: 'nom', gender: 'm', number: 'sg' },
  // 74
  { lemma: 'προσέρχομαι', form: 'προσελθεῖν', trans: 'подойти', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'προσέρχομαι', form: 'προσελθών', trans: 'подошедший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 75
  { lemma: 'προσεύχομαι', form: 'προσεύξασθαι', trans: 'помолиться', pos: 'verb', tense: 'aor', voice: 'mid', mood: 'inf' },
  { lemma: 'προσεύχομαι', form: 'προσευξάμενος', trans: 'помолившийся', pos: 'participle', tense: 'aor', voice: 'mid', case: 'nom', gender: 'm', number: 'sg' },
  // 76
  { lemma: 'προσκυνέω', form: 'προσκυνῆσαι', trans: 'поклониться', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'προσκυνέω', form: 'προσκυνήσας', trans: 'поклонившийся', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 77
  { lemma: 'σπείρω', form: 'σπεῖραι', trans: 'посеять', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'σπείρω', form: 'σπείρας', trans: 'посеявший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 78
  { lemma: 'συνάγω', form: 'συναγαγεῖν', trans: 'собрать', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'συνάγω', form: 'συναγαγών', trans: 'собравший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 79
  { lemma: 'σῴζω', form: 'σῶσαι', trans: 'спасти', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'σῴζω', form: 'σώσας', trans: 'спасший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 80
  { lemma: 'τηρέω', form: 'τηρῆσαι', trans: 'сохранить / соблюсти', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'τηρέω', form: 'τηρήσας', trans: 'сохранивший / соблюдший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 81
  { lemma: 'τίθημι', form: 'θεῖναι', trans: 'положить', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'τίθημι', form: 'θείς', trans: 'положивший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 82
  { lemma: 'ὑπάγω', form: 'ὑπάγειν', trans: 'уходить / идти', pos: 'verb', tense: 'pres', voice: 'act', mood: 'inf' },
  { lemma: 'ὑπάγω', form: 'ὑπάγων', trans: 'уходящий', pos: 'participle', tense: 'pres', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 83
  { lemma: 'φέρω', form: 'ἐνεγκεῖν', trans: 'принести', pos: 'verb', tense: 'aor', voice: 'act', mood: 'inf' },
  { lemma: 'φέρω', form: 'ἐνεγκών', trans: 'принесший', pos: 'participle', tense: 'aor', voice: 'act', case: 'nom', gender: 'm', number: 'sg' },
  // 84
  { lemma: 'φοβέομαι', form: 'φοβηθῆναι', trans: 'убояться (быть испуганным)', pos: 'verb', tense: 'aor', voice: 'pass', mood: 'inf' },
  { lemma: 'φοβέομαι', form: 'φοβηθείς', trans: 'убоявшийся (страд. форма, актив. значение)', pos: 'participle', tense: 'aor', voice: 'pass', case: 'nom', gender: 'm', number: 'sg' },
  // 85
  { lemma: 'χαίρω', form: 'χαρῆναι', trans: 'возрадоваться', pos: 'verb', tense: 'aor', voice: ['act', 'pass'], mood: 'inf' },
  { lemma: 'χαίρω', form: 'χαρείς', trans: 'возрадовавшийся', pos: 'participle', tense: 'aor', voice: ['act', 'pass'], case: 'nom', gender: 'm', number: 'sg' }
];

let extraDb = fs.readFileSync('src/data/morphologyExtra.ts', 'utf8');

let appendStr = '';
let cId = 200;

for (const v of extra) {
  const lemmaEng = v.lemma
    .replace('ἡ', 'he').replace('έ', 'e').replace('ρ', 'r').replace('α', 'a').replace('η', 'e')
    .replace('μ', 'm').replace('θ', 'th').replace('τ', 't').replace('ς', 's').replace('ή', 'e')
    .replace('ἔ', 'e').replace('γ', 'g').replace('ο', 'o').replace('ν', 'n')
    .replace('π', 'p').replace('ύ', 'y').replace('λ', 'l').replace('έ', 'e')
    .replace('ε', 'e').replace('ῦ', 'eu').replace('ὄ', 'o').replace('ί', 'i')
    .replace('ἀ', 'a').replace('ή', 'e').replace('έ', 'e')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
  const idStr = `m_ext_${lemmaEng}_${cId++}`;
  
  let line = `  { id: '${idStr}', form: '${v.form}', stem: '', ending: '', lemma: '${v.lemma}', translation: '${v.trans}', pos: '${v.pos}', tense: '${v.tense}', voice: ${Array.isArray(v.voice) ? "['" + v.voice.join("', '") + "']" : "'" + v.voice + "'"}`;
  
  if (v.mood) line += `, mood: '${v.mood}'`;
  if (v.case) line += `, case: '${v.case}'`;
  if (v.gender) line += `, gender: '${v.gender}'`;
  if (v.number) line += `, number: '${v.number}'`;
  
  line += ` },\n`;
  appendStr += line;
}

const closingIndex = extraDb.lastIndexOf('];');
if (closingIndex !== -1) {
  extraDb = extraDb.substring(0, closingIndex) + appendStr + extraDb.substring(closingIndex);
  fs.writeFileSync('src/data/morphologyExtra.ts', extraDb);
  console.log('Successfully wrote new participles and infinitives to morphologyExtra.ts');
} else {
  console.log('Could not find ]; in morphologyExtra.ts');
}
