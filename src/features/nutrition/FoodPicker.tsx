import { useEffect, useState } from 'react';
import type { Combo, Food } from '@/types';
import { normName } from '@/lib/utils';
import { macrosOf } from '@/lib/nutrition';
import { prefetchCiqual, searchCiqual } from '@/lib/ciqual';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui';
import { CustomFood } from './CustomFood';

export interface FoodPickerProps {
  mealLabel: string;
  foods: Food[];
  combos: Combo[];
  onPick: (food: Food, qty: number) => void;
  onPickCombo: (combo: Combo) => void;
  onAddCustom: (food: Food) => void;
  onClose: () => void;
}

type Tab = 'biblio' | 'off' | 'perso' | 'combos';

export function FoodPicker({
  mealLabel,
  foods,
  combos,
  onPick,
  onPickCombo,
  onAddCustom,
  onClose,
}: FoodPickerProps) {
  const { C, dawn, glowShadow } = useTheme();
  const [tab, setTab] = useState<Tab>('biblio');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Food | null>(null);
  const [qty, setQty] = useState(100);
  const [libQ, setLibQ] = useState('');
  const [ciResults, setCiResults] = useState<Food[]>([]);

  useEffect(() => {
    prefetchCiqual();
  }, []);

  // Recherche CIQUAL asynchrone (débouncée légèrement par le cycle de rendu).
  useEffect(() => {
    let cancelled = false;
    if (!q.trim()) {
      setCiResults([]);
      return;
    }
    void searchCiqual(q, 60).then((res) => {
      if (!cancelled) setCiResults(res);
    });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const choose = (f: Food) => {
    setSel(f);
    setQty(f.unit === 'g' ? 100 : 1);
  };

  const libFoods = libQ.trim()
    ? foods.filter((f) => normName(f.name).includes(normName(libQ)))
    : foods;

  const tabs: [Tab, string][] = [
    ['biblio', 'Mes aliments'],
    ['off', 'Recherche'],
    ['perso', 'Créer'],
    ['combos', 'Repas'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.night, color: C.text }}>
      <div
        className="flex items-center justify-between px-5 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
      >
        <div className="font-bold">Ajouter · {mealLabel}</div>
        <button onClick={onClose} className="p-2 rounded-full" style={{ background: C.surf }}>
          <Icon name="x" size={20} color={C.dim} />
        </button>
      </div>

      {!sel ? (
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          <div className="flex gap-2 mb-4">
            {tabs.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold"
                style={{ background: tab === k ? dawn : C.surf, color: tab === k ? '#1A1206' : C.dim }}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === 'biblio' && (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  value={libQ}
                  onChange={(e) => setLibQ(e.target.value)}
                  placeholder="Rechercher dans tes aliments…"
                  className="flex-1 px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
                />
                {libQ && (
                  <button onClick={() => setLibQ('')} className="px-3 rounded-xl" style={{ background: C.surf2 }}>
                    <Icon name="x" size={16} color={C.dim} />
                  </button>
                )}
              </div>
              {libFoods.length === 0 && (
                <div className="text-sm text-center py-6" style={{ color: C.dim }}>
                  Aucun aliment ici pour l'instant. Cherche dans la table CIQUAL via l'onglet « Recherche ».
                </div>
              )}
              {libFoods.map((f) => (
                <button
                  key={f.id}
                  onClick={() => choose(f)}
                  className="w-full flex items-center px-4 py-3 rounded-xl mb-2 text-left"
                  style={{ background: C.surf }}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs" style={{ color: C.dim }}>
                      {f.kcal} kcal /{f.unit === 'g' ? '100 g' : 'pièce'} · P{f.p} G{f.c} L{f.f}
                    </div>
                  </div>
                  <Icon name="plus" size={18} color={C.gold} />
                </button>
              ))}
            </>
          )}

          {tab === 'off' && (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un aliment…"
                  className="flex-1 px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
                />
                {q && (
                  <button onClick={() => setQ('')} className="px-3 rounded-xl" style={{ background: C.surf2 }}>
                    <Icon name="x" size={16} color={C.dim} />
                  </button>
                )}
              </div>
              <div className="text-xs mb-3" style={{ color: C.dim }}>
                Table CIQUAL 2025 (ANSES) · valeurs /100 g.
              </div>
              {q.trim() && ciResults.length === 0 && (
                <div className="text-sm text-center py-6" style={{ color: C.dim }}>
                  Aucun résultat.
                </div>
              )}
              {ciResults.map((f) => (
                <button
                  key={f.id}
                  onClick={() => choose(f)}
                  className="w-full flex items-center px-4 py-3 rounded-xl mb-2 text-left"
                  style={{ background: C.surf }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs" style={{ color: C.dim }}>
                      {f.kcal} kcal/100 g · P{f.p} G{f.c} L{f.f}
                    </div>
                  </div>
                  <Icon name="plus" size={18} color={C.gold} />
                </button>
              ))}
            </>
          )}

          {tab === 'perso' && (
            <CustomFood
              onCreate={(f) => {
                onAddCustom(f);
                choose(f);
              }}
            />
          )}

          {tab === 'combos' &&
            ((combos || []).length === 0 ? (
              <div className="text-sm text-center py-8" style={{ color: C.dim }}>
                Aucun repas enregistré.
                <br />
                Touche « Enregistrer ce repas » dans le journal pour en créer un.
              </div>
            ) : (
              (combos || []).map((c) => {
                const validItems = (c.items || []).filter((it) => foods.find((x) => x.id === it.id));
                const tot = validItems.reduce((a, it) => {
                  const f = foods.find((x) => x.id === it.id);
                  return f ? a + macrosOf(f, it.qty).kcal : a;
                }, 0);
                return (
                  <button
                    key={c.id}
                    onClick={() => onPickCombo(c)}
                    className="w-full flex items-center px-4 py-3 rounded-xl mb-2 text-left"
                    style={{ background: C.surf }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="text-xs" style={{ color: C.dim }}>
                        {validItems.length} aliment{validItems.length > 1 ? 's' : ''} · {Math.round(tot)} kcal
                      </div>
                    </div>
                    <Icon name="plus" size={18} color={C.gold} />
                  </button>
                );
              })
            ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-xl font-bold mb-1 max-w-xs">{sel.name}</div>
          <div className="text-sm mb-6" style={{ color: C.dim }}>
            {Math.round(macrosOf(sel, qty).kcal)} kcal · P{macrosOf(sel, qty).p.toFixed(1)} G
            {macrosOf(sel, qty).c.toFixed(1)} L{macrosOf(sel, qty).f.toFixed(1)}
          </div>
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setQty((x) => Math.max(sel.unit === 'g' ? 10 : 1, x - (sel.unit === 'g' ? 10 : 1)))}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: C.surf2 }}
            >
              <Icon name="minus" size={20} />
            </button>
            <div className="w-28">
              <input
                type="number"
                inputMode="decimal"
                value={qty}
                onChange={(e) => setQty(Math.max(0, +e.target.value || 0))}
                className="w-full text-center text-3xl font-bold tabular-nums py-2 rounded-xl outline-none"
                style={{ background: C.surf, color: C.text }}
              />
              <div className="text-xs mt-1" style={{ color: C.dim }}>
                {sel.unit === 'g' ? 'grammes' : 'pièce(s)'}
              </div>
            </div>
            <button
              onClick={() => setQty((x) => x + (sel.unit === 'g' ? 10 : 1))}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: C.surf2 }}
            >
              <Icon name="plus" size={20} />
            </button>
          </div>
          <button
            onClick={() => onPick(sel, qty)}
            className="w-full max-w-xs py-4 rounded-2xl font-bold text-lg"
            style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
          >
            Ajouter
          </button>
          <button onClick={() => setSel(null)} className="mt-4 text-sm" style={{ color: C.dim }}>
            ← retour
          </button>
        </div>
      )}
    </div>
  );
}
