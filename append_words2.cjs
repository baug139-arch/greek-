const fs = require('fs');
const words = fs.readFileSync('new_words.ts', 'utf-8');
const file = fs.readFileSync('src/data/greekVocabulary.ts', 'utf-8');

const anchor = 'export const GREEK_VOCABULARY: GreekWord[] = ([';
if (!file.includes(anchor)) {
    console.error("Anchor not found!");
    process.exit(1);
}

const newContent = file.replace(anchor, anchor + '\n' + words);
fs.writeFileSync('src/data/greekVocabulary.ts', newContent);
