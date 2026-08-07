import { useState } from 'react';
import type { AppData } from '@/types';
import { parseKey } from '@/lib/utils';
import { cycleLabelFor, getWorkouts, workoutsForDay } from '@/lib/workouts';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Collapsible, Icon } from '@/shared/ui';

export interface SeanceTabProps {
  data: AppData;
  /**
   * Date du jour RÉACTIVE, fournie par useToday() dans App.tsx.
   * AVANT : dateKey() était recalculé au render — si la PWA restait ouverte
   * après minuit (cas courant sur iOS), la séance affichée, le bouton
   * « Sport fait » et data.days[today] pointaient encore sur la VEILLE.
   */
  today: string;
  openRunner: (wid: string, idx: number) => void;
  openSettings: () => void;
  markSport: () => void;
}

const WEEKDAYS: [string, number][] = [
  ['Lundi', 1], ['Mardi', 2], ['Mercredi', 3], ['Jeudi', 4],
  ['Vendredi', 5], ['Samedi', 6], ['Dimanche', 0],
];

export function SeanceTab({ data, today, openRunner, openSettings, markSport }: SeanceTabProps) {
  const { C, dawn, hexA, cardShadow, glowShadow } = useTheme();
  const todayWorkouts = workoutsForDay(data, today);
  const workouts = getWorkouts(data);
  const wt = data.weekTemplate || {};
  const progWid = data.progress && data.progress.idx > 0 ? data.progress.wid : null;
  const [openWeek, setOpenWeek] = useState(false);
  const todayWd = parseKey(today).getDay();
  const namesOf = (v: string | string[] | undefined) => {
    const ids = Array.isArray(v) ? v : v ? [v] : [];
    const ns = ids.map((id) => workouts.find((x) => x.id === id)?.name).filter((n): n is string => Boolean(n));
    return ns.length ? ns.join(' + ') : null;
  };
  const day = data.days[today] || {};
  const sportDone = Boolean(day.habits && !Array.isArray(day.habits) && day.habits.sport);
  const headTitle = todayWorkouts.length ? todayWorkouts.map((w) => w.name).join(' + ') : 'Repos';

  const glassCard = {
    background: hexA(C.surf, 0.45),
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${C.line}`,
    boxShadow: cardShadow(),
  } as const;

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 64px)' }}
    >
      {/* Header fixe dans le flux — même pattern que SuiviTab */}
      <div
        className="flex-shrink-0 px-5 pb-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: C.dim }}>
              {parseKey(today).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{headTitle}</h1>
            <div className="text-sm mt-1" style={{ color: C.gold }}>
              {cycleLabelFor(data, today)}
            </div>
          </div>
          <button onClick={openSettings} className="p-2 rounded-full" style={{ background: C.surf }}>
            <Icon name="gear" size={20} color={C.dim} />
          </button>
        </div>
      </div>

      {/* Zone scrollable */}
      <div
        className="flex-1 overflow-y-auto px-5 pb-6"
        style={{ borderTop: `1px solid ${C.line}` }}
      >
        <div className="pt-4" />

        {todayWorkouts.length ? (
          todayWorkouts.map((w) => {
            const hasProg = progWid === w.id;
            return (
              <div key={w.id} className="rounded-3xl p-5 mb-4" style={glassCard}>
                <div className="font-bold mb-1">{w.name}</div>
                <div className="text-sm mb-4" style={{ color: C.dim }}>
                  {(w.items || []).length} exercices · minuteurs auto.{hasProg && ' Séance en cours.'}
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
          <div className="rounded-3xl p-5 mb-4 text-center" style={glassCard}>
            <div className="text-sm" style={{ color: C.dim }}>Pas de séance prévue aujourd'hui. Profite du repos.</div>
          </div>
        )}

        <button
          onClick={markSport}
          className="w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 mb-6"
          style={{ background: hexA(C.surf2, 0.7), color: sportDone ? C.ok : C.text }}
        >
          <Icon name="check" size={18} /> {sportDone ? '« Sport » fait ✓' : "Marquer « Sport » fait aujourd'hui"}
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
                    background: isToday ? hexA(C.surf2, 0.7) : i % 2 ? hexA(C.surf, 0.5) : hexA(C.night, 0.3),
                    borderLeft: isToday ? `3px solid ${C.gold}` : '3px solid transparent',
                  }}
                >
                  <span style={{ fontWeight: isToday ? 700 : 400, color: isToday ? C.gold : C.text }}>{lbl}</span>
                  <span style={{ color: nm ? C.text : C.dim }}>{nm || 'Repos'}</span>
                </div>
              );
            })}
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
