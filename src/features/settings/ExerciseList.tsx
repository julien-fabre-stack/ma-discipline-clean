import { useState } from 'react';
import type { Exercise } from '@/types';
import { exerciseImageSrc } from '@/lib/exerciseImages';
import { uid } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, Stepper, useConfirm } from '@/shared/ui';
import { ExerciseImg } from '@/shared/ui/ExerciseImg';

/** Traduit un nombre de secondes en libellé lisible : « 1h 05min 30s », « 45min », « 90s ». */
function humanDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  if (s === 0) return '0s';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  if (sec > 0) parts.push(`${sec}s`);
  return parts.join(' ');
}

function ExerciseEditor({
  ex,
  onChange,
  onClose,
}: {
  ex: Exercise;
  onChange: (patch: Partial<Exercise>) => void;
  onClose: () => void;
}) {
  const { C, dawn, glowShadow } = useTheme();
  return (
    <div className="rounded-2xl p-4 mb-2" style={{ background: C.surf2 }}>
      <ExerciseImg name={ex.name} className="w-full h-40 object-contain rounded-xl mb-3" style={{ background: C.surf }} />
      <input
        value={ex.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="w-full px-3 py-2.5 rounded-xl mb-3 outline-none text-sm"
        style={{ background: C.surf, color: C.text }}
      />
      <div className="flex items-center justify-between py-2 text-sm">
        <span>Séries</span>
        <Stepper value={ex.sets} min={1} onChange={(v) => onChange({ sets: v })} />
      </div>
      <div className="flex items-center justify-between py-2 text-sm">
        <span>Chronométré</span>
        <button
          onClick={() => onChange({ timed: !ex.timed })}
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: ex.timed ? C.ember : C.surf, color: ex.timed ? '#1A1206' : C.dim }}
        >
          {ex.timed ? 'Oui' : 'Non'}
        </button>
      </div>
      {ex.timed ? (
        <div className="py-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Durée (secondes)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={ex.dur}
              onChange={(e) => onChange({ dur: Math.max(0, Math.floor(+e.target.value || 0)) })}
              className="w-28 px-3 py-1.5 rounded-lg text-sm text-right outline-none tabular-nums"
              style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
            />
          </div>
          <div className="text-right text-xs mt-1" style={{ color: C.gold }}>
            = {humanDuration(ex.dur)}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between py-2 text-sm">
          <span>Répétitions</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={ex.reps}
            onChange={(e) => onChange({ reps: Math.max(0, Math.floor(+e.target.value || 0)) })}
            className="w-28 px-3 py-1.5 rounded-lg text-sm text-right outline-none tabular-nums"
            style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
          />
        </div>
      )}
      <div className="py-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Repos après (secondes)</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={ex.rest}
            onChange={(e) => onChange({ rest: Math.max(0, Math.floor(+e.target.value || 0)) })}
            className="w-28 px-3 py-1.5 rounded-lg text-sm text-right outline-none tabular-nums"
            style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
          />
        </div>
        {ex.rest > 0 && (
          <div className="text-right text-xs mt-1" style={{ color: C.dim }}>
            = {humanDuration(ex.rest)}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="w-full mt-3 py-2.5 rounded-xl font-semibold"
        style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
      >
        OK
      </button>
    </div>
  );
}

export function ExerciseList({ items, onChange }: { items: Exercise[]; onChange: (items: Exercise[]) => void }) {
  const { C } = useTheme();
  const askConfirm = useConfirm();
  const [edit, setEdit] = useState<number | null>(null);

  // Garde la position de scroll sur la ligne concernée, à l'ouverture comme à la fermeture
  // de l'éditeur — au lieu de faire sauter l'écran en haut de la page Training.
  const scrollToRow = (i: number) => {
    requestAnimationFrame(() => {
      document.getElementById(`ex-row-${i}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };
  const openEdit = (i: number) => {
    setEdit(i);
    scrollToRow(i);
  };
  const closeEdit = (i: number) => {
    setEdit(null);
    scrollToRow(i);
  };

  const move = (i: number, dir: number) => {
    const s = [...items];
    const j = i + dir;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    onChange(s);
  };
  const del = async (i: number) => {
    const ok = await askConfirm({
      title: "Supprimer l'exercice",
      message: `Supprimer « ${items[i].name} » de la séance ?`,
    });
    if (!ok) return;
    onChange(items.filter((_, j) => j !== i));
    setEdit(null);
  };
  const add = () => {
    const s = [...items, { id: uid(), name: 'Nouvel exercice', reps: 10, rest: 60, sets: 1, timed: false, dur: 20 }];
    onChange(s);
    openEdit(s.length - 1);
  };
  const setEx = (i: number, patch: Partial<Exercise>) => {
    const s = [...items];
    s[i] = { ...s[i], ...patch };
    onChange(s);
  };
  const dup = (i: number) => {
    const s = [...items];
    s.splice(i + 1, 0, { ...s[i], id: uid() });
    onChange(s);
  };

  return (
    <>
      <div className="text-xs mb-3" style={{ color: C.dim }}>
        Repos = 0 → exercice enchaîné avec le suivant.
      </div>
      {items.map((ex, i) => {
        const isEditing = edit === i;
        return (
          <div key={ex.id} id={`ex-row-${i}`}>
            {isEditing ? (
              <ExerciseEditor ex={ex} onChange={(p) => setEx(i, p)} onClose={() => closeEdit(i)} />
            ) : (
              <div className="flex items-center gap-2 mb-2 px-3 py-2.5 rounded-xl" style={{ background: C.surf2 }}>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(i, -1)} className="p-0.5">
                    <Icon name="up" size={14} color={C.dim} />
                  </button>
                  <button onClick={() => move(i, 1)} className="p-0.5">
                    <Icon name="down" size={14} color={C.dim} />
                  </button>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: C.surf }}
                >
                  <ExerciseImg name={ex.name} className="w-full h-full object-cover" />
                  {!exerciseImageSrc(ex.name) && <Icon name="dumbbell" size={16} color={C.dim} />}
                </div>
                <button onClick={() => openEdit(i)} className="flex-1 text-left min-w-0">
                  <div className="text-sm truncate">{ex.name}</div>
                  <div className="text-xs" style={{ color: C.dim }}>
                    {ex.sets > 1 ? ex.sets + '× ' : ''}
                    {ex.timed ? humanDuration(ex.dur) : ex.reps + ' reps'} · repos {humanDuration(ex.rest)}
                  </div>
                </button>
                <button onClick={() => openEdit(i)} className="p-1.5 rounded-lg" style={{ background: C.surf }}>
                  <Icon name="edit" size={14} color={C.gold} />
                </button>
                <button onClick={() => dup(i)} className="p-1.5 rounded-lg" style={{ background: C.surf }}>
                  <Icon name="copy" size={14} color={C.dim} />
                </button>
                <button onClick={() => del(i)} className="p-1.5 rounded-lg" style={{ background: C.surf }}>
                  <Icon name="trash" size={14} color={C.dim} />
                </button>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={add} className="w-full py-2.5 rounded-xl font-semibold text-sm mt-1" style={{ background: C.surf2, color: C.gold }}>
        + Ajouter un exercice
      </button>
    </>
  );
}
