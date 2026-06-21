import type { AppData, Food } from '@/types';
import { MEALS } from './defaults';

export interface Macros {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export const EMPTY_MACROS: Macros = { kcal: 0, p: 0, c: 0, f: 0 };

/** Macros d'un aliment pour une quantité donnée (par 100g si unit='g', sinon par pièce). */
export function macrosOf(food: Food, qty: number): Macros {
  const k = food.unit === 'g' ? qty / 100 : qty;
  return { kcal: food.kcal * k, p: food.p * k, c: food.c * k, f: food.f * k };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return { kcal: a.kcal + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f };
}

export interface DayTotals {
  byMeal: Record<string, Macros>;
  grand: Macros;
  logged: boolean;
}

/** Totaux nutritionnels d'un jour, ventilés par repas. */
export function dayTotals(data: AppData, key: string): DayTotals {
  const allFoods = data.customFoods || [];
  const meals = (data.days[key] || {}).meals || {};
  const byMeal: Record<string, Macros> = {};
  let grand: Macros = { ...EMPTY_MACROS };
  MEALS.forEach(([k]) => {
    const tt = ((meals as Record<string, { id: string; qty: number }[]>)[k] || []).reduce(
      (acc, e) => {
        const f = allFoods.find((x) => x.id === e.id);
        if (!f) return acc;
        return addMacros(acc, macrosOf(f, e.qty));
      },
      { ...EMPTY_MACROS }
    );
    byMeal[k] = tt;
    grand = addMacros(grand, tt);
  });
  return { byMeal, grand, logged: grand.kcal > 0 };
}
