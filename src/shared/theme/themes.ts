import type { ThemeId } from '@/types';

export interface ThemePalette {
  name: string;
  night: string;
  surf: string;
  surf2: string;
  line: string;
  ember: string;
  gold: string;
}

/**
 * Les 5 thèmes de la v1, portés à l'identique.
 * `ok`, `blue`, `red` sont des couleurs sémantiques fixes (pas liées au thème).
 */
export const THEMES: Record<ThemeId, ThemePalette> = {
  aube: {
    name: 'Aube',
    night: '#15121C',
    surf: '#1E1A28',
    surf2: '#2A2438',
    line: 'rgba(255,255,255,0.08)',
    ember: '#FF7A45',
    gold: '#FFC24B',
  },
  nuit: {
    name: 'Nuit',
    night: '#0F1320',
    surf: '#191F33',
    surf2: '#262C45',
    line: 'rgba(255,255,255,0.09)',
    ember: '#5B8DEF',
    gold: '#8B5CF6',
  },
  ardoise: {
    name: 'Ardoise',
    night: '#171A21',
    surf: '#222732',
    surf2: '#2F3543',
    line: 'rgba(255,255,255,0.10)',
    ember: '#34D1BF',
    gold: '#5BC0FF',
  },
  aurore: {
    name: 'Aurore',
    night: '#120E1A',
    surf: '#1C1726',
    surf2: '#2A2138',
    line: 'rgba(255,255,255,0.08)',
    ember: '#FF6FA5',
    gold: '#FFA94D',
  },
  foret: {
    name: 'Forêt',
    night: '#101713',
    surf: '#18211B',
    surf2: '#243029',
    line: 'rgba(255,255,255,0.09)',
    ember: '#4ADE80',
    gold: '#A3E635',
  },
};

export const SEMANTIC_COLORS = {
  text: '#F3EDE7',
  dim: '#9C90A8',
  ok: '#4ADE80',
  blue: '#5BC0FF',
  red: '#E5484D',
};

export function lighten(hex: string, amt: number): string {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const m = (c: number) => Math.round(c + (255 - c) * amt);
    const x = (c: number) => c.toString(16).padStart(2, '0');
    return '#' + x(m(r)) + x(m(g)) + x(m(b));
  } catch {
    return hex;
  }
}

export function hexA(hex: string, a: number): string {
  try {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  } catch {
    return hex;
  }
}
