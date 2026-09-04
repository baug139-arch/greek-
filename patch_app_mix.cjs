const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const tMix = `    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);`;

const rMix = `    // Better mix balancing logic for "all" / "mix" mode
    if (!config || config.targetPos === 'all') {
      const grouped = {
        noun: pool.filter(w => w.pos === 'noun').sort(() => 0.5 - Math.random()),
        verb: pool.filter(w => w.pos === 'verb' && w.mood !== 'inf').sort(() => 0.5 - Math.random()),
        inf: pool.filter(w => w.pos === 'verb' && w.mood === 'inf').sort(() => 0.5 - Math.random()),
        participle: pool.filter(w => w.pos === 'participle').sort(() => 0.5 - Math.random()),
        adjective: pool.filter(w => w.pos === 'adjective').sort(() => 0.5 - Math.random()),
        pronoun: pool.filter(w => w.pos === 'pronoun').sort(() => 0.5 - Math.random()),
      };
      
      const selected = [];
      const cats = ['noun', 'verb', 'participle', 'adjective', 'inf', 'pronoun'];
      
      while (selected.length < count) {
        let addedInRound = false;
        for (const cat of cats) {
          if (selected.length >= count) break;
          if (grouped[cat].length > 0) {
            selected.push(grouped[cat].pop());
            addedInRound = true;
          }
        }
        // If we ran out of all categories but still need more words, just break to avoid infinite loop
        if (!addedInRound) break;
      }
      
      // Shuffle the selected array so it's not strictly predictable
      for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
      }
      return selected;
    }

    // Default fully random for other modes
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);`;

if (code.includes(tMix)) {
  code = code.replace(tMix, rMix);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Patched App.tsx mix balancing');
} else {
  console.log('Failed to patch App.tsx, target mix not found');
}
