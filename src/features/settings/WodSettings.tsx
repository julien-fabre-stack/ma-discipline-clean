import { useState } from 'react';
import type { AppData, Wod } from '@/types';
import { uid } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, Stepper, useConfirm } from '@/shared/ui';

function WodEditor({ wod, onSave, onCancel }: { wod: Wod; onSave: (w: Wod) => void; onCancel: () => void }) {
  const { C, dawn, glowShadow } = useTheme();
  const [w, setW] = useState<Wod>({ ...wod, items: [...(wod.items || [])] });
  const setItem = (i: number, patch: Partial<{ name: string; reps: number }>) => {
    const it = [...w.items];
    it[i] = { ...it[i], ...patch };
    setW({ ...w, items: it });
  };
  return (
    <div className="rounded-2xl p-4" style={{ background: C.surf }}>
      <input
        value={w.name}
        onChange={(e) => setW({ ...w, name: e.target.value })}
        className="w-full px-3 py-2.5 rounded-xl mb-3 outline-none text-sm"
        style={{ background: C.surf2, color: C.text }}
      />
      <div className="flex items-center justify-between py-2 text-sm mb-2">
        <span>Durée (min)</span>
        <Stepper value={Math.round(w.dur / 60)} min={1} onChange={(v) => setW({ ...w, dur: v * 60 })} />
      </div>
      <div className="text-xs mb-2" style={{ color: C.dim }}>
        Exercices :
      </div>
      {w.items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <input
            value={it.name}
            onChange={(e) => setItem(i, { name: e.target.value })}
            placeholder="Exercice"
            className="flex-1 px-3 py-2 rounded-lg outline-none text-sm"
            style={{ background: C.surf2, color: C.text }}
          />
          <Stepper value={it.reps} min={1} onChange={(v) => setItem(i, { reps: v })} />
          <button
            onClick={() => setW({ ...w, items: w.items.filter((_, j) => j !== i) })}
            className="p-1.5 rounded-lg"
            style={{ background: C.surf2 }}
          >
            <Icon name="trash" size={14} color={C.dim} />
          </button>
        </div>
      ))}
      <button
        onClick={() => setW({ ...w, items: [...w.items, { name: '', reps: 10 }] })}
        className="w-full py-2 rounded-lg text-sm font-semibold mb-3"
        style={{ background: C.surf2, color: C.gold }}
      >
        + Exercice
      </button>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-semibold text-sm" style={{ background: C.surf2, color: C.dim }}>
          Annuler
        </button>
        <button
          onClick={() => onSave(w)}
          className="flex-[2] py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

export function WodSettings({ data, update }: { data: AppData; update: (patch: Partial<AppData>) => void }) {
  const { C, dawn, cardShadow, glowShadow } = useTheme();
  const askConfirm = useConfirm();
  const [wodOpen, setWodOpen] = useState<string | null>(null);
  const [imp, setImp] = useState<string | null>(null);

  const parseWod = (txt: string): Wod | null => {
    const lines = txt.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    const head = lines[0].split('|');
    const name = (head[0] || 'WOD').trim();
    const dur = (parseInt(head[1]) || 15) * 60;
    const items = lines
      .slice(1)
      .map((l) => {
        const m = l.match(/^(.*?)[\s:·-]+(\d+)\s*$/);
        return m ? { name: m[1].trim(), reps: +m[2] } : { name: l, reps: 10 };
      })
      .filter((x) => x.name);
    return { id: uid(), name, dur, items };
  };

  return (
    <>
      <div className="text-xs tracking-widest uppercase mb-1" style={{ color: C.dim }}>
        WOD
      </div>
      <div className="text-xs mb-3" style={{ color: C.dim }}>
        L'échauffement (10 burpees + 10 remises debout) est ajouté automatiquement. Touche un WOD pour le modifier.
      </div>
      {(data.wods || []).map((w, i) => {
        const open = wodOpen === w.id;
        return (
          <div
            key={w.id}
            className="rounded-2xl mb-3 overflow-hidden"
            style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
          >
            <div className="flex items-center px-3 py-2.5 gap-2">
              <button onClick={() => setWodOpen(open ? null : w.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <Icon
                  name="down"
                  size={14}
                  color={C.dim}
                  style={{ transition: 'transform 320ms cubic-bezier(.22,1,.36,1)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
                <span className="min-w-0">
                  <span className="text-sm font-semibold block truncate">{w.name}</span>
                  <span className="text-xs block" style={{ color: C.dim }}>
                    {Math.round(w.dur / 60)} min · {(w.items || []).length} exos
                  </span>
                </span>
              </button>
              <button
                onClick={async () => {
                  const ok = await askConfirm({ title: 'Supprimer le WOD', message: `Supprimer « ${w.name} » ?` });
                  if (!ok) return;
                  update({ wods: data.wods.filter((_, j) => j !== i) });
                  if (open) setWodOpen(null);
                }}
                className="p-1.5 rounded-lg flex-shrink-0"
                style={{ background: C.surf2 }}
              >
                <Icon name="trash" size={14} color={C.dim} />
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateRows: open ? '1fr' : '0fr',
                transition: 'grid-template-rows 320ms cubic-bezier(.22,1,.36,1)',
              }}
            >
              <div style={{ minHeight: 0, overflow: 'hidden', opacity: open ? 1 : 0, transition: `opacity 220ms ease ${open ? '60ms' : '0ms'}` }}>
                <div className="px-3 pb-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                  <WodEditor
                    wod={w}
                    onSave={(nw) => {
                      const a = [...data.wods];
                      a[i] = nw;
                      update({ wods: a });
                      setWodOpen(null);
                    }}
                    onCancel={() => setWodOpen(null)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        onClick={() => {
          const id = uid();
          update({ wods: [...(data.wods || []), { id, name: 'Nouveau WOD', dur: 900, items: [] }] });
          setWodOpen(id);
        }}
        className="w-full py-2.5 rounded-xl font-semibold text-sm mt-1"
        style={{ background: C.surf2, color: C.gold }}
      >
        + Ajouter un WOD
      </button>
      {imp == null ? (
        <button onClick={() => setImp('')} className="w-full py-2.5 rounded-xl font-semibold text-sm mt-2" style={{ background: C.surf2, color: C.dim }}>
          ⤓ Importer un WOD (coller)
        </button>
      ) : (
        <div className="rounded-2xl p-4 mt-2" style={{ background: C.surf }}>
          <div className="text-xs mb-2" style={{ color: C.dim }}>
            Colle le texte du WOD. 1ʳᵉ ligne : <span style={{ color: C.gold }}>Nom | minutes</span>, puis un exercice par ligne avec le nombre de reps à la fin.
          </div>
          <textarea
            value={imp}
            onChange={(e) => setImp(e.target.value)}
            rows={6}
            placeholder={'Murph allégé | 20\nPompes 15\nAir squats 20\nTractions 5'}
            className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: C.surf2, color: C.text, fontFamily: 'monospace' }}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setImp(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm" style={{ background: C.surf2, color: C.dim }}>
              Annuler
            </button>
            <button
              onClick={() => {
                const w = parseWod(imp);
                if (w && w.items.length) {
                  update({ wods: [...(data.wods || []), w] });
                  setImp(null);
                }
              }}
              className="flex-[2] py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
            >
              Importer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
