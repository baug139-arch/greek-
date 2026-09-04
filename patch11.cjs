const fs = require('fs');
let code = fs.readFileSync('src/components/MorphologyRunner.tsx', 'utf8');

const target = `{requiredCategories.filter(cat => cat !== 'pos').map(cat => renderOptionGroup(cat))}`;

const replacement = `{(() => {
                  let cats = requiredCategories.filter(cat => cat !== 'pos');
                  if (cats.includes('person') && cats.includes('number')) {
                    cats = cats.filter(c => c !== 'person' && c !== 'number');
                    cats.push('personNumber');
                  }
                  return cats.map(cat => renderOptionGroup(cat));
                })()}`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/MorphologyRunner.tsx', code);
  console.log('patched requiredCategories filter');
} else {
  console.log('not found filter');
}
