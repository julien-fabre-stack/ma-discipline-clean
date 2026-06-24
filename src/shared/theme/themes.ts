import type { ThemeId } from '@/types';

export interface ThemePalette {
  name: string;
  night: string;
  surf: string;
  surf2: string;
  line: string;
  ember: string;
  gold: string;
  /** Surcharges optionnelles : permettent un thème clair (texte sombre). */
  text?: string;
  dim?: string;
  /** Couleur du texte posé sur un fond accent (boutons). Défaut sombre. */
  onAccent?: string;
  /** Indique un thème clair (ajuste ombres, opacités, etc. si besoin). */
  light?: boolean;
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
  paper: {
    name: 'Cahier',
    night: '#F2EFE9',
    surf: '#FAFAF7',
    surf2: '#EDEBE4',
    line: '#D6D0C4',
    ember: '#B85C4A',
    gold: '#C2785B',
    text: '#2C2820',
    dim: '#9C9488',
    onAccent: '#FFFFFF',
    light: true,
  },
  custom: {
    name: 'Perso',
    night: '#15121C',
    surf: '#1E1A28',
    surf2: '#2A2438',
    line: 'rgba(255,255,255,0.08)',
    ember: '#FF7A45',
    gold: '#FFC24B',
  },
};

/** Valeurs par défaut proposées pour le thème personnalisé. */
export const DEFAULT_CUSTOM_COLORS: { night: string; ember: string; gold: string } = {
  night: '#15121C',
  ember: '#FF7A45',
  gold: '#FFC24B',
};

/** Maps typographie / animations exposées au reste de l'app. */
export const FONT_FAMILIES: Record<string, { name: string; stack: string }> = {
  system: { name: 'Système', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  rounded: { name: 'Arrondie', stack: "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif" },
  serif: { name: 'Serif', stack: "Georgia, 'Times New Roman', serif" },
  mono: { name: 'Mono', stack: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
};

export const FONT_SCALES: Record<string, { name: string; value: number }> = {
  compact: { name: 'Compact', value: 0.92 },
  normal: { name: 'Normal', value: 1 },
  large: { name: 'Large', value: 1.1 },
};

export const ANIM_SPEEDS: Record<string, { name: string; mult: number }> = {
  fast: { name: 'Rapide', mult: 0.6 },
  normal: { name: 'Normale', mult: 1 },
  slow: { name: 'Lente', mult: 1.5 },
  off: { name: 'Aucune', mult: 0 },
};

export const TAB_TRANSITIONS: Record<string, string> = {
  slide: 'Glissement',
  fade: 'Fondu',
  scale: 'Zoom',
  none: 'Aucune',
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

/**
 * Construit une palette complète à partir des 3 couleurs de base d'un thème
 * personnalisé. `surf` et `surf2` sont des éclaircissements progressifs de
 * `night`, ce qui garantit une hiérarchie de surfaces cohérente quelle que
 * soit la couleur de fond choisie.
 */
export function buildCustomPalette(c: { night: string; ember: string; gold: string }): ThemePalette {
  return {
    name: 'Perso',
    night: c.night,
    surf: lighten(c.night, 0.06),
    surf2: lighten(c.night, 0.12),
    line: 'rgba(255,255,255,0.09)',
    ember: c.ember,
    gold: c.gold,
  };
}
