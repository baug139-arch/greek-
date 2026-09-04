const fs = require('fs');
let code = fs.readFileSync('src/components/StudentHub.tsx', 'utf8');

const target = `            <button
              onClick={() => onStartFreeMorphology && onStartFreeMorphology('all')}
              className="px-4 py-2.5 bg-[#D97706] text-white hover:bg-[#B45309] border border-[#D97706] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
            >
              <span>🔥 Микс</span>
              <span className="text-[10px] opacity-90 font-medium normal-case">Всё вместе</span>
            </button>`;

const replacement = target + `
            {currentStudent.morphologyMistakes && currentStudent.morphologyMistakes.length > 0 && (
              <button
                onClick={() => onStartFreeMorphology && onStartFreeMorphology('mistakes')}
                className="px-4 py-2.5 bg-[#E11D48] text-white hover:bg-[#BE123C] border border-[#E11D48] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
              >
                <span>⚠️ Работа над ошибками</span>
                <span className="text-[10px] opacity-90 font-medium normal-case">{currentStudent.morphologyMistakes.length} слов(а)</span>
              </button>
            )}`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/StudentHub.tsx', code);
  console.log('patched mistakes button');
} else {
  console.log('not found');
}
