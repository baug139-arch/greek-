const fs = require('fs');
let file = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

if (!file.includes('Shuffle')) {
  file = file.replace('Keyboard as KeyboardIcon,', 'Keyboard as KeyboardIcon,\n  Shuffle,');
}

file = file.replace(
  "audio: { title: 'Аудио', icon: <Headphones className=\"w-3.5 h-3.5\" /> },",
  "audio: { title: 'Аудио', icon: <Headphones className=\"w-3.5 h-3.5\" /> },\n    match: { title: 'Сопоставление', icon: <Shuffle className=\"w-3.5 h-3.5\" /> },"
);

fs.writeFileSync('src/components/DuolingoEngine.tsx', file);
