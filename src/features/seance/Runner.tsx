import { useEffect, useRef, useState } from 'react';
import type { AppData, RunnerStep } from '@/types';
import { fmt } from '@/lib/utils';
import { exerciseImageSrc } from '@/lib/exerciseImages';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, Ring } from '@/shared/ui';
import { useBeep, useWakeLock } from './hooks';

export interface RunnerProps {
  steps: RunnerStep[];
  startIdx?: number;
  data: AppData;
  onClose: () => void;
  onProgress?: (idx: number) => void;
  onDone?: () => void;
}

function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  const cur = img.src;
  if (cur.endsWith('.png')) img.src = cur.replace('.png', '.jpg');
  else if (cur.endsWith('.jpg')) img.src = cur.replace('.jpg', '.png');
  else {
    img.style.display = 'none';
    return;
  }
  img.onerror = () => {
    img.style.display = 'none';
  };
}

export function Runner({ steps, startIdx = 0, data, onClose, onProgress, onDone }: RunnerProps) {
  const { C, dawn, hexA, glowShadow } = useTheme();
  const [idx, setIdx] = useState(startIdx);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(() => new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const { ensure, beep } = useBeep();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = steps.length;
  const step = steps[idx];
  const nextStep = steps[idx + 1] || null;
  const textColor = data.runnerTextColor || '#FFFFFF';
  const finishMsg = data.runnerFinishMsg || '🏆 Félicitations ! Séance terminée !';

  useWakeLock(true);
  useEffect(() => {
    ensure();
  }, []);
  useEffect(() => {
    if (onProgress) onProgress(idx);
  }, [idx]);
  useEffect(() => {
    if (!step) return;
    if (step.kind === 'rest' || step.kind === 'timed') setRemaining(step.dur);
    else setRemaining(0);
    setRunning(true);
  }, [idx]);

  const advanceIdx = () =>
    setIdx((i) => {
      const ni = Math.min(i + 1, total);
      if (ni >= total) {
        setFinished(true);
        setEndTime(new Date());
      }
      return ni;
    });

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    const isTimer = step && (step.kind === 'rest' || step.kind === 'timed');
    if (!isTimer || !running) return;
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        const nr = r - 1;
        if (nr <= 5 && nr >= 1) beep(820, 0.18);
        if (nr <= 0) {
          if (tickRef.current) clearInterval(tickRef.current);
          beep(440, 0.7);
          setTimeout(() => advanceIdx(), 100);
          return 0;
        }
        return nr;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [idx, running]);

  const next = () => advanceIdx();
  const prev = () => setIdx((i) => Math.max(i - 1, 0));

  useEffect(() => {
    if (finished && endTime) onDone?.();
  }, [finished]);

  const imgSrc = step ? exerciseImageSrc(step.name) : null;
  const nextImgSrc = nextStep ? exerciseImageSrc(nextStep.name) : null;
  const fmtTime = (d: Date | null) =>
    d ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  const fmtDur = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return h > 0
      ? `${h}h${String(m % 60).padStart(2, '0')}min`
      : `${m}min${String(s % 60).padStart(2, '0')}s`;
  };

  if (finished) {
    const dur = endTime && startTime ? fmtDur(endTime.getTime() - startTime.getTime()) : '';
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
        style={{
          background: `linear-gradient(135deg, ${C.night} 0%, ${C.surf2} 100%)`,
          color: C.text,
        }}
      >
        <div className="text-6xl mb-6">🏆</div>
        <div
          className="text-2xl font-extrabold mb-3"
          style={{ background: dawn, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {finishMsg}
        </div>
        {endTime && (
          <div className="text-sm mb-1" style={{ color: C.dim }}>
            Départ {fmtTime(startTime)} · Fin {fmtTime(endTime)}
          </div>
        )}
        {dur && (
          <div className="text-lg font-bold mb-8" style={{ color: C.gold }}>
            Durée totale : {dur}
          </div>
        )}
        <button
          onClick={() => onDone?.()}
          className="w-full max-w-xs py-4 rounded-2xl font-bold text-lg"
          style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
        >
          Terminer
        </button>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.night, color: C.text }}>
      {step.kind !== 'rest' && imgSrc && (
        <div className="absolute inset-0 z-0">
          <img
            src={imgSrc}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.25 }}
            onError={onImgError}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${hexA(C.night, 0.5)} 0%, ${hexA(
                C.night,
                0.2
              )} 40%, ${hexA(C.night, 0.7)} 80%, ${C.night} 100%)`,
            }}
          />
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between px-5 pb-2" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>

        <button onClick={onClose} className="p-2 rounded-full" style={{ background: hexA(C.surf, 0.8) }}>
          <Icon name="x" size={20} color={C.dim} />
        </button>
        <div
          className="text-xs tracking-widest uppercase text-center flex-1 px-2 truncate"
          style={{ color: hexA(textColor, 0.7) }}
        >
          {step.block}
        </div>
        <div
          className="text-xs tabular-nums px-2 py-1 rounded-full"
          style={{ color: textColor, background: hexA(C.night, 0.5) }}
        >
          {idx + 1}/{total}
        </div>
      </div>

      <div
        className="relative z-10 mx-5 h-1 rounded-full overflow-hidden"
        style={{ background: hexA(C.surf2, 0.6) }}
      >
        <div
          className="h-full"
          style={{
            width: `${(idx / total) * 100}%`,
            background: dawn,
            transition: 'width 320ms cubic-bezier(.22,1,.36,1)',
          }}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div key={idx} className="fade-enter flex flex-col items-center w-full">
          {step.tag && (
            <div
              className="mb-3 px-3 py-1 rounded-full text-xs tracking-wider uppercase"
              style={{ background: hexA(C.surf, 0.7), color: C.gold }}
            >
              Série {step.tag}
            </div>
          )}
          {step.kind !== 'rest' && !imgSrc && (
            <div className="w-36 h-36 rounded-3xl mb-4" style={{ background: C.surf2 }} />
          )}

          {step.kind === 'rest' ? (
            <>
              <div className="relative flex items-center justify-center my-2">
                <Ring value={remaining} max={step.dur} />
                <div className="absolute flex flex-col items-center">
                  <div className="text-6xl font-bold tabular-nums" style={{ color: textColor }}>
                    {fmt(remaining)}
                  </div>
                  <div className="text-sm mt-1" style={{ color: hexA(textColor, 0.6) }}>
                    Récupération
                  </div>
                </div>
              </div>
              {nextStep && nextStep.kind !== 'rest' && (
                <div
                  className="flex items-center gap-3 mt-4 px-4 py-3 rounded-2xl"
                  style={{ background: hexA(C.surf, 0.7) }}
                >
                  {nextImgSrc && (
                    <img
                      src={nextImgSrc}
                      alt=""
                      style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 10, background: C.surf2 }}
                      onError={onImgError}
                    />
                  )}
                  <div className="text-left">
                    <div className="text-[10px] tracking-widest uppercase mb-0.5" style={{ color: C.gold }}>
                      Exercice suivant
                    </div>
                    <div className="text-sm font-bold" style={{ color: textColor }}>
                      {nextStep.name}
                    </div>
                    {nextStep.reps && (
                      <div className="text-xs" style={{ color: hexA(textColor, 0.6) }}>
                        × {nextStep.reps}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : step.kind === 'timed' ? (
            <div className="relative flex items-center justify-center my-2">
              <Ring value={remaining} max={step.dur} />
              <div className="absolute flex flex-col items-center">
                <div className="text-6xl font-bold tabular-nums" style={{ color: textColor }}>
                  {fmt(remaining)}
                </div>
                <div className="text-sm mt-1 max-w-[10rem]" style={{ color: hexA(textColor, 0.6) }}>
                  {step.name}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                className="text-3xl font-bold leading-tight max-w-xs"
                style={{ color: textColor, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
              >
                {step.name}
              </div>
              <div
                className="mt-4 text-6xl font-extrabold"
                style={{
                  background: dawn,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                }}
              >
                {step.reps}
              </div>
            </>
          )}

          {step.kind === 'work' && (
            <button
              onClick={next}
              className="mt-10 w-full max-w-xs py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
              style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
            >
              <Icon name="check" size={22} /> Terminé
            </button>
          )}
          {(step.kind === 'rest' || step.kind === 'timed') && (
            <div className="mt-8 flex gap-3 w-full max-w-xs">
              <button
                onClick={() => setRunning((r) => !r)}
                className="flex-1 py-3 rounded-2xl font-semibold flex items-center justify-center"
                style={{ background: hexA(C.surf, 0.8), color: textColor }}
              >
                <Icon name={running ? 'pause' : 'play'} size={18} />
              </button>
              <button
                onClick={next}
                className="flex-1 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
                style={{ background: hexA(C.surf, 0.8), color: C.gold }}
              >
                <Icon name="skip" size={18} /> Passer
              </button>
            </div>
          )}
        </div>
        <button onClick={prev} className="mt-6 text-xs" style={{ color: hexA(textColor, 0.4) }}>
          ← étape précédente
        </button>
      </div>
    </div>
  );
}
