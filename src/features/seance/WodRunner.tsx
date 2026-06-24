import { useEffect, useRef, useState } from 'react';
import type { Wod } from '@/types';
import { fmt } from '@/lib/utils';
import { exerciseImageSrc } from '@/lib/exerciseImages';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, Ring } from '@/shared/ui';
import { ExerciseImg } from '@/shared/ui/ExerciseImg';
import { useBeep, useWakeLock } from './hooks';

export interface WodRunnerProps {
  wod: Wod;
  onClose: () => void;
  onDone: () => void;
}

type Phase = 'warm1' | 'warm2' | 'exercise' | 'transition';

export function WodRunner({ wod, onClose, onDone }: WodRunnerProps) {
  const { C, dawn, hexA, glowShadow } = useTheme();
  const [phase, setPhase] = useState<Phase>('warm1');
  const [idx, setIdx] = useState(0);
  const items = wod.items || [];
  const transitionDur = wod.transitionDur || 10;
  const cur = items[idx];
  const next = items[idx + 1] || null;
  const [sec, setSec] = useState(cur ? cur.dur || 20 : transitionDur);
  const [run, setRun] = useState(false);
  const { ensure, beep } = useBeep();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useWakeLock(true);
  useEffect(() => {
    ensure();
  }, []);

  // Initialise le compte à rebours à chaque changement de phase/exercice.
  useEffect(() => {
    if (phase === 'exercise' && cur) setSec(cur.dur || 20);
    else if (phase === 'transition') setSec(transitionDur);
    setRun(phase === 'exercise' || phase === 'transition');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  const goNextExercise = () => {
    const ni = idx + 1;
    if (ni >= items.length) {
      onDone();
      return;
    }
    setIdx(ni);
    setPhase('exercise');
  };

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    const isTimer = phase === 'exercise' || phase === 'transition';
    if (!isTimer || !run) return;
    tickRef.current = setInterval(() => {
      setSec((s) => {
        const nr = s - 1;
        if (nr <= 3 && nr >= 1) beep(820, 0.09);
        if (nr <= 0) {
          if (tickRef.current) clearInterval(tickRef.current);
          beep(440, 0.5);
          if (phase === 'exercise') {
            // Place de transition avant le prochain exercice, sauf si c'était le dernier.
            if (idx + 1 >= items.length) {
              setTimeout(() => onDone(), 100);
            } else {
              setTimeout(() => setPhase('transition'), 100);
            }
          } else {
            setTimeout(() => goNextExercise(), 100);
          }
          return 0;
        }
        return nr;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, run, idx]);

  if (!items.length) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center" style={{ background: C.night, color: C.text }}>
        <div className="mb-4" style={{ color: C.dim }}>
          Ce WOD n'a aucun exercice configuré.
        </div>
        <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold" style={{ background: dawn, color: '#1A1206' }}>
          Fermer
        </button>
      </div>
    );
  }

  const imgSrc = cur ? exerciseImageSrc(cur.name) : null;
  const nextImgSrc = next ? exerciseImageSrc(next.name) : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.night, color: C.text }}>
      <div className="flex items-center justify-between px-5 pb-2" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <button onClick={onClose} className="p-2 rounded-full" style={{ background: C.surf }}>
          <Icon name="x" size={20} color={C.dim} />
        </button>
        <div className="text-xs tracking-widest uppercase" style={{ color: C.gold }}>
          {wod.name}
        </div>
        {phase === 'exercise' || phase === 'transition' ? (
          <div className="text-xs tabular-nums px-2 py-1 rounded-full" style={{ color: C.dim, background: C.surf }}>
            {idx + 1}/{items.length}
          </div>
        ) : (
          <div style={{ width: 36 }} />
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {(phase === 'warm1' || phase === 'warm2') && (
          <>
            <div
              className="mb-3 px-3 py-1 rounded-full text-xs tracking-wider uppercase"
              style={{ background: C.surf, color: C.gold }}
            >
              Échauffement
            </div>
            {phase === 'warm1' && (
              <ExerciseImg
                name="Burpees"
                className="w-32 h-32 object-contain rounded-2xl mb-2"
                style={{ background: C.surf }}
              />
            )}
            <div className="text-3xl font-bold max-w-xs">
              {phase === 'warm1' ? 'Burpees' : 'Remises debout'}
            </div>
            <div
              className="mt-4 text-5xl font-extrabold"
              style={{ background: dawn, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              10
            </div>
            <button
              onClick={() => setPhase(phase === 'warm1' ? 'warm2' : 'exercise')}
              className="mt-10 w-full max-w-xs py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
              style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
            >
              <Icon name="check" size={22} /> Terminé
            </button>
          </>
        )}

        {phase === 'transition' && (
          <>
            <div className="relative flex items-center justify-center my-2">
              <Ring value={sec} max={transitionDur} id="gwt" />
              <div className="absolute flex flex-col items-center">
                <div className="text-6xl font-bold tabular-nums">{fmt(sec)}</div>
                <div className="text-sm mt-1" style={{ color: C.dim }}>
                  Mise en place
                </div>
              </div>
            </div>
            {next && (
              <div className="flex items-center gap-3 mt-4 px-4 py-3 rounded-2xl" style={{ background: hexA(C.surf, 0.9) }}>
                {nextImgSrc && (
                  <img
                    src={nextImgSrc}
                    alt=""
                    style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 10, background: C.surf2 }}
                  />
                )}
                <div className="text-left">
                  <div className="text-[10px] tracking-widest uppercase mb-0.5" style={{ color: C.gold }}>
                    Exercice suivant
                  </div>
                  <div className="text-sm font-bold">{next.name}</div>
                  <div className="text-xs" style={{ color: C.dim }}>
                    {next.dur} s
                  </div>
                </div>
              </div>
            )}
            <div className="mt-8 flex gap-3 w-full max-w-xs">
              <button
                onClick={() => setRun((r) => !r)}
                className="flex-1 py-3 rounded-2xl font-semibold flex items-center justify-center"
                style={{ background: C.surf2 }}
              >
                <Icon name={run ? 'pause' : 'play'} size={18} />
              </button>
              <button
                onClick={goNextExercise}
                className="flex-1 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
                style={{ background: C.surf2, color: C.gold }}
              >
                <Icon name="skip" size={18} /> Passer
              </button>
            </div>
          </>
        )}

        {phase === 'exercise' && cur && (
          <>
            {imgSrc && (
              <img
                src={imgSrc}
                alt=""
                style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 20, background: C.surf, marginBottom: 12 }}
              />
            )}
            <div className="text-2xl font-bold leading-tight max-w-xs mb-2">{cur.name}</div>
            <div className="relative flex items-center justify-center my-2">
              <Ring value={sec} max={cur.dur || 20} id="gwe" />
              <div className="absolute text-5xl font-bold tabular-nums">{fmt(sec)}</div>
            </div>
            <div className="mt-8 flex gap-3 w-full max-w-xs">
              <button
                onClick={() => setRun((r) => !r)}
                className="flex-1 py-3 rounded-2xl font-semibold flex items-center justify-center"
                style={{ background: C.surf2 }}
              >
                <Icon name={run ? 'pause' : 'play'} size={18} />
              </button>
              <button
                onClick={() => {
                  if (idx + 1 >= items.length) onDone();
                  else setPhase('transition');
                }}
                className="flex-1 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
                style={{ background: C.surf2, color: C.gold }}
              >
                <Icon name="skip" size={18} /> Passer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
