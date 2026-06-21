import { useState } from 'react';
import type { Food, FoodUnit } from '@/types';
import { useTheme } from '@/shared/theme/ThemeProvider';

export interface CustomFoodProps {
  onCreate: (food: Food) => void;
}

interface Draft {
  name: string;
  unit: FoodUnit;
  kcal: string;
  p: string;
  c: string;
  f: string;
}

export function CustomFood({ onCreate }: CustomFoodProps) {
  const { C, dawn } = useTheme();
  const [v, setV] = useState<Draft>({ name: '', unit: 'g', kcal: '', p: '', c: '', f: '' });
  const ok = Boolean(v.name && v.kcal);
  const fields: [keyof Draft, string][] = [
    ['kcal', 'Cal*'],
    ['p', 'P'],
    ['c', 'G'],
    ['f', 'L'],
  ];
  return (
    <div className="rounded-2xl p-4" style={{ background: C.surf }}>
      <input
        placeholder="Nom"
        value={v.name}
        onChange={(e) => setV({ ...v, name: e.target.value })}
        className="w-full px-3 py-2.5 rounded-xl mb-2 outline-none"
        style={{ background: C.surf2, color: C.text }}
      />
      <div className="flex gap-2 mb-2">
        {([['g', 'pour 100 g'], ['piece', 'par pièce']] as [FoodUnit, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setV({ ...v, unit: k })}
            className="flex-1 py-2 rounded-xl text-sm"
            style={{ background: v.unit === k ? C.ember : C.surf2, color: v.unit === k ? '#1A1206' : C.dim }}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {fields.map(([k, label]) => (
          <input
            key={k}
            placeholder={label}
            inputMode="decimal"
            value={v[k]}
            onChange={(e) => setV({ ...v, [k]: e.target.value })}
            className="px-2 py-2.5 rounded-xl text-center outline-none"
            style={{ background: C.surf2, color: C.text }}
          />
        ))}
      </div>
      <button
        disabled={!ok}
        onClick={() =>
          onCreate({
            id: 'c' + Date.now(),
            name: v.name,
            unit: v.unit,
            kcal: +v.kcal || 0,
            p: +v.p || 0,
            c: +v.c || 0,
            f: +v.f || 0,
          })
        }
        className="w-full py-2.5 rounded-xl font-semibold"
        style={{ background: ok ? dawn : C.surf2, color: ok ? '#1A1206' : C.dim }}
      >
        Créer et choisir
      </button>
      <div className="text-xs mt-2" style={{ color: C.dim }}>
        * Calories obligatoires.
      </div>
    </div>
  );
}
