import { useEffect, useRef, useState } from 'react';
import type { Wod } from '@/types';
import { fmt } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, Ring } from '@/shared/ui';
import { ExerciseImg } from '@/shared/ui/ExerciseImg';
import { useBeep, useWakeLock } from './hooks';

export interface WodRunnerProps {
  wod: Wod;
  onClose: () => void;
  onDone: () => void;
}

type Phase = 'warm1' | 'warm2' | 'amrap';

export function WodRunner({ wod, onClose, onDone }: WodRunnerProps) {
  const { C, dawn, glowShadow } = useTheme();
  const [phase, setPhase] = useState<Phase>('warm1');
  const [sec, setSec] = useState(wod.dur || 900);
  const [run, setRun] = useState(false);
  const { ensure, beep } = useBeep();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useWakeLock(true);
  useEffect(() => {
    ensure();
  }, []);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (phase !== 'amrap' || !run) return;
    tickRef.current = setInterval(() => {
      setSec((s) => {
        const nr = s - 1;
        if (nr <= 5 && nr >= 1) beep(820, 0.09);
        if (nr <= 0) {
          if (tickRef.current) clearInterval(tickRef.current);
          beep(440, 0.5);
          setRun(false);
          return 0;
        }
        return nr;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase, run]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.night, color: C.text }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <button onClick={onClose} className="p-2 rounded-full" style={{ background: C.surf }}>
          <Icon name="x" size={20} color={C.dim} />
        </button>
        <div className="text-xs tracking-widest uppercase" style={{ color: C.gold }}>
          {wod.name}
        </div>
        <div style={{ width: 36 }} />
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
              onClick={() => setPhase(phase === 'warm1' ? 'warm2' : 'amrap')}
              className="mt-10 w-full max-w-xs py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
              style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
            >
              <Icon name="check" size={22} /> Terminé
            </button>
          </>
        )}

        {phase === 'amrap' && (
          <>
            <div className="flex items-center gap-2 mb-1" style={{ color: C.gold }}>
              <Icon name="flame" size={18} />
              <span className="tracking-widest uppercase text-xs">
                AMRAP {Math.round((wod.dur || 900) / 60)} min · max de tours
              </span>
            </div>
            <div className="relative flex items-center justify-center my-2">
              <Ring value={sec} max={wod.dur || 900} id="gw" />
              <div className="absolute text-5xl font-bold tabular-nums">{fmt(sec)}</div>
            </div>
            <div className="w-full max-w-xs rounded-2xl p-4 mb-5 text-left" style={{ background: C.surf }}>
              {(wod.items || []).map((m, i) => (
                <div
                  key={i}
                  className="flex justify-between py-1.5"
                  style={{ borderBottom: i < wod.items.length - 1 ? `1px solid ${C.line}` : 'none' }}
                >
                  <span>{m.name}</span>
                  <span className="font-bold" style={{ color: C.gold }}>
                    ×{m.reps}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setRun((r) => !r)}
              className="w-full max-w-xs py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
              style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
            >
              <Icon name={run ? 'pause' : 'play'} size={18} /> {run ? 'Pause' : 'Lancer le chrono'}
            </button>
            <button
              onClick={onDone}
              className="mt-4 w-full max-w-xs py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
              style={{ background: C.ok, color: '#06210F' }}
            >
              <Icon name="trophy" size={20} /> WOD terminé
            </button>
          </>
        )}
      </div>
    </div>
  );
}
