import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type {
  ThemeId,
  CustomColors,
  FontFamilyId,
  FontScaleId,
  TabTransitionId,
  AnimSpeedId,
} from '@/types';
import {
  THEMES,
  SEMANTIC_COLORS,
  lighten,
  hexA,
  buildCustomPalette,
  FONT_FAMILIES,
  FONT_SCALES,
  ANIM_SPEEDS,
  DEFAULT_CUSTOM_COLORS,
  type ThemePalette,
} from './themes';

export interface ThemeColors extends ThemePalette {
  text: string;
  dim: string;
  ok: string;
  blue: string;
  red: string;
}

export interface AppearanceOpts {
  customColors?: CustomColors | null;
  fontFamily?: FontFamilyId;
  fontScale?: FontScaleId;
  tabTransition?: TabTransitionId;
  animSpeed?: AnimSpeedId;
  buttonAnim?: boolean;
}

export interface ThemeContextValue {
  C: ThemeColors;
  dawn: string; // dégradé ember -> gold, utilisé partout comme accent
  onAccent: string; // couleur de texte lisible sur un fond accent
  hexA: typeof hexA;
  cardShadow: () => string;
  glowShadow: () => string;
  tabTransition: TabTransitionId;
  animMult: number;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Calcule la palette active à partir d'un thème + accent + réglages d'apparence.
 * La palette est une valeur calculée et propagée par contexte React, ce qui
 * garantit que tout composant qui en dépend se re-rend correctement.
 */
export function useThemeColors(
  themeId: ThemeId = 'aube',
  accent?: string | null,
  opts: AppearanceOpts = {}
): ThemeContextValue {
  const { customColors, animSpeed } = opts;
  const customKey = customColors ? `${customColors.night}|${customColors.ember}|${customColors.gold}` : '';

  return useMemo(() => {
    const base: ThemePalette =
      themeId === 'custom'
        ? buildCustomPalette(customColors || DEFAULT_CUSTOM_COLORS)
        : THEMES[themeId] || THEMES.aube;

    const ember = accent || base.ember;
    const gold = accent ? lighten(accent, 0.35) : base.gold;
    // SEMANTIC_COLORS fournit les valeurs par défaut (text/dim clairs) ;
    // un thème clair comme "Cahier" peut les surcharger via base.text/base.dim.
    const C: ThemeColors = {
      ...SEMANTIC_COLORS,
      ...base,
      ember,
      gold,
      text: base.text ?? SEMANTIC_COLORS.text,
      dim: base.dim ?? SEMANTIC_COLORS.dim,
    };
    const onAccent = base.onAccent ?? '#1A1206';
    const dawn = `linear-gradient(135deg, ${C.ember} 0%, ${C.gold} 100%)`;
    const cardShadow = () =>
      base.light ? '0 1px 0 0 rgba(0,0,0,0.04)' : '0 6px 20px -6px rgba(0,0,0,0.45)';
    const glowShadow = () =>
      base.light ? 'none' : `0 6px 18px -6px ${hexA(C.ember, 0.45)}`;
    const animMult = ANIM_SPEEDS[animSpeed || 'normal']?.mult ?? 1;
    return {
      C,
      dawn,
      onAccent,
      hexA,
      cardShadow,
      glowShadow,
      tabTransition: opts.tabTransition || 'slide',
      animMult,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId, accent, customKey, animSpeed, opts.tabTransition]);
}

export function ThemeProvider({
  themeId,
  accent,
  appearance = {},
  children,
}: {
  themeId?: ThemeId;
  accent?: string | null;
  appearance?: AppearanceOpts;
  children: ReactNode;
}) {
  const value = useThemeColors(themeId, accent, appearance);

  // Synchronise les CSS custom properties (--c-*) avec le thème actif.
  // C'est ce qui fait fonctionner les classes Tailwind comme `bg-surf` ou
  // `text-gold`, dont les couleurs pointent vers ces variables.
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
    // Bascule le color-scheme natif (scrollbars, sélecteurs de date, etc.)
    document.documentElement.style.colorScheme = value.C.light ? 'light' : 'dark';
  }, [value.C]);

  // Typographie + vitesse d'animation, pilotées par CSS variables globales.
  useEffect(() => {
    const r = document.documentElement.style;
    const fam = FONT_FAMILIES[appearance.fontFamily || 'system'].stack;
    const scale = FONT_SCALES[appearance.fontScale || 'normal'].value;
    const mult = ANIM_SPEEDS[appearance.animSpeed || 'normal'].mult;
    r.setProperty('--font-app', fam);
    r.setProperty('--font-scale', String(scale));
    r.setProperty('--anim-mult', String(mult));
    r.setProperty('--btn-anim', appearance.buttonAnim === false ? '0' : '1');
  }, [appearance.fontFamily, appearance.fontScale, appearance.animSpeed, appearance.buttonAnim]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
