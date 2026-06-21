import type { Food } from '@/types';
import { normName } from './utils';

/** Une entrée brute CIQUAL : [id, nom, kcal, protéines, glucides, lipides]. */
type CiqualRow = [number, string, number, number, number, number];

let _ciqual: CiqualRow[] | null = null;
let _loading: Promise<CiqualRow[]> | null = null;

/**
 * Charge la base CIQUAL (3484 aliments) en lazy : le JSON de ~240 Ko n'est
 * téléchargé et parsé que lorsqu'on en a besoin (première recherche d'aliment),
 * pas à chaque démarrage de l'app comme dans la v1.
 */
async function loadCiqual(): Promise<CiqualRow[]> {
  if (_ciqual) return _ciqual;
  if (!_loading) {
    _loading = import('@/data/ciqual.json').then((mod) => {
      _ciqual = mod.default as CiqualRow[];
      return _ciqual;
    });
  }
  return _loading;
}

/** Démarre le chargement en arrière-plan (à appeler à l'ouverture du sélecteur). */
export function prefetchCiqual(): void {
  void loadCiqual();
}

function ciqualFood(d: CiqualRow): Food {
  return { id: 'ci' + d[0], name: d[1], unit: 'g', kcal: d[2], p: d[3], c: d[4], f: d[5] };
}

/** Recherche dans la base CIQUAL (insensible aux accents/casse). */
export async function searchCiqual(q: string, limit = 50): Promise<Food[]> {
  const n = normName(q);
  if (!n) return [];
  const rows = await loadCiqual();
  const out: Food[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (normName(rows[i][1]).includes(n)) {
      out.push(ciqualFood(rows[i]));
      if (out.length >= limit) break;
    }
  }
  return out;
}
