const fs = require('fs');
let code = fs.readFileSync('src/components/MorphologyRunner.tsx', 'utf8');

const target = `    setTimeout(() => {
      handleNext();
    }, 1000);`;
const replacement = `    // setTimeout(() => {
    //   handleNext();
    // }, 1000);`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/MorphologyRunner.tsx', code);
  console.log('patched timeout');
} else {
  console.log('not found');
}
