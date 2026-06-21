import type { AppData } from '@/types';
import type { DayTotals, Macros } from '@/lib/nutrition';
import { parseKey } from '@/lib/utils';

/**
 * Génère un bilan hebdomadaire imprimable (ouvre une fenêtre + print).
 * Porté à l'identique depuis exportNutritionPDF() de la v1.
 */
export function exportNutritionPDF(
  data: AppData,
  dts: ({ key: string } & DayTotals)[],
  weekTotal: Macros,
  loggedDays: number,
  avg: number,
  wkLabel: string
): void {
  const p = data.profile || {};
  const name = p.name || 'Utilisateur';
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const rows = dts
    .map((d, i) => {
      return `<tr style="background:${i % 2 ? '#f9f9f9' : '#fff'}">
      <td>${labels[i]} ${parseKey(d.key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
      <td>${d.logged ? Math.round(d.grand.kcal) + '' : '-'}</td>
      <td>${d.logged ? Math.round(d.grand.p) + 'g' : '-'}</td>
      <td>${d.logged ? Math.round(d.grand.c) + 'g' : '-'}</td>
      <td>${d.logged ? Math.round(d.grand.f) + 'g' : '-'}</td>
    </tr>`;
    })
    .join('');

  const workouts = dts
    .map((d, i) => {
      const dayD = data.days[d.key] || {};
      const dh = dayD.habits && !Array.isArray(dayD.habits) ? dayD.habits : {};
      const sportDone = dh['sport'] ? '✓' : '✗';
      return `<tr style="background:${i % 2 ? '#f9f9f9' : '#fff'}"><td>${labels[i]}</td><td>${sportDone}</td></tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Bilan Ma Discipline</title>
  <style>body{font-family:system-ui,sans-serif;color:#222;padding:32px;max-width:700px;margin:0 auto;}
  h1{color:#FF7A45;margin-bottom:4px;}h2{color:#FF7A45;margin-top:24px;border-bottom:2px solid #eee;padding-bottom:6px;}
  table{width:100%;border-collapse:collapse;margin-top:12px;}
  th{background:#FF7A45;color:#fff;padding:8px 12px;text-align:left;font-size:13px;}
  td{padding:7px 12px;font-size:13px;}
  .stat{display:inline-block;background:#f3f3f3;border-radius:12px;padding:10px 20px;margin:6px;text-align:center;}
  .stat-val{font-size:24px;font-weight:800;color:#FF7A45;}
  .stat-lbl{font-size:11px;color:#888;}
  .footer{margin-top:32px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px;}
  </style></head><body>
  <h1>📊 Bilan Ma Discipline</h1>
  <p style="color:#888;font-size:13px;">Généré le ${today} · ${name}</p>
  <p><strong>${wkLabel}</strong></p>
  <h2>Résumé nutrition</h2>
  <div>
    <div class="stat"><div class="stat-val">${Math.round(weekTotal.kcal)}</div><div class="stat-lbl">kcal total semaine</div></div>
    <div class="stat"><div class="stat-val">${Math.round(avg)}</div><div class="stat-lbl">kcal/jour (moy.)</div></div>
    <div class="stat"><div class="stat-val">${loggedDays}</div><div class="stat-lbl">jours suivis</div></div>
    <div class="stat"><div class="stat-val">${Math.round(weekTotal.p)}g</div><div class="stat-lbl">Protéines</div></div>
    <div class="stat"><div class="stat-val">${Math.round(weekTotal.c)}g</div><div class="stat-lbl">Glucides</div></div>
    <div class="stat"><div class="stat-val">${Math.round(weekTotal.f)}g</div><div class="stat-lbl">Lipides</div></div>
  </div>
  <h2>Détail journalier</h2>
  <table><thead><tr><th>Jour</th><th>Calories</th><th>Protéines</th><th>Glucides</th><th>Lipides</th></tr></thead><tbody>${rows}</tbody></table>
  <h2>Sport réalisé</h2>
  <table><thead><tr><th>Jour</th><th>Sport</th></tr></thead><tbody>${workouts}</tbody></table>
  <div class="footer">Document généré par Ma Discipline · Point de santé personnel</div>
  </body></html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  }
}
