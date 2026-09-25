import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { JOHN_GOSPEL_CHAPTERS } from '../src/data/johnGospelVocabulary';
import { getMnemonicForWord } from '../src/utils/mnemonics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateJohnVocabularyLandscapeHtml(): string {
  const totalWords = JOHN_GOSPEL_CHAPTERS.reduce((acc, c) => acc + c.words.length, 0);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Евангелие от Иоанна — Полный словарь с ассоциациями (Главы 1–21)</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 12mm 12mm 12mm;
      @bottom-left {
        content: "Койне • Евангелие от Иоанна (1–21) • Полный словарь с контекстом и мнемо-ассоциациями";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 7.5pt;
        color: #8C7D6B;
      }
      @bottom-right {
        content: "Стр. " counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 7.5pt;
        font-weight: 600;
        color: #8C7D6B;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1A1A1A;
      background-color: #FFFFFF;
      line-height: 1.35;
      font-size: 8.5pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Cover / Top Header */
    .document-header {
      border-bottom: 2.5px solid #2B2520;
      padding-bottom: 10px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-after: avoid;
    }

    .doc-titles {
      max-width: 74%;
    }

    .doc-main-title {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 18pt;
      font-weight: 700;
      color: #1A1A1A;
      letter-spacing: -0.2px;
      line-height: 1.15;
    }

    .doc-subtitle {
      font-size: 9pt;
      color: #635345;
      margin-top: 4px;
      line-height: 1.3;
    }

    .doc-stats-badge {
      text-align: right;
      background: #FAF8F5;
      border: 1px solid #DFD5C6;
      border-left: 3.5px solid #8C7355;
      padding: 6px 14px;
      border-radius: 4px;
    }

    .stats-main {
      font-size: 12pt;
      font-weight: 700;
      color: #2B2520;
      font-family: Georgia, serif;
    }

    .stats-sub {
      font-size: 7.5pt;
      color: #736759;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    /* Legend / Quick Tips Bar */
    .quick-guide-bar {
      background: #FAF8F5;
      border: 1px solid #E7DED3;
      border-radius: 4px;
      padding: 5px 12px;
      margin-bottom: 12px;
      font-size: 7.5pt;
      color: #4A4036;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      page-break-after: avoid;
    }

    .guide-item strong {
      color: #1A1A1A;
    }

    /* Chapter Section */
    .chapter-section {
      margin-bottom: 16px;
      page-break-inside: auto;
    }

    .chapter-page-break {
      page-break-before: always;
    }

    .chapter-header {
      background: #2B2520;
      color: #FFFFFF;
      padding: 6px 12px;
      border-radius: 4px 4px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    .chapter-title {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 11pt;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .chapter-badge {
      font-size: 7.5pt;
      background: rgba(255, 255, 255, 0.22);
      padding: 2px 9px;
      border-radius: 10px;
      font-weight: 600;
    }

    .chapter-description {
      background: #FDFCF9;
      border-left: 3px solid #8C7355;
      border-right: 1px solid #EEE5DA;
      border-bottom: 1px solid #EEE5DA;
      padding: 4px 10px;
      font-size: 7.5pt;
      color: #635345;
      font-style: italic;
      margin-bottom: 2px;
      page-break-after: avoid;
    }

    /* Table Layout */
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
      table-layout: fixed;
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th {
      background-color: #F1ECE4;
      color: #2B2520;
      font-weight: 700;
      text-align: left;
      padding: 5px 8px;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-bottom: 1.5px solid #D5C8B8;
    }

    td {
      padding: 6px 8px;
      border-bottom: 1px solid #EBE5DC;
      vertical-align: top;
      line-height: 1.32;
    }

    tr:nth-child(even) td {
      background-color: #FCFBF9;
    }

    /* Column Widths (Sum = 100%) */
    .col-num {
      width: 3.5%;
      text-align: center;
      color: #8C7D6B;
      font-size: 7.5pt;
      font-weight: 600;
    }

    .col-greek {
      width: 16.5%;
    }

    .col-pron {
      width: 11%;
      color: #5C5245;
      font-size: 8pt;
    }

    .col-verse {
      width: 7%;
      text-align: center;
    }

    .col-trans {
      width: 17%;
      font-weight: 600;
      color: #111111;
      font-size: 8.5pt;
    }

    .col-context {
      width: 21%;
    }

    .col-mnemonic {
      width: 24%;
    }

    /* Cell Contents Typography */
    .greek-lemma {
      font-family: "Palatino Linotype", "Palatino", "Georgia", "Times New Roman", serif;
      font-size: 11pt;
      font-weight: 700;
      color: #111111;
      letter-spacing: 0.2px;
      display: block;
      line-height: 1.2;
    }

    .greek-text-form {
      font-size: 7.5pt;
      color: #736759;
      font-style: italic;
      display: block;
      margin-top: 2px;
    }

    .pronunciation-text {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8pt;
      color: #4A4036;
    }

    .verse-badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      background: #EEE7DD;
      color: #3D3123;
      padding: 2px 5px;
      border-radius: 3px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      white-space: nowrap;
    }

    .context-greek {
      font-family: "Palatino Linotype", "Palatino", "Georgia", "Times New Roman", serif;
      font-size: 8pt;
      color: #1A1A1A;
      line-height: 1.25;
    }

    .context-ru {
      color: #6B5E50;
      font-size: 7.5pt;
      margin-top: 2px;
      line-height: 1.25;
    }

    /* Mnemonic Box */
    .mnemonic-card {
      background: #FFFDF9;
      border: 1px solid #EFE4D3;
      border-left: 2.5px solid #D97706;
      border-radius: 3px;
      padding: 4px 7px;
      font-size: 7.5pt;
      color: #2C241D;
      line-height: 1.32;
    }

    /* Footer Note */
    .doc-footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #D5C8B8;
      font-size: 7.5pt;
      color: #8C7D6B;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- Top Header / Cover -->
  <div class="document-header">
    <div class="doc-titles">
      <div class="doc-main-title">Евангелие от Иоанна — Полный словарь с ассоциациями</div>
      <div class="doc-subtitle">
        Академический справочник греческой лексики Нового Завета (Главы 1 – 21).<br>
        Словарная форма, контекстная форма в стихе, эразмово произношение, русский перевод, цитаты Писания и мнемоники.
      </div>
    </div>
    <div class="doc-stats-badge">
      <div class="stats-main">678 слов • 21 глава</div>
      <div class="stats-sub">100% с мнемониками и контекстом</div>
    </div>
  </div>

  <!-- Legend & Guide Bar -->
  <div class="quick-guide-bar">
    <div class="guide-item">
      <strong>🇬🇷 Слово (Лемма):</strong> начальная словарная форма (и форма в стихе)
    </div>
    <div class="guide-item">
      <strong>🗣 Чтение:</strong> аутентичное эразмово произношение с ударением
    </div>
    <div class="guide-item">
      <strong>📖 Контекст:</strong> оригинальный греческий стих и Синодальный перевод
    </div>
    <div class="guide-item">
      <strong>💡 Ассоциация:</strong> яркий смысловой образ или созвучие для запоминания
    </div>
  </div>

  <!-- Chapters Loop -->
  ${JOHN_GOSPEL_CHAPTERS.map((chapter, chapterIdx) => {
    return `
    <div class="chapter-section ${chapterIdx > 0 ? 'chapter-page-break' : ''}">
      <div class="chapter-header">
        <span class="chapter-title">${escapeHtml(chapter.chapterTitleRu || `Иоанна ${chapter.chapterNumber}`)}</span>
        <span class="chapter-badge">${chapter.words.length} слов</span>
      </div>
      ${
        chapter.descriptionRu
          ? `<div class="chapter-description">${escapeHtml(chapter.descriptionRu)}</div>`
          : ''
      }
      <table>
        <thead>
          <tr>
            <th class="col-num">№</th>
            <th class="col-greek">Слово (Лемма)</th>
            <th class="col-pron">Чтение (Эразм)</th>
            <th class="col-verse">Стих</th>
            <th class="col-trans">Перевод</th>
            <th class="col-context">Контекст в Иоанна</th>
            <th class="col-mnemonic">Мнемо-ассоциация</th>
          </tr>
        </thead>
        <tbody>
          ${chapter.words
            .map((w, idx) => {
              const mnemonic = getMnemonicForWord(w) || w.mnemonicRu || '';
              const textFormDiff =
                w.exampleVerse?.highlightWord &&
                w.exampleVerse.highlightWord !== w.lemma
                  ? `форма в стихе: ${w.exampleVerse.highlightWord}`
                  : ((w as any).textForm && (w as any).textForm !== w.lemma ? `форма: ${(w as any).textForm}` : '');

              return `
            <tr>
              <td class="col-num">${idx + 1}</td>
              <td class="col-greek">
                <span class="greek-lemma">${escapeHtml(w.lemma)}</span>
                ${
                  textFormDiff
                    ? `<span class="greek-text-form">${escapeHtml(textFormDiff)}</span>`
                    : ''
                }
              </td>
              <td class="col-pron">
                <span class="pronunciation-text">${escapeHtml(w.transliterationRu)}</span>
              </td>
              <td class="col-verse">
                ${
                  w.exampleVerse?.reference
                    ? `<span class="verse-badge">${escapeHtml(w.exampleVerse.reference)}</span>`
                    : '—'
                }
              </td>
              <td class="col-trans">${escapeHtml(w.translationRu)}</td>
              <td class="col-context">
                ${
                  w.exampleVerse?.greekText
                    ? `<div class="context-greek">${escapeHtml(w.exampleVerse.greekText)}</div>
                       <div class="context-ru">${escapeHtml(w.exampleVerse.translationRu || '')}</div>`
                    : '—'
                }
              </td>
              <td class="col-mnemonic">
                ${
                  mnemonic
                    ? `<div class="mnemonic-card">${escapeHtml(mnemonic)}</div>`
                    : '—'
                }
              </td>
            </tr>
          `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
    `;
  }).join('')}

  <!-- Final Footer -->
  <div class="doc-footer">
    <span>Приложение «Койне Греческий — Изучение Нового Завета» • Учебный словарь Евангелия от Иоанна</span>
    <span>Дата формирования: ${new Date().toLocaleDateString('ru-RU')}</span>
  </div>

</body>
</html>`;
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const userHome = process.env.HOME || '/Users/syrenkhanikyan';
  const downloadsDir = path.join(userHome, 'Downloads');

  const html = generateJohnVocabularyLandscapeHtml();
  const htmlFileName = 'Евангелие_от_Иоанна_Все_главы_1-21_Словарь_с_ассоциациями.html';
  const pdfFileName = 'Евангелие_от_Иоанна_Все_главы_1-21_Словарь_с_ассоциациями.pdf';

  const htmlPath = path.join(rootDir, htmlFileName);
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`Saved HTML: ${htmlPath}`);

  const pdfPath = path.join(rootDir, pdfFileName);
  const downloadsPdfPath = path.join(downloadsDir, pdfFileName);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (!fs.existsSync(chromePath)) {
    throw new Error(`Google Chrome not found at ${chromePath}`);
  }

  console.log('Rendering PDF via Headless Chrome in A4 Landscape mode...');
  const cmd = `"${chromePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });

  console.log(`Generated PDF in project: ${pdfPath}`);
  const stats = fs.statSync(pdfPath);
  console.log(`PDF Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  if (fs.existsSync(downloadsDir)) {
    fs.copyFileSync(pdfPath, downloadsPdfPath);
    console.log(`Copied PDF to Downloads: ${downloadsPdfPath}`);
  }
}

main().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
