import { useState } from 'react';
import type { AppData, Combo, Food, NutritionTargets } from '@/types';
import type { AppDataPatch } from '@/lib/useAppData';
import { dateKey, normName } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Collapsible, Icon, useConfirm } from '@/shared/ui';
import { CustomFood } from '../nutrition/CustomFood';

export interface NutritionSettingsProps {
  data: AppData;
  update: (patch: AppDataPatch) => void;
}

function FoodEditRow({
  food,
  onChange,
  onDelete,
}: {
  food: Food;
  onChange: (patch: Partial<Food>) => void;
  onDelete: () => void;
}) {
  const { C } = useTheme();
  const [open, setOpen] = useState(false);
  const fields: [keyof Food, string][] = [['kcal', 'Cal'], ['p', 'P'], ['c', 'G'], ['f', 'L']];
  return (
    <div className="rounded-xl mb-2 overflow-hidden" style={{ background: C.surf2 }}>
      <div className="flex items-center px-3 py-2.5 gap-2">
        <button onClick={() => setOpen((o) => !o)} className="flex-1 text-left min-w-0">
          <div className="text-sm truncate">{food.name}</div>
          <div className="text-xs" style={{ color: C.dim }}>
            {food.kcal} kcal /{food.unit === 'g' ? '100 g' : 'pièce'} · P{food.p} G{food.c} L{food.f}
          </div>
        </button>
        <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg" style={{ background: C.surf }}>
          <Icon name="edit" size={14} color={C.gold} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ background: C.surf }}>
          <Icon name="trash" size={14} color={C.dim} />
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <input
            value={food.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg mt-3 mb-2 outline-none text-sm"
            style={{ background: C.surf, color: C.text }}
          />
          <div className="grid grid-cols-4 gap-2">
            {fields.map(([k, label]) => (
              <div key={k}>
                <div className="text-[10px] mb-1 text-center" style={{ color: C.dim }}>{label}</div>
                <input
                  inputMode="decimal"
                  value={String(food[k] ?? '')}
                  onChange={(e) => onChange({ [k]: +e.target.value || 0 } as Partial<Food>)}
                  className="w-full px-2 py-2 rounded-lg text-center outline-none text-sm"
                  style={{ background: C.surf, color: C.text }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComboEditRow({
  combo,
  allFoods,
  onChange,
  onDelete,
}: {
  combo: Combo;
  allFoods: Food[];
  onChange: (patch: Partial<Combo>) => void;
  onDelete: () => void;
}) {
  const { C } = useTheme();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(combo.name);

  const updateItem = (idx: number, qty: number) => {
    const items = [...combo.items];
    if (qty <= 0) items.splice(idx, 1);
    else items[idx] = { ...items[idx], qty };
    onChange({ items });
  };

  const removeItem = (idx: number) => {
    const items = combo.items.filter((_, i) => i !== idx);
    onChange({ items });
  };

  return (
    <div className="rounded-xl mb-2 overflow-hidden" style={{ background: C.surf2 }}>
      <div className="flex items-center px-3 py-2.5 gap-2">
        <button onClick={() => setOpen((o) => !o)} className="flex-1 text-left min-w-0">
          <div className="text-sm truncate">{combo.name}</div>
          <div className="text-xs" style={{ color: C.dim }}>
            {(combo.items || []).length} aliment{(combo.items || []).length > 1 ? 's' : ''}
          </div>
        </button>
        <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded-lg" style={{ background: C.surf }}>
          <Icon name="edit" size={14} color={C.gold} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ background: C.surf }}>
          <Icon name="trash" size={14} color={C.dim} />
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3" style={{ borderTop: `1px solid ${C.line}` }}>
          {/* Renommer */}
          <div className="mt-3 mb-3">
            <div className="text-[10px] mb-1" style={{ color: C.dim }}>Nom du repas</div>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg outline-none text-sm"
                style={{ background: C.surf, color: C.text }}
              />
              <button
                onClick={() => onChange({ name })}
                className="px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ background: C.ember, color: '#1A1206' }}
              >
                OK
              </button>
            </div>
          </div>

          {/* Liste des aliments */}
          <div className="text-[10px] mb-2" style={{ color: C.dim }}>Aliments</div>
          {combo.items.map((item, idx) => {
            const food = allFoods.find((f) => f.id === item.id);
            if (!food) return null;
            return (
              <div key={idx} className="flex items-center gap-2 py-1.5" style={{ borderTop: idx > 0 ? `1px solid ${C.line}` : 'none' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">{food.name}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateItem(idx, item.qty - (food.unit === 'g' ? 10 : 1))}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: C.surf }}
                  >
                    <Icon name="minus" size={11} />
                  </button>
                  <span className="text-xs tabular-nums w-12 text-center" style={{ color: C.text }}>
                    {item.qty}{food.unit === 'g' ? 'g' : '×'}
                  </span>
                  <button
                    onClick={() => updateItem(idx, item.qty + (food.unit === 'g' ? 10 : 1))}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: C.surf }}
                  >
                    <Icon name="plus" size={11} />
                  </button>
                  <button
                    onClick={() => removeItem(idx)}
                    className="w-6 h-6 rounded-full flex items-center justify-center ml-1"
                    style={{ background: C.surf }}
                  >
                    <Icon name="trash" size={11} color={C.dim} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Section = 'targets' | 'foods' | 'combos' | 'alcool' | null;

export function NutritionSettings({ data, update }: NutritionSettingsProps) {
  const { C, cardShadow } = useTheme();
  const askConfirm = useConfirm();
  const foods = data.customFoods || [];
  const combos = data.combos || [];
  const targets: NutritionTargets = data.targets;
  const [open, setOpen] = useState<Section>(null);
  const toggle = (s: Section) => setOpen((cur) => (cur === s ? null : s));
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');

  const setTarget = (k: keyof NutritionTargets, v: number) =>
    update((prev) => ({ targets: { ...prev.targets, [k]: v } }));
  const setFood = (id: string, patch: Partial<Food>) =>
    update((prev) => ({ customFoods: (prev.customFoods || []).map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  const delFood = async (f: Food) => {
    const ok = await askConfirm({ title: "Supprimer l'aliment", message: `Supprimer « ${f.name} » de ta bibliothèque ?` });
    if (ok) update((prev) => ({ customFoods: (prev.customFoods || []).filter((x) => x.id !== f.id) }));
  };
  const delCombo = async (id: string, name: string) => {
    const ok = await askConfirm({ title: 'Supprimer le repas', message: `Supprimer le repas enregistré « ${name} » ?` });
    if (ok) update((prev) => ({ combos: (prev.combos || []).filter((c) => c.id !== id) }));
  };
  const setCombo = (id: string, patch: Partial<Combo>) =>
    update((prev) => ({ combos: (prev.combos || []).map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const shown = q.trim() ? foods.filter((f) => normName(f.name).includes(normName(q))) : foods;

  const calRows: [keyof NutritionTargets, string][] = [
    ['train', 'Jour de séance'],
    ['recup', 'Jour de récup'],
    ['repos', 'Jour de repos'],
  ];

  return (
    <div className="px-5 pb-10">
      <Collapsible title="Objectifs caloriques" open={open === 'targets'} onToggle={() => toggle('targets')}>
        <div className="rounded-2xl p-4 mb-2" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
          {calRows.map(([k, label]) => (
            <div key={k} className="flex items-center justify-between py-2">
              <span className="text-sm">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  inputMode="numeric"
                  value={String(targets[k])}
                  onChange={(e) => setTarget(k, +e.target.value || 0)}
                  className="w-20 px-3 py-1.5 rounded-lg text-sm outline-none text-right"
                  style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
                />
                <span className="text-xs" style={{ color: C.dim }}>kcal</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between py-2" style={{ borderTop: `1px solid ${C.line}` }}>
            <span className="text-sm">Objectif eau</span>
            <div className="flex items-center gap-2">
              <input
                inputMode="decimal"
                value={String(targets.water)}
                onChange={(e) => setTarget('water', +e.target.value || 0)}
                className="w-20 px-3 py-1.5 rounded-lg text-sm outline-none text-right"
                style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
              />
              <span className="text-xs" style={{ color: C.dim }}>L</span>
            </div>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="Compteur sans alcool" open={open === 'alcool'} onToggle={() => toggle('alcool')}>
        <div className="rounded-2xl p-4 mb-2" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
          <div className="text-xs mb-3" style={{ color: C.dim }}>
            Date de départ du compteur affiché dans le tableau de bord.
          </div>
          <div className="text-xs mb-1" style={{ color: C.dim }}>Depuis le</div>
          <input
            type="date"
            max={dateKey()}
            value={(data.drinkfree && data.drinkfree.start) || dateKey()}
            onChange={(e) => { if (e.target.value) update({ drinkfree: { start: e.target.value } }); }}
            className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
          />
        </div>
      </Collapsible>

      <Collapsible title="Mes aliments" badge={foods.length || null} open={open === 'foods'} onToggle={() => toggle('foods')}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs" style={{ color: C.dim }}>
            {foods.length} aliment{foods.length > 1 ? 's' : ''} personnel{foods.length > 1 ? 's' : ''}
          </span>
          <button onClick={() => setAdding((a) => !a)} className="text-xs font-semibold" style={{ color: C.gold }}>
            {adding ? 'Fermer' : '+ Créer'}
          </button>
        </div>
        {adding && (
          <div className="mb-3">
            <CustomFood onCreate={(f) => { update((prev) => ({ customFoods: [...(prev.customFoods || []), f] })); setAdding(false); }} />
          </div>
        )}
        {foods.length > 6 && (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="w-full px-4 py-2.5 rounded-xl mb-3 outline-none text-sm"
            style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
          />
        )}
        {shown.length === 0 && (
          <div className="text-sm text-center py-6" style={{ color: C.dim }}>
            {foods.length === 0 ? "Aucun aliment personnel pour l'instant." : 'Aucun résultat.'}
          </div>
        )}
        {shown.map((f) => (
          <FoodEditRow key={f.id} food={f} onChange={(p) => setFood(f.id, p)} onDelete={() => delFood(f)} />
        ))}
      </Collapsible>

      <Collapsible title="Repas enregistrés" badge={combos.length || null} open={open === 'combos'} onToggle={() => toggle('combos')}>
        {combos.length === 0 ? (
          <div className="text-sm text-center py-6" style={{ color: C.dim }}>
            Aucun repas enregistré pour l'instant.
          </div>
        ) : (
          combos.map((c) => (
            <ComboEditRow
              key={c.id}
              combo={c}
              allFoods={foods}
              onChange={(patch) => setCombo(c.id, patch)}
              onDelete={() => delCombo(c.id, c.name)}
            />
          ))
        )}
      </Collapsible>
    </div>
  );
}
