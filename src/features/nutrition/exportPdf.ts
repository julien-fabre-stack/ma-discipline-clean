import type { AppData, Exercise } from '@/types';
import type { DayTotals, Macros } from '@/lib/nutrition';
import { parseKey, addDays, dateKey } from '@/lib/utils';
import { dayType, workoutsForDay } from '@/lib/workouts';
import { dayTotals, macrosOf } from '@/lib/nutrition';

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
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const rows = dts.map((d, i) => `
    <tr style="background:${i % 2 ? '#f9f9f9' : '#fff'}">
      <td>${labels[i]} ${parseKey(d.key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
      <td>${d.logged ? Math.round(d.grand.kcal) : '-'}</td>
      <td>${d.logged ? Math.round(d.grand.p) + 'g' : '-'}</td>
      <td>${d.logged ? Math.round(d.grand.c) + 'g' : '-'}</td>
      <td>${d.logged ? Math.round(d.grand.f) + 'g' : '-'}</td>
    </tr>`).join('');

  const workouts = dts.map((d, i) => {
    const dayD = data.days[d.key] || {};
    const dh = dayD.habits && !Array.isArray(dayD.habits) ? dayD.habits : {};
    return `<tr style="background:${i % 2 ? '#f9f9f9' : '#fff'}"><td>${labels[i]}</td><td>${dh['sport'] ? '✓' : '✗'}</td></tr>`;
  }).join('');

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
  if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 500); }
}

interface WorkoutRef {
  name: string;
  items: Exercise[];
  fixedDuration?: string;
}

export function exportForClaude(data: AppData, startKey: string, endKey: string): string {
  const p = data.profile || {};
  const name = p.name || 'Opérateur';
  const goals = p.goals || '';
  const targets = data.targets || {};

  const days: string[] = [];
  for (let k = startKey; k <= endKey; k = addDays(k, 1)) days.push(k);

  const today = dateKey();
  const workoutRefs = new Map<string, WorkoutRef>();

  const dayLines: string[] = [];
  let totalKcal = 0, totalP = 0, totalC = 0, totalF = 0;
  let loggedCount = 0, sportCount = 0;
  // Agrégat des aliments consommés sur la période : id → quantité totale.
  // Permet à l'analyse (Claude) de relier les macros aux aliments réels.
  const foodQty = new Map<string, number>();

  for (const k of days) {
    if (k > today) continue;
    const d = parseKey(k);
    const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const type = dayType(d);
    const typeLabel = type === 'train' ? 'Séance' : type === 'recup' ? 'Récup' : 'Repos';
    const target = targets[type] || targets.train || 2400;

    const dt = dayTotals(data, k);
    const dayEntry = data.days?.[k] || {};
    const habits = dayEntry.habits && !Array.isArray(dayEntry.habits) ? dayEntry.habits : {};

    const sportDone = Boolean(habits['sport']);
    if (sportDone) sportCount++;

    // Cumul des quantités d'aliments du jour (tous repas confondus).
    const dayMeals: Partial<Record<string, { id: string; qty: number }[]>> = dayEntry.meals || {};
    for (const arr of Object.values(dayMeals)) {
      for (const e of arr || []) {
        foodQty.set(e.id, (foodQty.get(e.id) || 0) + e.qty);
      }
    }

    const wods = workoutsForDay(data, k);
    const wodNames: string[] = [];
    for (const w of wods) {
      workoutRefs.set(w.id, {
        name: w.name,
        items: w.items || [],
        fixedDuration: w.name.toLowerCase().includes('règle') ? '1h30 · 100 burpees' : undefined,
      });
      wodNames.push(w.name);
    }

    let line = `\n--- ${label} | ${typeLabel} ---`;
    if (wodNames.length) line += `\nWorkout : ${wodNames.join(' + ')}`;
    if (dt.logged) {
      const vqr = Math.round((dt.grand.kcal / target) * 100);
      line += `\nCalories : ${Math.round(dt.grand.kcal)} kcal (VQR ${vqr}% · objectif ${target})`;
      line += `\nProtéines : ${Math.round(dt.grand.p)}g | Glucides : ${Math.round(dt.grand.c)}g | Lipides : ${Math.round(dt.grand.f)}g`;
      totalKcal += dt.grand.kcal; totalP += dt.grand.p; totalC += dt.grand.c; totalF += dt.grand.f;
      loggedCount++;
    } else {
      line += `\nNutrition : non renseignée`;
    }
    line += `\nSport : ${sportDone ? '✓' : '✗'}`;
    dayLines.push(line);
  }

  const avgKcal = loggedCount ? Math.round(totalKcal / loggedCount) : 0;
  const avgP = loggedCount ? Math.round(totalP / loggedCount) : 0;
  const avgC = loggedCount ? Math.round(totalC / loggedCount) : 0;
  const avgF = loggedCount ? Math.round(totalF / loggedCount) : 0;
  const activeDays = days.filter((k) => k <= today).length;

  // Liste des aliments consommés sur la période, quantités totales + macros,
  // triée par apport calorique décroissant (les gros contributeurs d'abord).
  const allFoods = data.customFoods || [];
  const foodLines = Array.from(foodQty.entries())
    .map(([id, qty]) => {
      const f = allFoods.find((x) => x.id === id);
      if (!f) return null;
      const m = macrosOf(f, qty);
      const qtyLabel = f.unit === 'g' ? `${Math.round(qty)} g` : `${qty}×`;
      return {
        kcal: m.kcal,
        text: `- ${f.name} : ${qtyLabel} · ${Math.round(m.kcal)} kcal · P ${Math.round(m.p)}g / G ${Math.round(m.c)}g / L ${Math.round(m.f)}g`,
      };
    })
    .filter((x): x is { kcal: number; text: string } => x !== null)
    .sort((a, b) => b.kcal - a.kcal)
    .map((x) => x.text);

  const startLabel = parseKey(startKey).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const endLabel = parseKey(endKey).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const annexLines: string[] = [];
  for (const [, w] of workoutRefs) {
    let wLine = `\n${w.name}${w.fixedDuration ? ` (${w.fixedDuration})` : ''}`;
    const exercises = w.items.map((it) => it.name).filter(Boolean).join(', ');
    if (exercises) wLine += `\n→ ${exercises}`;
    annexLines.push(wLine);
  }

  return `=== BILAN MA DISCIPLINE ===
Opérateur : ${name}
Période : ${startLabel} → ${endLabel}
Objectifs : ${goals || 'non renseignés'}
Objectifs caloriques : séance ${targets.train || 2400} kcal | repos ${targets.repos || 1800} kcal | récup ${targets.recup || 2100} kcal
${dayLines.join('\n')}

=== MOYENNES SUR LA PÉRIODE ===
Calories moy (jours renseignés) : ${avgKcal} kcal
Protéines moy : ${avgP}g | Glucides moy : ${avgC}g | Lipides moy : ${avgF}g
Sport : ${sportCount}/${activeDays} jours
${foodLines.length ? `\n=== ALIMENTS CONSOMMÉS SUR LA PÉRIODE (quantités totales) ===\n${foodLines.join('\n')}\n` : ''}${annexLines.length ? `\n=== ANNEXE — CONTENU DES WORKOUTS ===${annexLines.join('\n')}` : ''}

---
Généré par Ma Discipline · ${new Date().toLocaleDateString('fr-FR')}`;
}
