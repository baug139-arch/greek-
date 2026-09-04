const fs = require('fs');
let code = fs.readFileSync('src/data/greekVocabulary.ts', 'utf8');

code = code.replace(/mode: 'contextual_reader',(\s*)targetId: '([^']+)',/g, "mode: 'contextual_reader',$1targetId: '$2',$1assignmentType: 'practice',");

fs.writeFileSync('src/data/greekVocabulary.ts', code);
