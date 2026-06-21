import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { ThemeId } from '@/types';
import { THEMES, SEMANTIC_COLORS, lighten, hexA, type ThemePalette } from './themes';

export interface ThemeColors extends ThemePalette {
  text: string;
  dim: string;
  ok: string;
  blue: string;
  red: string;
}

export interface ThemeContextValue {
  C: ThemeColors;
  dawn: string; // dégradé ember -> gold, utilisé partout comme accent
  hexA: typeof hexA;
  cardShadow: () => string;
  glowShadow: () => string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Calcule la palette active à partir d'un thème + accent optionnel.
 * Remplace `applyTheme()` de la v1, qui mutait un objet global `C` —
 * ici la palette est une valeur calculée et propagée par contexte React,
 * ce qui garantit que tout composant qui en dépend se re-rend correctement.
 */
export function useThemeColors(themeId: ThemeId = 'aube', accent?: string | null): ThemeContextValue {
  return useMemo(() => {
    const t = THEMES[themeId] || THEMES.aube;
    const ember = accent || t.ember;
    const gold = accent ? lighten(accent, 0.35) : t.gold;
    const C: ThemeColors = {
      ...t,
      ember,
      gold,
      ...SEMANTIC_COLORS,
    };
    const dawn = `linear-gradient(135deg, ${C.ember} 0%, ${C.gold} 100%)`;
    const cardShadow = () => '0 6px 20px -6px rgba(0,0,0,0.45)';
    const glowShadow = () => `0 6px 18px -6px ${hexA(C.ember, 0.45)}`;
    return { C, dawn, hexA, cardShadow, glowShadow };
  }, [themeId, accent]);
}

export function ThemeProvider({
  themeId,
  accent,
  children,
}: {
  themeId?: ThemeId;
  accent?: string | null;
  children: ReactNode;
}) {
  const value = useThemeColors(themeId, accent);

  // Synchronise les CSS custom properties (--c-*) avec le thème actif.
  // C'est ce qui fait fonctionner les classes Tailwind comme `bg-surf` ou
  // `text-gold`, dont les couleurs pointent vers ces variables (cf. tailwind.config.js).
  useEffect(() => {
    const r = document.documentElement.style;
    const C = value.C;
    r.setProperty('--c-night', C.night);
    r.setProperty('--c-surf', C.surf);
    r.setProperty('--c-surf2', C.surf2);
    r.setProperty('--c-line', C.line);
    r.setProperty('--c-ember', C.ember);
    r.setProperty('--c-gold', C.gold);
    r.setProperty('--c-text', C.text);
    r.setProperty('--c-dim', C.dim);
    r.setProperty('--c-ok', C.ok);
    r.setProperty('--c-blue', C.blue);
    r.setProperty('--c-red', C.red);
  }, [value.C]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
