const fs = require('fs');
let file = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');

file = file.replace(
  "    return generated;\n  };\n\n  // Next Question or Next Chunk or Finish Session",
  "    return generated;\n  };\n\n  const currentEx = exercises[currentIndex];\n\n  // Next Question or Next Chunk or Finish Session"
);

fs.writeFileSync('src/components/DuolingoEngine.tsx', file);
