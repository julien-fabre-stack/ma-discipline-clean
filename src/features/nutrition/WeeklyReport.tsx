import { useState } from 'react';
import type { AppData } from '@/types';
import { MEALS, MEAL_COLORS } from '@/lib/defaults';
import { dayType } from '@/lib/workouts';
import { dayTotals, type Macros } from '@/lib/nutrition';
import { addDays, dateKey, mondayOf, parseKey } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui';
import { exportNutritionPDF } from './exportPdf';

export interface WeeklyReportProps {
  data: AppData;
  startKey: string;
}

const CH = 150;

export function WeeklyReport({ data, startKey }: WeeklyReportProps) {
  const { C, cardShadow, hexA } = useTheme();
  const [offset, setOffset] = useState(0);
  const today = dateKey();
  const monday = addDays(mondayOf(startKey), offset * 7);
  const week = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const dts = week.map((k) => ({ key: k, ...dayTotals(data, k) }));
  const weekTotal = dts.reduce<Macros>(
    (a, d) => ({ kcal: a.kcal + d.grand.kcal, p: a.p + d.grand.p, c: a.c + d.grand.c, f: a.f + d.grand.f }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
  const loggedDays = dts.filter((d) => d.logged).length;
  const avg = loggedDays ? weekTotal.kcal / loggedDays : 0;
  const maxDay = Math.max(1, ...dts.map((d) => d.grand.kcal));
  const mealTotals: Record<string, number> = {};
  MEALS.forEach(([k]) => {
    mealTotals[k] = dts.reduce((a, d) => a + d.byMeal[k].kcal, 0);
  });
  const grandMeal = weekTotal.kcal || 1;
  const wkStart = parseKey(monday);
  const wkEnd = parseKey(addDays(monday, 6));
  const fmtD = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const wkLabel = offset === 0 ? 'Cette semaine' : offset === -1 ? 'Semaine dernière' : `Il y a ${-offset} sem.`;
  const kcalTarget = data.targets?.[dayType()] || data.targets?.train || 2400;
  const targetLineH = maxDay > 0 ? Math.min(CH, (kcalTarget / maxDay) * CH) : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: C.surf }}
        >
          <Icon name="left" size={18} color={C.dim} />
        </button>
        <div className="flex-1 text-center">
          <div className="text-xs tracking-widest uppercase" style={{ color: C.gold }}>
            {wkLabel}
          </div>
          <div className="text-sm font-semibold capitalize">
            {fmtD(wkStart)} – {fmtD(wkEnd)}
          </div>
        </div>
        <button
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset >= 0}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: C.surf, opacity: offset >= 0 ? 0.35 : 1 }}
        >
          <Icon name="right" size={18} color={C.dim} />
        </button>
      </div>

      <button
        onClick={() => exportNutritionPDF(data, dts, weekTotal, loggedDays, avg, wkLabel)}
        className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-4"
        style={{ background: C.surf2, color: C.gold }}
      >
        <Icon name="download" size={16} /> Exporter le bilan (PDF)
      </button>

      <div className="flex gap-3 mb-5">
        <div
          className="flex-1 rounded-2xl p-4 text-center"
          style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
        >
          <div className="text-xs mb-1" style={{ color: C.dim }}>
            Total semaine
          </div>
          <div className="text-2xl font-extrabold tabular-nums" style={{ color: C.gold }}>
            {Math.round(weekTotal.kcal)}
          </div>
          <div className="text-[10px]" style={{ color: C.dim }}>
            kcal
          </div>
        </div>
        <div
          className="flex-1 rounded-2xl p-4 text-center"
          style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
        >
          <div className="text-xs mb-1" style={{ color: C.dim }}>
            Moyenne / jour
          </div>
          <div className="text-2xl font-extrabold tabular-nums" style={{ color: C.ember }}>
            {Math.round(avg)}
          </div>
          <div className="text-[10px]" style={{ color: C.dim }}>
            {loggedDays} jour{loggedDays > 1 ? 's' : ''} suivi{loggedDays > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {loggedDays === 0 ? (
        <div
          className="rounded-2xl p-8 text-center text-sm"
          style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow(), color: C.dim }}
        >
          Aucun repas enregistré cette semaine.
        </div>
      ) : (
        <>
          <div
            className="rounded-2xl p-4 mb-5"
            style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
          >
            <div className="text-xs tracking-widest uppercase mb-4" style={{ color: C.dim }}>
              Calories par jour
            </div>
            <div className="relative flex items-end justify-between gap-1.5" style={{ height: CH }}>
              {targetLineH > 0 && targetLineH < CH && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: targetLineH,
                    borderTop: `2px dashed ${hexA(C.gold, 0.5)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    pointerEvents: 'none',
                  }}
                >
                  <span style={{ fontSize: 9, color: C.gold, background: C.surf, paddingLeft: 2, marginTop: -8 }}>
                    {kcalTarget} kcal
                  </span>
                </div>
              )}
              {dts.map((d, i) => {
                const barH = (d.grand.kcal / maxDay) * CH;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    {d.grand.kcal > 0 && (
                      <div className="text-[9px] mb-1 tabular-nums" style={{ color: C.dim }}>
                        {Math.round(d.grand.kcal)}
                      </div>
                    )}
                    <div className="w-full rounded-t-md overflow-hidden flex flex-col" style={{ height: barH }}>
                      {MEALS.map(([k]) => {
                        const segH = d.grand.kcal ? (d.byMeal[k].kcal / d.grand.kcal) * barH : 0;
                        return segH > 0 ? <div key={k} style={{ height: segH, background: MEAL_COLORS[k] }} /> : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between gap-1.5 mt-2">
              {week.map((k, i) => (
                <div
                  key={i}
                  className="flex-1 text-center text-[10px]"
                  style={{ color: k === today ? C.gold : C.dim, fontWeight: k === today ? 700 : 400 }}
                >
                  {labels[i]}
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl p-4 mb-5"
            style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
          >
            <div className="text-xs tracking-widest uppercase mb-3" style={{ color: C.dim }}>
              Répartition par repas
            </div>
            <div className="flex h-3 rounded-full overflow-hidden mb-4" style={{ background: C.surf2 }}>
              {MEALS.map(([k]) => {
                const pct = (mealTotals[k] / grandMeal) * 100;
                return pct > 0 ? <div key={k} style={{ width: pct + '%', background: MEAL_COLORS[k] }} /> : null;
              })}
            </div>
            {MEALS.map(([k, l]) => {
              const pct = Math.round((mealTotals[k] / grandMeal) * 100);
              return (
                <div key={k} className="flex items-center gap-2 py-1.5">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: MEAL_COLORS[k] }} />
                  <span className="text-sm flex-1">{l}</span>
                  <span className="text-sm tabular-nums mr-3" style={{ color: C.dim }}>
                    {Math.round(mealTotals[k])} kcal
                  </span>
                  <span className="text-sm font-bold tabular-nums w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>

          <div
            className="rounded-2xl p-4 flex justify-around text-center"
            style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
          >
            {([['Protéines', weekTotal.p, C.ok], ['Glucides', weekTotal.c, C.blue], ['Lipides', weekTotal.f, C.gold]] as [string, number, string][]).map(
              (m, i) => (
                <div key={i} className="flex-1">
                  <div className="text-xs mb-1" style={{ color: C.dim }}>
                    {m[0]}
                  </div>
                  <div className="font-bold tabular-nums" style={{ color: m[2] }}>
                    {Math.round(m[1])} g
                  </div>
                  <div className="text-[10px]" style={{ color: C.dim }}>
                    {loggedDays ? Math.round(m[1] / loggedDays) : 0} g/j
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
