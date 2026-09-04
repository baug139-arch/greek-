const fs = require('fs');
let file = fs.readFileSync('src/components/StudentHub.tsx', 'utf-8');

file = file.replace(
  "{ id: 'audio' as TrainingMode, label: 'Аудио', icon: Headphones },",
  "{ id: 'audio' as TrainingMode, label: 'Аудио', icon: Headphones },\n              { id: 'match' as TrainingMode, label: 'Сопоставление', icon: Shuffle },"
);
file = file.replace(
  "import { Play, BookOpen, Clock, BrainCircuit, Headphones, Edit3, Puzzle, CheckSquare, Zap, Layers, RefreshCw, LogOut, ChevronRight, Settings, Volume2 } from 'lucide-react';",
  "import { Play, BookOpen, Clock, BrainCircuit, Headphones, Edit3, Puzzle, CheckSquare, Zap, Layers, RefreshCw, LogOut, ChevronRight, Settings, Volume2, Shuffle } from 'lucide-react';"
);

fs.writeFileSync('src/components/StudentHub.tsx', file);
