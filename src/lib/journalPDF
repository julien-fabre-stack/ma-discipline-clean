import { parseKey } from './utils';

export interface JournalExportEntry {
  date: string;
  title: string;
  body: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

export function exportMonthPdf(monthKey: string, entries: JournalExportEntry[]): void {
  const [y, m] = monthKey.split('-');
  const monthLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const rows = sorted
    .map((e) => {
      const d = parseKey(e.date);
      const dayNum = d.getDate();
      const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      const titleHtml = e.title.trim()
        ? `<div class="t">${esc(e.title)}</div>`
        : '';
      return `
        <div class="entry">
          <div class="date">
            <div class="num">${dayNum}</div>
            <div class="wd">${weekday}.</div>
          </div>
          <div class="content">
            ${titleHtml}
            <div class="body">${esc(e.body) || '<span class="empty">(vide)</span>'}</div>
          </div>
        </div>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Journal — ${monthLabel}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1a1a1a;
    margin: 0;
    padding: 32px 28px;
    background: #fff;
  }
  h1 { font-size: 22px; margin: 0 0 4px; text-transform: capitalize; }
  .sub { color: #888; font-size: 12px; margin-bottom: 24px; }
  .entry {
    display: flex;
    gap: 14px;
    border: 1px solid #ddd;
    border-radius: 6px;
    margin-bottom: 12px;
    page-break-inside: avoid;
    overflow: hidden;
  }
  .date {
    flex: 0 0 64px;
    background: #f4f2ee;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 0;
  }
  .num { font-size: 22px; font-weight: bold; }
  .wd { font-size: 11px; color: #999; margin-top: 2px; }
  .content { padding: 12px 14px; flex: 1; min-width: 0; }
  .t { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
  .body { font-size: 13px; line-height: 1.5; }
  .empty { color: #bbb; font-style: italic; }
  @media print {
    body { padding: 0; }
    @page { margin: 1.6cm; }
  }
</style>
</head>
<body>
  <h1>Journal — ${monthLabel}</h1>
  <div class="sub">${sorted.length} entrée${sorted.length > 1 ? 's' : ''}</div>
  ${rows || '<p style="color:#999">Aucune entrée ce mois-ci.</p>'}
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert("Impossible d'ouvrir la fenêtre d'impression. Autorise les pop-ups.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    setTimeout(() => {
      w.focus();
      w.print();
    }, 250);
  };
}
