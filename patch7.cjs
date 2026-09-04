const fs = require('fs');
let code = fs.readFileSync('src/components/MorphologyRunner.tsx', 'utf8');

const target = `          </div>
        </div>
      </div>

    </div>
  );
};`;

const replacement = `          </div>
        </div>
      </div>

      {/* Footer / Feedback Bar */}
      <div className={\`fixed bottom-0 left-0 right-0 p-4 border-t transition-colors \${
        feedback === 'success' 
          ? 'bg-[#F4F9F5] border-[#C5D9C8]' 
          : feedback === 'error'
          ? 'bg-[#FEF2F2] border-[#FECDD3]'
          : 'bg-white border-[#E5E1DA]'
      }\`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {feedback === 'success' && (
            <div className="flex items-center gap-3 text-[#2D4A32]">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Верно!</h3>
                <p className="text-sm opacity-80">Отличный разбор.</p>
              </div>
            </div>
          )}
          
          {feedback === 'error' && (
            <div className="flex items-center gap-3 text-[#E11D48]">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Ошибки:</h3>
                <ul className="text-xs space-y-0.5 mt-1">
                  {errorDetails.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            </div>
          )}

          {feedback === 'idle' && <div className="flex-1" />}

          <button
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
          </button>
        </div>
      </div>
    </div>
  );
};`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/MorphologyRunner.tsx', code);
  console.log('patched footer');
} else {
  console.log('not found');
}
