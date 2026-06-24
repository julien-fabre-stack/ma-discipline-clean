import type {
  AppData,
  ThemeId,
  FontFamilyId,
  FontScaleId,
  TabTransitionId,
  AnimSpeedId,
} from '@/types';
import {
  THEMES,
  FONT_FAMILIES,
  FONT_SCALES,
  ANIM_SPEEDS,
  TAB_TRANSITIONS,
  DEFAULT_CUSTOM_COLORS,
} from '@/shared/theme/themes';
import { useTheme } from '@/shared/theme/ThemeProvider';

export interface ThemeSettingsProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
}

const ACCENTS = ['#FF7A45', '#FFC24B', '#5BC0FF', '#A78BFA', '#4ADE80', '#FF6FA5', '#34D1BF', '#E5484D'];

export function ThemeSettings({ data, update }: ThemeSettingsProps) {
  const { C, dawn, cardShadow } = useTheme();
  const themeId: ThemeId = data.theme || 'aube';
  const accent = data.accent || null;
  const navAlpha = data.navAlpha == null ? 0.92 : data.navAlpha;
  const runnerText = data.runnerTextColor || '#FFFFFF';
  const finishMsg = data.runnerFinishMsg || '';

  const custom = data.customColors || DEFAULT_CUSTOM_COLORS;
  const fontFamily: FontFamilyId = data.fontFamily || 'system';
  const fontScale: FontScaleId = data.fontScale || 'normal';
  const textColor = data.textColor || null;
  const dimColor = data.dimColor || null;
  const tabTransition: TabTransitionId = data.tabTransition || 'slide';
  const animSpeed: AnimSpeedId = data.animSpeed || 'normal';
  const buttonAnim = data.buttonAnim !== false;

  const card = {
    background: C.surf,
    border: `1px solid ${C.line}`,
    boxShadow: cardShadow(),
  } as const;

  const sectionTitle = (label: string) => (
    <div className="text-xs tracking-widest uppercase mb-3 mt-2" style={{ color: C.dim }}>
      {label}
    </div>
  );

  const setCustom = (patch: Partial<typeof custom>) =>
    update({ theme: 'custom', customColors: { ...custom, ...patch } });

  return (
    <div className="px-5 pb-10">
      {/* ===== THÈMES ===== */}
      {sectionTitle('Thème')}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(Object.keys(THEMES) as ThemeId[]).map((id) => {
          const t = THEMES[id];
          const active = themeId === id;
          const previewEmber = id === 'custom' ? custom.ember : t.ember;
          const previewGold = id === 'custom' ? custom.gold : t.gold;
          const previewNight = id === 'custom' ? custom.night : t.night;
          return (
            <button
              key={id}
              onClick={() => update({ theme: id })}
              className="rounded-2xl p-3 text-left"
              style={{
                background: id === 'custom' ? previewNight : t.surf,
                border: active ? `2px solid ${previewEmber}` : `1px solid ${t.line}`,
                boxShadow: active ? cardShadow() : 'none',
              }}
            >
              <div className="flex gap-1.5 mb-2">
                <span className="w-5 h-5 rounded-full" style={{ background: previewEmber }} />
                <span className="w-5 h-5 rounded-full" style={{ background: previewGold }} />
                <span className="w-5 h-5 rounded-full" style={{ background: t.surf2 }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: t.text ?? '#F3EDE7' }}>
                {t.name}
              </div>
              {active && (
                <div className="text-[10px] mt-0.5" style={{ color: previewGold }}>
                  Actif
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ===== THÈME PERSONNALISÉ ===== */}
      {themeId === 'custom' && (
        <>
          {sectionTitle('Couleurs personnalisées')}
          <div className="rounded-2xl p-4 mb-6 space-y-4" style={card}>
            {([
              ['night', 'Fond'],
              ['ember', 'Principale'],
              ['gold', 'Secondaire'],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums" style={{ color: C.dim }}>
                    {custom[key].toUpperCase()}
                  </span>
                  <label className="relative" style={{ width: 36, height: 36 }}>
                    <span
                      className="block w-full h-full rounded-full"
                      style={{ background: custom[key], border: `1px solid ${C.line}` }}
                    />
                    <input
                      type="color"
                      value={custom[key]}
                      onChange={(e) => setCustom({ [key]: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            ))}
            <div className="text-xs" style={{ color: C.dim }}>
              Les surfaces (cartes, fonds secondaires) sont calculées à partir du fond.
            </div>
          </div>
        </>
      )}

      {/* ===== ACCENT ===== */}
      {sectionTitle("Couleur d'accent")}
      <div className="rounded-2xl p-4 mb-6" style={card}>
        <div className="text-xs mb-3" style={{ color: C.dim }}>
          Remplace la couleur principale du thème. « Auto » garde celle du thème.
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => update({ accent: null })}
            className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: !accent ? dawn : C.surf2, color: !accent ? '#1A1206' : C.dim }}
          >
            Auto
          </button>
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => update({ accent: c })}
              className="w-9 h-9 rounded-full flex-shrink-0"
              style={{ background: c, border: accent === c ? `3px solid ${C.text}` : '3px solid transparent' }}
            />
          ))}
          <label className="relative" style={{ width: 36, height: 36 }}>
            <span
              className="block w-full h-full rounded-full flex items-center justify-center text-xs"
              style={{ background: C.surf2, color: C.dim, lineHeight: '36px', textAlign: 'center' }}
            >
              +
            </span>
            <input
              type="color"
              value={accent || '#FF7A45'}
              onChange={(e) => update({ accent: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* ===== TYPOGRAPHIE ===== */}
      {sectionTitle('Typographie')}
      <div className="rounded-2xl p-4 mb-6 space-y-4" style={card}>
        <div>
          <div className="text-sm mb-2">Police</div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FONT_FAMILIES) as FontFamilyId[]).map((id) => {
              const active = fontFamily === id;
              return (
                <button
                  key={id}
                  onClick={() => update({ fontFamily: id })}
                  className="px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: active ? dawn : C.surf2,
                    color: active ? '#1A1206' : C.text,
                    fontFamily: FONT_FAMILIES[id].stack,
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {FONT_FAMILIES[id].name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-sm mb-2">Taille du texte</div>
          <div className="flex gap-2">
            {(Object.keys(FONT_SCALES) as FontScaleId[]).map((id) => {
              const active = fontScale === id;
              return (
                <button
                  key={id}
                  onClick={() => update({ fontScale: id })}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: active ? dawn : C.surf2,
                    color: active ? '#1A1206' : C.text,
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {FONT_SCALES[id].name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-sm mb-2">Couleur du texte</div>
          <div className="space-y-3">
            {([
              ['principal', textColor, (v: string | null) => update({ textColor: v }), C.text],
              ['estompé', dimColor, (v: string | null) => update({ dimColor: v }), C.dim],
            ] as const).map(([label, val, set, fallback]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm capitalize" style={{ color: fallback }}>
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => set(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: !val ? dawn : C.surf2, color: !val ? '#1A1206' : C.dim }}
                  >
                    Auto
                  </button>
                  <label className="relative" style={{ width: 32, height: 32 }}>
                    <span
                      className="block w-full h-full rounded-full"
                      style={{ background: val || fallback, border: `1px solid ${C.line}` }}
                    />
                    <input
                      type="color"
                      value={val || fallback}
                      onChange={(e) => set(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== ANIMATIONS ===== */}
      {sectionTitle('Animations')}
      <div className="rounded-2xl p-4 mb-6 space-y-4" style={card}>
        <div>
          <div className="text-sm mb-2">Transition entre onglets</div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(TAB_TRANSITIONS) as TabTransitionId[]).map((id) => {
              const active = tabTransition === id;
              return (
                <button
                  key={id}
                  onClick={() => update({ tabTransition: id })}
                  className="px-3 py-2.5 rounded-xl text-sm"
                  style={{
                    background: active ? dawn : C.surf2,
                    color: active ? '#1A1206' : C.text,
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {TAB_TRANSITIONS[id]}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-sm mb-2">Vitesse</div>
          <div className="flex gap-2">
            {(Object.keys(ANIM_SPEEDS) as AnimSpeedId[]).map((id) => {
              const active = animSpeed === id;
              return (
                <button
                  key={id}
                  onClick={() => update({ animSpeed: id })}
                  className="flex-1 px-2 py-2.5 rounded-xl text-xs"
                  style={{
                    background: active ? dawn : C.surf2,
                    color: active ? '#1A1206' : C.text,
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {ANIM_SPEEDS[id].name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm">Retour tactile</div>
            <div className="text-xs" style={{ color: C.dim }}>
              Léger enfoncement des boutons au tap.
            </div>
          </div>
          <button
            onClick={() => update({ buttonAnim: !buttonAnim })}
            className="relative rounded-full"
            style={{
              width: 48,
              height: 28,
              background: buttonAnim ? C.ember : C.surf2,
              transition: 'background 200ms ease',
            }}
          >
            <span
              className="absolute rounded-full"
              style={{
                top: 3,
                left: buttonAnim ? 23 : 3,
                width: 22,
                height: 22,
                background: '#fff',
                transition: 'left 200ms ease',
              }}
            />
          </button>
        </div>
      </div>

      {/* ===== BARRE DE NAVIGATION ===== */}
      {sectionTitle('Barre de navigation')}
      <div className="rounded-2xl p-4 mb-6" style={card}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Transparence</span>
          <span className="text-xs tabular-nums" style={{ color: C.dim }}>
            {Math.round((1 - navAlpha) * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0.4}
          max={1}
          step={0.01}
          value={navAlpha}
          onChange={(e) => update({ navAlpha: +e.target.value })}
          className="w-full"
          style={{ accentColor: C.ember }}
        />
        <div className="text-xs mt-1" style={{ color: C.dim }}>
          Plus transparent = effet verre dépoli sur la barre du bas.
        </div>
      </div>

      {/* ===== LECTEUR DE SÉANCE ===== */}
      {sectionTitle('Lecteur de séance')}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm">Couleur du texte</span>
          <div className="flex gap-2">
            {['#FFFFFF', '#1A1206', C.gold].map((c) => (
              <button
                key={c}
                onClick={() => update({ runnerTextColor: c })}
                className="w-8 h-8 rounded-full flex-shrink-0"
                style={{ background: c, border: runnerText === c ? `3px solid ${C.ember}` : `1px solid ${C.line}` }}
              />
            ))}
            <label className="relative" style={{ width: 32, height: 32 }}>
              <span className="block w-full h-full rounded-full" style={{ background: runnerText, border: `1px solid ${C.line}` }} />
              <input
                type="color"
                value={runnerText}
                onChange={(e) => update({ runnerTextColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
        <div>
          <span className="text-sm">Message de fin de séance</span>
          <input
            value={finishMsg}
            onChange={(e) => update({ runnerFinishMsg: e.target.value })}
            placeholder="🏆 Félicitations ! Séance terminée !"
            className="w-full mt-2 px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: C.surf2, color: C.text }}
          />
        </div>
      </div>
    </div>
  );
}
