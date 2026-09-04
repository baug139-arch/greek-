const fs = require('fs');
let file = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

file = file.replace(
  "              <button\n                type=\"button\"\n                onClick={handleCheckAnswer}",
  "              <button\n                type=\"button\"\n                onClick={currentEx.type === 'flashcard' ? handleNext : handleCheckAnswer}"
);

fs.writeFileSync('src/components/DuolingoEngine.tsx', file);
