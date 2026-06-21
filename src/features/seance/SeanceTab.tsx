import { useState } from 'react';
import type { AppData, Wod } from '@/types';
import { dateKey } from '@/lib/utils';
import { cycleLabelFor, getWorkouts, workoutForDay } from '@/lib/workouts';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Collapsible, Icon } from '@/shared/ui';

export interface SeanceTabProps {
  data: AppData;
  openRunner: (idx: number) => void;
  openWod: (wod: Wod) => void;
  openSettings: () => void;
  markSport: () => void;
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

export function SeanceTab({ data, openRunner, openWod, openSettings, markSport }: SeanceTabProps) {
  const { C, dawn, cardShadow, glowShadow } = useTheme();
  const today = dateKey();
  const todayWorkout = workoutForDay(data, today);
  const workouts = getWorkouts(data);
  const wt = data.weekTemplate || {};
  const hasProg = Boolean(data.progress && data.progress.idx > 0 && todayWorkout);
  const [openWeek, setOpenWeek] = useState(false);
  const todayWd = new Date().getDay();
  const nameOf = (wid: string | undefined) => {
    const w = workouts.find((x) => x.id === wid);
    return w ? w.name : null;
  };
  const day = data.days[today] || {};
  const sportDone = Boolean(day.habits && !Array.isArray(day.habits) && day.habits.sport);

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="sticky top-0 z-20 -mx-5 px-5 pt-2 pb-3" style={{ background: C.night }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: C.dim }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              {todayWorkout ? todayWorkout.name : 'Repos'}
            </h1>
            <div className="text-sm" style={{ color: C.gold }}>
              {cycleLabelFor(data, today)}
            </div>
          </div>
          <button onClick={openSettings} className="p-2 rounded-full mt-1" style={{ background: C.surf }}>
            <Icon name="gear" size={20} color={C.dim} />
          </button>
        </div>
      </div>

      {todayWorkout ? (
        <div
          className="rounded-3xl p-5 mb-4"
          style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
        >
          <div className="font-bold mb-1">{todayWorkout.name}</div>
          <div className="text-sm mb-4" style={{ color: C.dim }}>
            {(todayWorkout.items || []).length} exercices · minuteurs auto.
            {hasProg && ' Séance en cours.'}
          </div>
          <div className="flex gap-2">
            {hasProg && (
              <button
                onClick={() => openRunner(data.progress!.idx)}
                className="flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
              >
                <Icon name="play" size={20} /> Reprendre
              </button>
            )}
            <button
              onClick={() => openRunner(0)}
              className="flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
              style={{ background: hasProg ? C.surf2 : dawn, color: hasProg ? C.text : '#1A1206' }}
            >
              <Icon name={hasProg ? 'skip' : 'play'} size={20} /> {hasProg ? 'Recommencer' : 'Démarrer'}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-3xl p-5 mb-4 text-center"
          style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
        >
          <div className="text-sm" style={{ color: C.dim }}>
            Pas de séance prévue aujourd'hui. Profite du repos.
          </div>
        </div>
      )}

      <div
        className="rounded-3xl p-5 mb-4"
        style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
      >
        <div className="font-bold mb-1 flex items-center gap-2">
          <Icon name="flame" size={18} color={C.gold} /> WOD
        </div>
        <div className="text-sm mb-3" style={{ color: C.dim }}>
          Échauffement 10 burpees + 10 remises debout, puis le WOD choisi.
        </div>
        {(data.wods || []).length === 0 ? (
          <div className="text-sm" style={{ color: C.gold }}>
            Ajoute tes WODs dans Réglages → WOD.
          </div>
        ) : (
          (data.wods || []).map((w) => (
            <button
              key={w.id}
              onClick={() => openWod(w)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-2"
              style={{ background: C.surf2 }}
            >
              <span className="text-sm font-medium">{w.name}</span>
              <Icon name="play" size={18} color={C.gold} />
            </button>
          ))
        )}
      </div>

      <button
        onClick={markSport}
        className="w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 mb-6"
        style={{ background: C.surf2, color: sportDone ? C.ok : C.text }}
      >
        <Icon name="check" size={18} /> {sportDone ? '« Sport » fait ✓' : 'Marquer « Sport » fait aujourd\'hui'}
      </button>

      <Collapsible title="La semaine type" open={openWeek} onToggle={() => setOpenWeek((o) => !o)}>
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
          {WEEKDAYS.map(([lbl, wd], i) => {
            const nm = nameOf(wt[wd]);
            const isToday = wd === todayWd;
            return (
              <div
                key={wd}
                className="flex justify-between px-4 py-3 text-sm"
                style={{
                  background: isToday ? C.surf2 : i % 2 ? C.surf : C.night,
                  borderLeft: isToday ? `3px solid ${C.gold}` : '3px solid transparent',
                }}
              >
                <span style={{ fontWeight: isToday ? 700 : 400, color: isToday ? C.gold : C.text }}>
                  {lbl}
                </span>
                <span style={{ color: nm ? C.text : C.dim }}>{nm || 'Repos'}</span>
              </div>
            );
          })}
        </div>
      </Collapsible>
    </div>
  );
}
