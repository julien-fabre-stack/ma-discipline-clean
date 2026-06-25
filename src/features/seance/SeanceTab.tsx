import { useState } from 'react';
import type { AppData, Wod } from '@/types';
import { dateKey } from '@/lib/utils';
import { cycleLabelFor, getWorkouts, workoutsForDay } from '@/lib/workouts';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Collapsible, Icon } from '@/shared/ui';

export interface SeanceTabProps {
  data: AppData;
  openRunner: (wid: string, idx: number) => void;
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
  const { C, dawn, hexA, cardShadow, glowShadow } = useTheme();
  const today = dateKey();
  const todayWorkouts = workoutsForDay(data, today);
  const workouts = getWorkouts(data);
  const wt = data.weekTemplate || {};
  const progWid = data.progress && data.progress.idx > 0 ? data.progress.wid : null;
  const [openWeek, setOpenWeek] = useState(false);
  const todayWd = new Date().getDay();
  const namesOf = (v: string | string[] | undefined) => {
    const ids = Array.isArray(v) ? v : v ? [v] : [];
    const ns = ids
      .map((id) => workouts.find((x) => x.id === id)?.name)
      .filter((n): n is string => Boolean(n));
    return ns.length ? ns.join(' + ') : null;
  };
  const day = data.days[today] || {};
  const sportDone = Boolean(day.habits && !Array.isArray(day.habits) && day.habits.sport);
  const headTitle = todayWorkouts.length ? todayWorkouts.map((w) => w.name).join(' + ') : 'Repos';

  return (
    <div className="px-5 pb-28">
    <div
  className="sticky z-20 -mx-5 px-5 pb-3"
  style={{
    top: 0,
    paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
    background: hexA(C.night, 0.75),
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  }}
>

        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: C.dim }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">{headTitle}</h1>
            <div className="text-sm" style={{ color: C.gold }}>
              {cycleLabelFor(data, today)}
            </div>
          </div>
          <button onClick={openSettings} className="p-2 rounded-full" style={{ background: C.surf }}>
            <Icon name="gear" size={20} color={C.dim} />
          </button>
        </div>
      </div>

      <div className="pt-5" />

      {todayWorkouts.length ? (
        todayWorkouts.map((w) => {
          const hasProg = progWid === w.id;
          return (
            <div
              key={w.id}
              className="rounded-3xl p-5 mb-4"
              style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
            >
              <div className="font-bold mb-1">{w.name}</div>
              <div className="text-sm mb-4" style={{ color: C.dim }}>
                {(w.items || []).length} exercices · minuteurs auto.
                {hasProg && ' Séance en cours.'}
              </div>
              <div className="flex gap-2">
                {hasProg && (
                  <button
                    onClick={() => openRunner(w.id, data.progress!.idx)}
                    className="flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                    style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
                  >
                    <Icon name="play" size={20} /> Reprendre
                  </button>
                )}
                <button
                  onClick={() => openRunner(w.id, 0)}
                  className="flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                  style={{ background: hasProg ? C.surf2 : dawn, color: hasProg ? C.text : '#1A1206' }}
                >
                  <Icon name={hasProg ? 'skip' : 'play'} size={20} /> {hasProg ? 'Recommencer' : 'Démarrer'}
                </button>
              </div>
            </div>
          );
        })
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
            const nm = namesOf(wt[wd]);
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
