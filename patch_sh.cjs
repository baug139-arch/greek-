const fs = require('fs');
let code = fs.readFileSync('src/components/StudentHub.tsx', 'utf8');

const tButton = `            <button
              onClick={() => onStartFreeMorphology && onStartFreeMorphology('verb')}
              className="px-4 py-2.5 bg-[#FAF8F5] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#D97706] hover:bg-[#FFFBEB] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
            >
              <span>🧩 Глаголы</span>
              <span className="text-[10px] opacity-70 font-medium normal-case">Тренировка времен</span>
            </button>`;

const rButton = `            <button
              onClick={() => onStartFreeMorphology && onStartFreeMorphology('verb')}
              className="px-4 py-2.5 bg-[#FAF8F5] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#D97706] hover:bg-[#FFFBEB] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
            >
              <span>🧩 Глаголы</span>
              <span className="text-[10px] opacity-70 font-medium normal-case">Тренировка времен</span>
            </button>
            <button
              onClick={() => onStartFreeMorphology && onStartFreeMorphology('adjective')}
              className="px-4 py-2.5 bg-[#FAF8F5] text-[#1A1A1A] border border-[#E5E1DA] hover:border-[#D97706] hover:bg-[#FFFBEB] font-bold text-xs uppercase tracking-wider rounded transition-colors text-left flex flex-col gap-1 shadow-2xs"
            >
              <span>🧩 Прилагательные</span>
              <span className="text-[10px] opacity-70 font-medium normal-case">Тренировка согласования</span>
            </button>`;

if (code.includes(tButton)) {
  code = code.replace(tButton, rButton);
  fs.writeFileSync('src/components/StudentHub.tsx', code);
  console.log('Patched StudentHub');
} else {
  console.log('Failed to patch StudentHub');
}
