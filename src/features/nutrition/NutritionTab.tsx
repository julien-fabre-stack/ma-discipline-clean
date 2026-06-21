import { useState } from 'react';
import type { AppData, Combo, Food, MealEntry, MealKey, Meals } from '@/types';
import { MEALS } from '@/lib/defaults';
import { dayType } from '@/lib/workouts';
import { macrosOf, type Macros } from '@/lib/nutrition';
import { addDays, parseKey, uid } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, SwipeRow, useConfirm } from '@/shared/ui';
import { FoodPicker } from './FoodPicker';
import { WeeklyReport } from './WeeklyReport';

export interface NutritionTabProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
  today: string;
  openSettings: () => void;
}

const EMPTY_MEALS: Meals = { petitdej: [], dej: [], diner: [], snack: [] };

export function NutritionTab({ data, update, today, openSettings }: NutritionTabProps) {
  const { C, dawn, cardShadow, glowShadow } = useTheme();
  const askConfirm = useConfirm();
  const [view, setView] = useState<'journal' | 'rapports'>('journal');
  const [viewKey, setViewKey] = useState(today);
  const [openMeal, setOpenMeal] = useState<MealKey | null>(null);
  const [picker, setPicker] = useState<MealKey | null>(null);
  const [saveDraft, setSaveDraft] = useState<MealKey | null>(null);
  const [saveName, setSaveName] = useState('');

  const t = dayType(parseKey(viewKey));
  const target = data.targets[t];
  const day = data.days[viewKey] || {};
  const meals: Meals = day.meals || EMPTY_MEALS;
  const water = day.water || 0;
  const allFoods = data.customFoods || [];
  const isToday = viewKey === today;
  const dayLabel = isToday
    ? "Aujourd'hui"
    : parseKey(viewKey).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const goDay = (n: number) => {
    const k = addDays(viewKey, n);
    if (k > today) return;
    setViewKey(k);
    setOpenMeal(null);
  };

  const setDay = (patch: Partial<{ meals: Meals; water: number }>) => {
    const d = { ...(data.days || {}) };
    d[viewKey] = { ...day, meals, water, ...patch };
    update({ days: d });
  };
  const setMeals = (m: Meals) => setDay({ meals: m });
  const addToMeal = (mk: MealKey, e: MealEntry) => setMeals({ ...meals, [mk]: [...(meals[mk] || []), e] });
  const changeQty = (mk: MealKey, i: number, q: number) => {
    const arr = [...meals[mk]];
    if (q <= 0) arr.splice(i, 1);
    else arr[i] = { ...arr[i], qty: q };
    setMeals({ ...meals, [mk]: arr });
  };
  const addCombo = (mk: MealKey, combo: Combo) => {
    const valid = (combo.items || []).filter((it) => allFoods.find((f) => f.id === it.id));
    if (!valid.length) return;
    setMeals({ ...meals, [mk]: [...(meals[mk] || []), ...valid.map((it) => ({ id: it.id, qty: it.qty }))] });
  };
  const saveCombo = (mk: MealKey) => {
    const items = (meals[mk] || []).map(({ id, qty }) => ({ id, qty }));
    if (!items.length) return;
    const name = (saveName || '').trim() || MEALS.find((m) => m[0] === mk)![1];
    update({ combos: [...(data.combos || []), { id: uid(), name, items }] });
    setSaveDraft(null);
    setSaveName('');
  };

  const mealTot = (mk: MealKey): Macros =>
    (meals[mk] || []).reduce<Macros>(
      (a, e) => {
        const f = allFoods.find((x) => x.id === e.id);
        if (!f) return a;
        const m = macrosOf(f, e.qty);
        return { kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f };
      },
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
  const totals = MEALS.reduce<Macros>(
    (a, [k]) => {
      const m = mealTot(k);
      return { kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f };
    },
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
  const vqr = (v: number) => Math.round((v / target) * 100);

  const summary: [string, number, string?][] = [
    ['Lipid', totals.f],
    ['Glu', totals.c],
    ['Prot', totals.p],
    ['VQR', vqr(totals.kcal), '%'],
    ['Cal', Math.round(totals.kcal)],
  ];

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="sticky top-0 z-20 pb-3 -mx-5 px-5 pt-2" style={{ background: C.night }}>
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Nutrition</h1>
          <button onClick={openSettings} className="p-2 rounded-full mt-1" style={{ background: C.surf }}>
            <Icon name="gear" size={20} color={C.dim} />
          </button>
        </div>
        <div className="flex gap-2 mb-1">
          {([['journal', 'Journal'], ['rapports', 'Rapports']] as ['journal' | 'rapports', string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={{ background: view === k ? dawn : C.surf, color: view === k ? '#1A1206' : C.dim }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {view === 'journal' ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => goDay(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: C.surf }}
            >
              <Icon name="left" size={18} color={C.dim} />
            </button>
            <div className="flex-1 text-center min-w-0">
              <div className="font-bold capitalize truncate">{dayLabel}</div>
              {!isToday && (
                <button
                  onClick={() => {
                    setViewKey(today);
                    setOpenMeal(null);
                  }}
                  className="text-xs"
                  style={{ color: C.gold }}
                >
                  revenir à aujourd'hui
                </button>
              )}
            </div>
            <button
              onClick={() => goDay(1)}
              disabled={isToday}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: C.surf, opacity: isToday ? 0.35 : 1 }}
            >
              <Icon name="right" size={18} color={C.dim} />
            </button>
          </div>

          <div className="text-sm mb-4" style={{ color: C.dim }}>
            {t === 'train' ? 'Jour de séance' : t === 'recup' ? 'Jour de récup' : 'Jour de repos'} · objectif {target} kcal
          </div>

          <div
            className="rounded-2xl p-4 mb-5 flex justify-between text-center"
            style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
          >
            {summary.map((m, i) => (
              <div key={i} className="flex-1">
                <div className="text-xs mb-1" style={{ color: C.dim }}>
                  {m[0]}
                </div>
                <div
                  className={'font-bold tabular-nums ' + (m[0] === 'Cal' ? 'text-lg' : '')}
                  style={{ color: m[0] === 'Cal' ? C.gold : C.text }}
                >
                  {m[0] === 'Cal' || m[0] === 'VQR' ? m[1] : (m[1] as number).toFixed(1)}
                  {m[2] || ''}
                </div>
              </div>
            ))}
          </div>

          {MEALS.map(([key, label]) => {
            const tot = mealTot(key);
            const items = meals[key] || [];
            const open = openMeal === key;
            return (
              <div
                key={key}
                className="rounded-2xl mb-3 overflow-hidden"
                style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
              >
                <div className="flex items-center px-4 py-3">
                  <button
                    onClick={() => setOpenMeal(open ? null : key)}
                    className="flex-1 text-left flex items-center gap-2"
                  >
                    <Icon
                      name="down"
                      size={14}
                      color={C.dim}
                      style={{
                        transition: 'transform 320ms cubic-bezier(.22,1,.36,1)',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                    <span>
                      <div className="font-bold">{label}</div>
                      <div className="text-xs mt-0.5" style={{ color: C.dim }}>
                        L {tot.f.toFixed(1)} · G {tot.c.toFixed(1)} · P {tot.p.toFixed(1)} · VQR {vqr(tot.kcal)}%
                      </div>
                    </span>
                  </button>
                  <div className="text-right mr-3">
                    <div className="font-bold tabular-nums">{Math.round(tot.kcal)}</div>
                    <div className="text-[10px]" style={{ color: C.dim }}>
                      kcal
                    </div>
                  </div>
                  <button
                    onClick={() => setPicker(key)}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: C.surf2 }}
                  >
                    <Icon name="plus" size={18} color={C.gold} />
                  </button>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: open ? '1fr' : '0fr',
                    transition: 'grid-template-rows 320ms cubic-bezier(.22,1,.36,1)',
                  }}
                >
                  <div
                    style={{
                      minHeight: 0,
                      overflow: 'hidden',
                      opacity: open ? 1 : 0,
                      transition: `opacity 220ms ease ${open ? '60ms' : '0ms'}`,
                    }}
                  >
                    <div style={{ borderTop: `1px solid ${C.line}` }}>
                      {items.length === 0 && (
                        <div className="px-4 py-3 text-sm" style={{ color: C.dim }}>
                          Aucun aliment. Touche + pour en ajouter.
                        </div>
                      )}
                      {items.map((e, i) => {
                        const f = allFoods.find((x) => x.id === e.id);
                        if (!f) return null;
                        const m = macrosOf(f, e.qty);
                        return (
                          <SwipeRow
                            key={e.id ? e.id + '-' + i : i}
                            style={{ borderTop: i > 0 ? `1px solid ${C.line}` : 'none' }}
                            onDelete={async () => {
                              const ok = await askConfirm({
                                title: "Supprimer l'aliment",
                                message: `Retirer « ${f.name} » de ce repas ?`,
                              });
                              if (ok) changeQty(key, i, 0);
                              return ok;
                            }}
                          >
                            <div className="flex items-center px-4 py-2.5">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">{f.name}</div>
                                <div className="text-xs" style={{ color: C.ok }}>
                                  {e.qty}
                                  {f.unit === 'g' ? ' g' : '×'} · <span style={{ color: C.dim }}>{Math.round(m.kcal)} kcal</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => changeQty(key, i, e.qty - (f.unit === 'g' ? 10 : 1))}
                                  className="w-7 h-7 rounded-full flex items-center justify-center"
                                  style={{ background: C.surf2 }}
                                >
                                  <Icon name="minus" size={13} />
                                </button>
                                <button
                                  onClick={() => changeQty(key, i, e.qty + (f.unit === 'g' ? 10 : 1))}
                                  className="w-7 h-7 rounded-full flex items-center justify-center"
                                  style={{ background: C.surf2 }}
                                >
                                  <Icon name="plus" size={13} />
                                </button>
                              </div>
                            </div>
                          </SwipeRow>
                        );
                      })}
                      {items.length > 0 &&
                        (saveDraft === key ? (
                          <div className="px-4 py-3" style={{ borderTop: `1px solid ${C.line}` }}>
                            <input
                              autoFocus
                              value={saveName}
                              onChange={(e) => setSaveName(e.target.value)}
                              placeholder="Nom du repas enregistré"
                              className="w-full px-3 py-2.5 rounded-xl mb-2 outline-none text-sm"
                              style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSaveDraft(null);
                                  setSaveName('');
                                }}
                                className="flex-1 py-2 rounded-xl text-sm font-semibold"
                                style={{ background: C.surf2, color: C.dim }}
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => saveCombo(key)}
                                className="flex-[2] py-2 rounded-xl text-sm font-semibold"
                                style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
                              >
                                Enregistrer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSaveDraft(key);
                              setSaveName(
                                `${label} · ${parseKey(viewKey).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                })}`
                              );
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
                            style={{ borderTop: `1px solid ${C.line}`, color: C.gold }}
                          >
                            <Icon name="copy" size={14} /> Enregistrer ce repas
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div
            className="rounded-2xl p-4 mt-2"
            style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold">
                <Icon name="drop" size={18} color={C.blue} /> Eau
              </div>
              <div className="text-sm tabular-nums" style={{ color: C.dim }}>
                {water.toFixed(2)} / {data.targets.water} L
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: C.surf2 }}>
              <div
                className="h-full"
                style={{ width: `${Math.min(100, (water / data.targets.water) * 100)}%`, background: C.blue }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDay({ water: Math.max(0, +(water - 0.25).toFixed(2)) })}
                className="flex-1 py-2 rounded-xl flex items-center justify-center"
                style={{ background: C.surf2 }}
              >
                <Icon name="minus" size={16} />
              </button>
              <button
                onClick={() => setDay({ water: +(water + 0.25).toFixed(2) })}
                className="flex-[2] py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
                style={{ background: C.surf2, color: C.blue }}
              >
                <Icon name="plus" size={16} /> +25 cl
              </button>
            </div>
          </div>

          {picker && (
            <FoodPicker
              mealLabel={MEALS.find((m) => m[0] === picker)![1]}
              foods={allFoods}
              combos={data.combos || []}
              onClose={() => setPicker(null)}
              onAddCustom={(f: Food) => update({ customFoods: [...(data.customFoods || []), f] })}
              onPick={(f, q) => {
                if (!allFoods.find((x) => x.id === f.id)) {
                  update({
                    customFoods: [
                      ...(data.customFoods || []),
                      { id: f.id, name: f.name, unit: f.unit, kcal: f.kcal, p: f.p, c: f.c, f: f.f },
                    ],
                  });
                }
                addToMeal(picker, { id: f.id, qty: q });
                setPicker(null);
              }}
              onPickCombo={(c) => {
                addCombo(picker, c);
                setPicker(null);
              }}
            />
          )}
        </>
      ) : (
        <WeeklyReport data={data} startKey={viewKey} />
      )}
    </div>
  );
}
