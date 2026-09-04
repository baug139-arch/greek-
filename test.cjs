const fs = require('fs');
const content = fs.readFileSync('src/components/DuolingoEngine.tsx', 'utf-8');
console.log(content.substring(content.indexOf('return generated;'), content.indexOf('return generated;') + 100));
