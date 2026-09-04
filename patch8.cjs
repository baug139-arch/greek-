const fs = require('fs');
let code = fs.readFileSync('src/components/MorphologyRunner.tsx', 'utf8');

const target = `          <button
            onClick={handleNext}
            className={\`px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors \${
              feedback === 'success'
                ? 'bg-[#2D4A32] text-white hover:bg-[#1E3322]'
                : feedback === 'error'
                ? 'bg-[#E11D48] text-white hover:bg-[#BE123C]'
                : 'bg-[#D97706] text-white hover:bg-[#B45309] disabled:opacity-50 disabled:cursor-not-allowed'
            }\`}
          >
            Дальше
          </button>`;

const replacement = `          {feedback !== 'idle' && (
            <button
              onClick={handleNext}
              className={\`px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors \${
                feedback === 'success'
                  ? 'bg-[#2D4A32] text-white hover:bg-[#1E3322]'
                  : 'bg-[#E11D48] text-white hover:bg-[#BE123C]'
              }\`}
            >
              Дальше
            </button>
          )}`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/MorphologyRunner.tsx', code);
  console.log('patched next button visibility');
} else {
  console.log('not found');
}
