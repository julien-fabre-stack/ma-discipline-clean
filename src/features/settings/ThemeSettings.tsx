import type { AppData, ThemeId } from '@/types';
import { THEMES } from '@/shared/theme/themes';
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

  return (
    <div className="px-5 pb-10">
      <div className="text-xs tracking-widest uppercase mb-3 mt-2" style={{ color: C.dim }}>
        Thème
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(Object.keys(THEMES) as ThemeId[]).map((id) => {
          const t = THEMES[id];
          const active = themeId === id;
          return (
            <button
              key={id}
              onClick={() => update({ theme: id })}
              className="rounded-2xl p-3 text-left"
              style={{
                background: t.surf,
                border: active ? `2px solid ${t.ember}` : `1px solid ${t.line}`,
                boxShadow: active ? cardShadow() : 'none',
              }}
            >
              <div className="flex gap-1.5 mb-2">
                <span className="w-5 h-5 rounded-full" style={{ background: t.ember }} />
                <span className="w-5 h-5 rounded-full" style={{ background: t.gold }} />
                <span className="w-5 h-5 rounded-full" style={{ background: t.surf2 }} />
              </div>
              <div className="text-sm font-semibold" style={{ color: '#F3EDE7' }}>
                {t.name}
              </div>
              {active && (
                <div className="text-[10px] mt-0.5" style={{ color: t.gold }}>
                  Actif
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-xs tracking-widest uppercase mb-3" style={{ color: C.dim }}>
        Couleur d'accent
      </div>
      <div className="rounded-2xl p-4 mb-6" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
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

      <div className="text-xs tracking-widest uppercase mb-3" style={{ color: C.dim }}>
        Barre de navigation
      </div>
      <div className="rounded-2xl p-4 mb-6" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
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

      <div className="text-xs tracking-widest uppercase mb-3" style={{ color: C.dim }}>
        Lecteur de séance
      </div>
      <div className="rounded-2xl p-4" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
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
