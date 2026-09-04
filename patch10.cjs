const fs = require('fs');
let code = fs.readFileSync('src/components/MorphologyRunner.tsx', 'utf8');

// Replace handleOptionClick
const targetHandleOptionClick = `  const handleOptionClick = (category: string, value: string) => {
    if (!currentWord || feedback !== 'idle') return;
    if (correctSelections[category]) return;

    const expected = currentWord[category as keyof MorphologyWord];
    const isCorrect = Array.isArray(expected) ? expected.includes(value) : expected === value;

    if (isCorrect) {
      playClickSound();
      const newSelections = { ...correctSelections, [category]: value };
      setCorrectSelections(newSelections);

      if (isWordComplete(currentWord, newSelections)) {
        if (!madeMistakeOnCurrent && hintLevel === 0) {
          setSessionMasteredIds(prev => new Set(prev).add(currentWord.id));
        }
        triggerSuccess(newSelections);
      }
    } else {
      playErrorSound();
      setMadeMistakeOnCurrent(true);
      setSessionMissedIds(prev => new Set(prev).add(currentWord.id));
      setWrongSelections(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), value]
      }));
      
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setFeedback('error');
        setErrorDetails(['У вас закончились жизни.']);
      }
    }
  };`;

const replacementHandleOptionClick = `  const handleOptionClick = (category: string, value: string) => {
    if (!currentWord || feedback !== 'idle') return;
    
    // For personNumber, we check if 'person' AND 'number' are both already correct
    if (category === 'personNumber') {
      if (correctSelections['person'] && correctSelections['number']) return;
    } else {
      if (correctSelections[category]) return;
    }

    let isCorrect = false;
    let actualValue = value;
    
    if (category === 'personNumber') {
      const p = value[0]; // '1', '2', '3'
      const n = value.substring(1); // 'sg', 'pl'
      const expP = currentWord.person;
      const expN = currentWord.number;
      const pCorrect = Array.isArray(expP) ? expP.includes(p) : expP === p;
      const nCorrect = Array.isArray(expN) ? expN.includes(n) : expN === n;
      isCorrect = pCorrect && nCorrect;
    } else {
      const expected = currentWord[category as keyof MorphologyWord];
      
      if (category === 'voice' && value === 'midpass') {
        isCorrect = (expected === 'mid' || expected === 'pass' || (Array.isArray(expected) && (expected.includes('mid') || expected.includes('pass'))));
        if (isCorrect) {
          actualValue = Array.isArray(expected) ? expected[0] : (expected as string);
        }
      } else {
        isCorrect = Array.isArray(expected) ? expected.includes(value) : expected === value;
      }
    }

    if (isCorrect) {
      playClickSound();
      
      let newSelections = { ...correctSelections };
      if (category === 'personNumber') {
        newSelections['person'] = value[0];
        newSelections['number'] = value.substring(1);
      } else {
        newSelections[category] = actualValue;
      }
      
      setCorrectSelections(newSelections);

      if (isWordComplete(currentWord, newSelections)) {
        if (!madeMistakeOnCurrent && hintLevel === 0) {
          setSessionMasteredIds(prev => new Set(prev).add(currentWord.id));
        }
        triggerSuccess(newSelections);
      }
    } else {
      playErrorSound();
      setMadeMistakeOnCurrent(true);
      setSessionMissedIds(prev => new Set(prev).add(currentWord.id));
      
      setWrongSelections(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), value]
      }));
      
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setFeedback('error');
        setErrorDetails(['У вас закончились жизни.']);
      }
    }
  };`;

if(code.includes(targetHandleOptionClick)) {
  code = code.replace(targetHandleOptionClick, replacementHandleOptionClick);
  console.log('patched handleOptionClick');
} else {
  console.log('handleOptionClick target not found');
}

// Replace renderOptionGroup
const targetRenderOptionGroup = `  const renderOptionGroup = (category: string) => {
    const meta = CATEGORY_MAP[category];
    if (!meta) return null;

    return (
      <div className="space-y-3" key={category}>
        <h4 className="text-sm font-bold text-[#8C7D6B] uppercase tracking-wider">{meta.label}</h4>
        <div className="flex flex-wrap gap-2">
          {meta.options.map(opt => {
            const isCorrect = correctSelections[category] === opt.value;
            const isWrong = wrongSelections[category]?.includes(opt.value);
            
            let btnClass = "px-4 py-2 rounded-full font-bold text-sm transition-colors ";
            if (isCorrect) {
              btnClass += "bg-[#2D4A32] text-white border-2 border-[#2D4A32]";
            } else if (isWrong) {
              btnClass += "bg-[#FEE2E2] text-[#991B1B] border-2 border-[#FCA5A5] opacity-50 cursor-not-allowed";
            } else {
              btnClass += "bg-white text-[#1A1A1A] border-2 border-[#E5E1DA] hover:border-[#D97706] hover:text-[#D97706]";
            }

            return (
              <button
                key={opt.value}
                onClick={() => handleOptionClick(category, opt.value)}
                disabled={isCorrect || isWrong || feedback !== 'idle'}
                className={btnClass}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };`;

const replacementRenderOptionGroup = `  const renderOptionGroup = (category: string) => {
    let meta = CATEGORY_MAP[category];
    if (!meta) return null;
    
    let options = meta.options;

    // Special case for voice based on selected tense
    if (category === 'voice' && correctSelections.tense) {
      if (['pres', 'impf', 'perf', 'plup'].includes(correctSelections.tense)) {
        options = [
          { value: 'act', label: 'Действительный' },
          { value: 'midpass', label: 'Медиально-страдательный' }
        ];
      }
    }

    return (
      <div className="space-y-3" key={category}>
        <h4 className="text-sm font-bold text-[#8C7D6B] uppercase tracking-wider">{meta.label}</h4>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            let isCorrect = false;
            
            if (category === 'personNumber') {
               isCorrect = correctSelections['person'] === opt.value[0] && correctSelections['number'] === opt.value.substring(1);
            } else if (category === 'voice' && opt.value === 'midpass') {
               isCorrect = correctSelections['voice'] === 'mid' || correctSelections['voice'] === 'pass';
            } else {
               isCorrect = correctSelections[category] === opt.value;
            }
            
            const isWrong = wrongSelections[category]?.includes(opt.value);
            
            let btnClass = "px-4 py-2 rounded-full font-bold text-sm transition-colors ";
            if (isCorrect) {
              btnClass += "bg-[#2D4A32] text-white border-2 border-[#2D4A32]";
            } else if (isWrong) {
              btnClass += "bg-[#FEE2E2] text-[#991B1B] border-2 border-[#FCA5A5] opacity-50 cursor-not-allowed";
            } else {
              btnClass += "bg-white text-[#1A1A1A] border-2 border-[#E5E1DA] hover:border-[#D97706] hover:text-[#D97706]";
            }

            return (
              <button
                key={opt.value}
                onClick={() => handleOptionClick(category, opt.value)}
                disabled={isCorrect || isWrong || feedback !== 'idle'}
                className={btnClass}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };`;

if(code.includes(targetRenderOptionGroup)) {
  code = code.replace(targetRenderOptionGroup, replacementRenderOptionGroup);
  console.log('patched renderOptionGroup');
} else {
  console.log('renderOptionGroup target not found');
}

fs.writeFileSync('src/components/MorphologyRunner.tsx', code);
