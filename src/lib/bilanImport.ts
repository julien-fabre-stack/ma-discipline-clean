/**
 * Import « bilan Claude » — parseur PUR (testable unitairement, sans React).
 *
 * L'export pour Claude (exportForClaude) demande à Claude de terminer sa
 * réponse par un bloc structuré :
 *
 *   === AJUSTEMENTS MA DISCIPLINE ===
 *   train: 2300
 *   recup: 2000
 *   repos: 1750
 *   eau: 2.5
 *   note: <résumé en une ligne>
 *
 * Ce module parse ce bloc (collé par l'utilisateur dans les réglages) de
 * façon TOLÉRANTE : accents, majuscules, suffixes « kcal »/« L », virgule
 * décimale, lignes dans le désordre, texte autour du bloc. Les valeurs hors
 * plage plausible sont ignorées (jamais appliquées silencieusement).
 */

export interface BilanAdjustments {
  train?: number;
  recup?: number;
  repos?: number;
  water?: number;
  note: string | null;
}

/** Bornes de plausibilité : hors de ces plages, la valeur est rejetée. */
const KCAL_MIN = 800;
const KCAL_MAX = 6000;
const WATER_MIN = 0.5;
const WATER_MAX = 10;

const KCAL_KEYS: [RegExp, 'train' | 'recup' | 'repos'][] = [
  [/^(train|s[eé]ance)$/i, 'train'],
  [/^(recup|r[eé]cup(?:[eé]ration)?)$/i, 'recup'],
  [/^repos$/i, 'repos'],
];

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(',', '.').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse le texte collé. Retourne null si AUCUNE valeur exploitable n'a été
 * trouvée (l'appelant affiche alors « format non reconnu »).
 */
export function parseBilanAdjustments(text: string): BilanAdjustments | null {
  const out: BilanAdjustments = { note: null };
  let found = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/^([a-zA-Zéèêàûô ]+?)\s*[:=]\s*(.+)$/);
    if (!m) continue;
    const key = m[1].trim();
    const value = m[2].trim();

    if (/^note$/i.test(key)) {
      if (value) {
        out.note = value;
        found = true;
      }
      continue;
    }

    if (/^(eau|water|hydratation)$/i.test(key)) {
      const n = parseNumber(value);
      if (n !== null && n >= WATER_MIN && n <= WATER_MAX) {
        out.water = Math.round(n * 100) / 100;
        found = true;
      }
      continue;
    }

    for (const [re, target] of KCAL_KEYS) {
      if (re.test(key)) {
        const n = parseNumber(value);
        if (n !== null && n >= KCAL_MIN && n <= KCAL_MAX) {
          out[target] = Math.round(n);
          found = true;
        }
        break;
      }
    }
  }

  return found ? out : null;
}

/** Libellé humain d'un ajustement parsé (pour l'aperçu avant application). */
export function describeAdjustments(a: BilanAdjustments): string[] {
  const lines: string[] = [];
  if (a.train !== undefined) lines.push(`Jour de séance → ${a.train} kcal`);
  if (a.recup !== undefined) lines.push(`Jour de récup → ${a.recup} kcal`);
  if (a.repos !== undefined) lines.push(`Jour de repos → ${a.repos} kcal`);
  if (a.water !== undefined) lines.push(`Objectif eau → ${a.water} L`);
  return lines;
}
