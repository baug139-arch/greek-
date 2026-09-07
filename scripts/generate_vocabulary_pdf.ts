import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JOHN_GOSPEL_CHAPTERS } from '../src/data/johnGospelVocabulary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeHtml(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateHtml(options: {
  title: string;
  subtitle: string;
  chapters: typeof JOHN_GOSPEL_CHAPTERS;
}): string {
  const { title, subtitle, chapters } = options;
  const totalWords = chapters.reduce((acc, c) => acc + c.words.length, 0);

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 14mm 12mm;
      @bottom-right {
        content: counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        font-size: 8pt;
        color: #8C7D6B;
      }
      @bottom-left {
        content: "Койне • Евангелие от Иоанна — Словарь приложения";
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        font-size: 8pt;
        color: #8C7D6B;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      background-color: #ffffff;
      line-height: 1.35;
      font-size: 9pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .cover-header {
      border-bottom: 2px solid #2b2520;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .cover-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 20pt;
      font-weight: bold;
      color: #1a1a1a;
      letter-spacing: -0.3px;
      line-height: 1.15;
    }

    .cover-subtitle {
      font-size: 10pt;
      color: #635345;
      margin-top: 3px;
    }

    .cover-badge {
      font-size: 8.5pt;
      background: #f4ede4;
      color: #5c4731;
      padding: 5px 12px;
      border-radius: 4px;
      border: 1px solid #dfd5c6;
      font-weight: 600;
      text-align: right;
      line-height: 1.3;
    }

    .summary-box {
      background-color: #faf8f5;
      border: 1px solid #e7ded3;
      border-radius: 5px;
      padding: 7px 12px;
      margin-bottom: 16px;
      font-size: 8.5pt;
      color: #4a4036;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chapter-section {
      margin-bottom: 20px;
      page-break-inside: auto;
    }

    .chapter-header {
      background: #2b2520;
      color: #ffffff;
      padding: 6px 10px;
      border-radius: 4px 4px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 14px;
      page-break-after: avoid;
    }

    .chapter-title {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11.5pt;
      font-weight: bold;
      letter-spacing: 0.2px;
    }

    .chapter-count {
      font-size: 8pt;
      opacity: 0.95;
      background: rgba(255,255,255,0.22);
      padding: 2px 7px;
      border-radius: 8px;
      font-weight: 600;
    }

    .chapter-desc {
      background: #fdfbf7;
      border-left: 3px solid #8c7355;
      border-right: 1px solid #eee5da;
      border-bottom: 1px solid #eee5da;
      padding: 5px 10px;
      font-size: 8pt;
      color: #635345;
      margin-bottom: 2px;
      font-style: italic;
      page-break-after: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th {
      background-color: #f1ece4;
      color: #3b3127;
      font-weight: 700;
      text-align: left;
      padding: 5px 7px;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #d5c8b8;
    }

    td {
      padding: 5px 7px;
      border-bottom: 1px solid #ebe5dc;
      vertical-align: middle;
    }

    tr:nth-child(even) td {
      background-color: #fcfbf9;
    }

    .col-num {
      width: 24px;
      color: #8c7d6b;
      font-size: 7.5pt;
      text-align: center;
    }

    .col-greek {
      width: 140px;
    }

    .col-pron {
      width: 95px;
      color: #6d6254;
      font-size: 8pt;
    }

    .col-verse {
      width: 60px;
      white-space: nowrap;
    }

    .col-trans {
      font-weight: 600;
      color: #111111;
      width: 175px;
    }

    .col-context {
      font-size: 8pt;
      color: #4a4036;
    }

    .greek-word {
      font-family: "Palatino Linotype", "Palatino", "Georgia", "Times New Roman", serif;
      font-size: 11pt;
      font-weight: bold;
      color: #111111;
      letter-spacing: 0.2px;
    }

    .greek-form-diff {
      font-size: 7.5pt;
      color: #7a6e60;
      display: block;
      font-style: italic;
      margin-top: 1px;
    }

    .verse-badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      background: #eee7dd;
      color: #443729;
      padding: 1px 5px;
      border-radius: 3px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .context-greek {
      font-family: "Palatino Linotype", "Palatino", "Georgia", "Times New Roman", serif;
      font-size: 8pt;
      color: #2b2520;
      font-style: normal;
    }

    .context-ru {
      color: #736759;
      font-size: 7.5pt;
      margin-top: 1px;
    }

    .footer-note {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #d5c8b8;
      font-size: 7.5pt;
      color: #8c7d6b;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="cover-header">
    <div>
      <div class="cover-title">${escapeHtml(title)}</div>
      <div class="cover-subtitle">${escapeHtml(subtitle)}</div>
    </div>
    <div class="cover-badge">
      ${chapters.length === 1 ? '1 глава' : chapters.length < 5 ? `${chapters.length} главы` : `${chapters.length} глав`}<br>
      <strong>${totalWords} слов</strong>
    </div>
  </div>

  <div class="summary-box">
    <div>
      <strong>Словарь для заучивания:</strong> все слова с точным переводом и контекстом из текста Нового Завета.
    </div>
    <div>
      <strong>Порядок:</strong> по главам и стихам
    </div>
  </div>

  ${chapters
    .map((chapter) => {
      return `
    <div class="chapter-section">
      <div class="chapter-header">
        <span class="chapter-title">${escapeHtml(chapter.chapterTitleRu || `Иоанна ${chapter.chapterNumber}`)}</span>
        <span class="chapter-count">${chapter.words.length} слов</span>
      </div>
      ${
        chapter.descriptionRu
          ? `<div class="chapter-desc">${escapeHtml(chapter.descriptionRu)}</div>`
          : ''
      }
      <table>
        <thead>
          <tr>
            <th class="col-num">№</th>
            <th class="col-greek">Слово (Лемма)</th>
            <th class="col-pron">Чтение</th>
            <th class="col-verse">Стих</th>
            <th class="col-trans">Перевод</th>
            <th class="col-context">Контекст в стихе</th>
          </tr>
        </thead>
        <tbody>
          ${chapter.words
            .map((w, idx) => {
              const textFormDiff =
                w.exampleVerse?.highlightWord &&
                w.exampleVerse.highlightWord !== w.lemma
                  ? `форма: ${w.exampleVerse.highlightWord}`
                  : '';

              return `
            <tr>
              <td class="col-num">${idx + 1}</td>
              <td class="col-greek">
                <span class="greek-word">${escapeHtml(w.lemma)}</span>
                ${
                  textFormDiff
                    ? `<span class="greek-form-diff">${escapeHtml(textFormDiff)}</span>`
                    : ''
                }
              </td>
              <td class="col-pron">${escapeHtml(w.transliterationRu)}</td>
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
            </tr>
          `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
    `;
    })
    .join('')}

  <div class="footer-note">
    Словарь приложения «Койне Греческий — Изучение Нового Завета» • Сгенерировано: ${new Date().toLocaleDateString('ru-RU')}
  </div>

</body>
</html>`;
}

async function main() {
  const rootDir = path.resolve(__dirname, '..');

  // 1. Generate for John chapters 1, 2, 3
  const ch1to3 = JOHN_GOSPEL_CHAPTERS.filter((ch) => [1, 2, 3].includes(ch.chapterNumber));
  const html1to3 = generateHtml({
    title: 'Евангелие от Иоанна — Главы 1, 2 и 3',
    subtitle: 'Словарь греческих слов с переводом и контекстом (100 ключевых слов)',
    chapters: ch1to3,
  });
  const html1to3Path = path.join(rootDir, 'Иоанн_Главы_1-3_Словарь.html');
  fs.writeFileSync(html1to3Path, html1to3, 'utf-8');
  console.log(`Saved HTML 1-3: ${html1to3Path}`);

  // 2. Generate for all chapters 1-21
  const htmlAll = generateHtml({
    title: 'Евангелие от Иоанна — Все главы (1 – 21)',
    subtitle: 'Полный словарь ключевых греческих слов для заучивания в приложении (963 слова)',
    chapters: JOHN_GOSPEL_CHAPTERS,
  });
  const htmlAllPath = path.join(rootDir, 'Евангелие_от_Иоанна_Все_главы_1-21_Словарь.html');
  fs.writeFileSync(htmlAllPath, htmlAll, 'utf-8');
  console.log(`Saved HTML All: ${htmlAllPath}`);
}

main().catch(console.error);
