const fs = require('fs');
let file = fs.readFileSync('src/components/StudentHub.tsx', 'utf-8');

if (!file.includes('Shuffle,')) {
  file = file.replace('CheckSquare,', 'CheckSquare,\n  Shuffle,');
}
if (!file.includes("{ id: 'match' as TrainingMode")) {
  file = file.replace(
    "{ id: 'audio' as TrainingMode, label: 'Аудио', icon: Headphones },",
    "{ id: 'audio' as TrainingMode, label: 'Аудио', icon: Headphones },\n              { id: 'match' as TrainingMode, label: 'Сопоставление', icon: Shuffle },"
  );
}

fs.writeFileSync('src/components/StudentHub.tsx', file);
