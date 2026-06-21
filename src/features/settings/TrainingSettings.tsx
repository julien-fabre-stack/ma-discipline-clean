import { useState } from 'react';
import type { AppData, Workout } from '@/types';
import { getWorkouts } from '@/lib/workouts';
import { uid } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, useConfirm } from '@/shared/ui';
import { ExerciseList } from './ExerciseList';
import { WodSettings } from './WodSettings';

export interface TrainingSettingsProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
}

const WEEKDAYS: [string, number][] = [
  ['Lundi', 1],
  ['Mardi', 2],
  ['Mercredi', 3],
  ['Jeudi', 4],
  ['Vendredi', 5],
  ['Samedi', 6],
  ['Dimanche', 0],
];

export function TrainingSettings({ data, update }: TrainingSettingsProps) {
  const { C, dawn, cardShadow, glowShadow } = useTheme();
  const askConfirm = useConfirm();
  const workouts = getWorkouts(data);
  const wt = data.weekTemplate || {};
  const [openW, setOpenW] = useState<string | null>(null);

  const setWorkout = (id: string, patch: Partial<Workout>) => {
    update({ workouts: workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) });
  };
  const addWorkout = () => {
    const id = uid();
    update({ workouts: [...workouts, { id, name: 'Nouvelle séance', items: [] }] });
    setOpenW(id);
  };
  const delWorkout = async (id: string) => {
    const w = workouts.find((x) => x.id === id);
    if (workouts.length <= 1) {
      await askConfirm({
        title: 'Impossible',
        message: 'Tu dois garder au moins une séance.',
        confirmLabel: 'OK',
        cancelLabel: 'Fermer',
      });
      return;
    }
    const ok = await askConfirm({ title: 'Supprimer la séance', message: `Supprimer « ${w ? w.name : ''} » ?` });
    if (!ok) return;
    const nwt = { ...wt };
    Object.keys(nwt).forEach((k) => {
      if (nwt[+k] === id) delete nwt[+k];
    });
    update({ workouts: workouts.filter((w) => w.id !== id), weekTemplate: nwt });
    if (openW === id) setOpenW(null);
  };
  const setDayWorkout = (wd: number, wid: string) => {
    const nwt = { ...wt };
    if (!wid) delete nwt[wd];
    else nwt[wd] = wid;
    update({ weekTemplate: nwt });
  };

  return (
    <div className="px-5 pb-10">
      <div className="text-xs tracking-widest uppercase mb-3 mt-2" style={{ color: C.dim }}>
        Séances
      </div>
      {workouts.map((w) => {
        const open = openW === w.id;
        return (
          <div
            key={w.id}
            className="rounded-2xl mb-3 overflow-hidden"
            style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
          >
            <div className="flex items-center px-3 py-2.5 gap-2">
              <button onClick={() => setOpenW(open ? null : w.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <Icon
                  name="down"
                  size={14}
                  color={C.dim}
                  style={{ transition: 'transform 320ms cubic-bezier(.22,1,.36,1)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
                <span className="min-w-0">
                  <span className="text-sm font-semibold block truncate">{w.name}</span>
                  <span className="text-xs block" style={{ color: C.dim }}>
                    {(w.items || []).length} exercices
                  </span>
                </span>
              </button>
              <button onClick={() => delWorkout(w.id)} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: C.surf2 }}>
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
                  <input
                    value={w.name}
                    onChange={(e) => setWorkout(w.id, { name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl mb-3 outline-none text-sm"
                    style={{ background: C.surf2, color: C.text }}
                  />
                  <ExerciseList items={w.items || []} onChange={(items) => setWorkout(w.id, { items })} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={addWorkout} className="w-full py-2.5 rounded-xl font-semibold text-sm mt-1 mb-6" style={{ background: C.surf2, color: C.gold }}>
        + Ajouter une séance
      </button>

      <div className="text-xs tracking-widest uppercase mb-3" style={{ color: C.dim }}>
        Semaine type
      </div>
      <div className="text-xs mb-3" style={{ color: C.dim }}>
        Choisis quelle séance se déclenche chaque jour. « Repos » = pas de séance.
      </div>
      <div className="rounded-2xl overflow-hidden mb-6" style={{ border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
        {WEEKDAYS.map(([lbl, wd], i) => (
          <div
            key={wd}
            className="flex items-center justify-between px-4 py-2.5"
            style={{ background: i % 2 ? C.surf : C.night, borderTop: i > 0 ? `1px solid ${C.line}` : 'none' }}
          >
            <span className="text-sm">{lbl}</span>
            <select
              value={wt[wd] || ''}
              onChange={(e) => setDayWorkout(wd, e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
            >
              <option value="">Repos</option>
              {workouts.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <WodSettings data={data} update={update} />

      <div className="h-px my-6" style={{ background: C.line }} />
      <div className="text-xs tracking-widest uppercase mb-2" style={{ color: C.dim }}>
        Cycle d'entraînement
      </div>
      <div className="rounded-2xl p-4" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
        <div className="text-sm mb-3" style={{ color: C.dim }}>
          Date de départ du cycle 9 semaines (8 actives + 1 décharge). Sert au libellé « Semaine N/8 ».
        </div>
        <input
          type="date"
          value={data.cycleStart || ''}
          onChange={(e) => update({ cycleStart: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
          style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
        />
        <button
          onClick={async () => {
            const ok = await askConfirm({
              title: 'Réinitialiser le cycle',
              message: "Repartir d'aujourd'hui comme semaine 1 ?",
              confirmLabel: 'Réinitialiser',
            });
            if (ok) update({ cycleStart: new Date().toISOString().slice(0, 10) });
          }}
          className="w-full mt-3 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
        >
          Repartir d'aujourd'hui
        </button>
      </div>
    </div>
  );
}
