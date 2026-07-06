import { useEffect, useRef, useState } from 'react';

/** Bips sonores via Web Audio API (décompte de fin de timer). */
export function useBeep() {
  const ref = useRef<AudioContext | null>(null);

  const ensure = () => {
    if (!ref.current) {
      try {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ref.current = new Ctor();
      } catch {
        /* audio indisponible */
      }
    }
    if (ref.current && ref.current.state === 'suspended') {
      void ref.current.resume();
    }
  };

  const beep = (freq = 880, dur = 0.15) => {
    try {
      const ac = ref.current;
      if (!ac) return;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ac.destination);
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.5, ac.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.start();
      o.stop(ac.currentTime + dur);
    } catch {
      /* ignore */
    }
  };

  return { ensure, beep };
}

/** Maintient l'écran allumé pendant une séance active. */
export function useWakeLock(active: boolean) {
  const ref = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    const req = async () => {
      try {
        if (active && 'wakeLock' in navigator) {
          ref.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        /* refusé ou indisponible */
      }
    };
    if (active) void req();
    const onVis = () => {
      if (active && document.visibilityState === 'visible') void req();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      try {
        void ref.current?.release();
      } catch {
        /* ignore */
      }
      ref.current = null;
    };
  }, [active]);
}

export interface CountdownOptions {
  /** Durée du compte à rebours en secondes (pour l'étape courante). */
  duration: number;
  /** True si l'étape courante est chronométrée. */
  active: boolean;
  /** False = pause (le temps restant est gelé). */
  running: boolean;
  /** Changement de valeur → réinitialisation à `duration`. */
  resetKey: unknown;
  /** Appelé à chaque décrément d'UNE seconde (pour les bips 5…1). */
  onSecond?: (s: number) => void;
  /** Appelé UNE fois quand le compte atteint 0. */
  onEnd?: () => void;
}

/**
 * Compte à rebours ANCRÉ SUR L'HORLOGE RÉELLE (deadline), et non plus sur un
 * setInterval qui décrémente de 1.
 *
 * Problème corrigé : iOS gèle les timers JS dès que la PWA passe en
 * arrière-plan (changement d'app, écran verrouillé si le wake lock est
 * refusé). Avec l'ancien décrément, un repos de 90 s « oubliait » tout le
 * temps passé en arrière-plan et repartait là où il s'était figé.
 * Ici, le temps restant est recalculé à chaque tick depuis
 * `deadline − Date.now()` : au retour au premier plan, l'affichage saute
 * directement à la bonne valeur, et si l'échéance est passée, onEnd se
 * déclenche immédiatement. Les bips ne sont émis que sur les décréments
 * d'une seconde (pas de rafale au retour d'arrière-plan).
 */
export function useCountdown(opts: CountdownOptions): number {
  const { duration, active, running, resetKey } = opts;
  const [remaining, setRemaining] = useState(duration);
  const deadlineRef = useRef<number | null>(null);
  const remainingRef = useRef(duration);
  const endedRef = useRef(false);
  const cbRef = useRef({ onSecond: opts.onSecond, onEnd: opts.onEnd });
  cbRef.current = { onSecond: opts.onSecond, onEnd: opts.onEnd };

  // Réinitialisation à chaque nouvelle étape.
  useEffect(() => {
    remainingRef.current = duration;
    endedRef.current = false;
    setRemaining(duration);
    deadlineRef.current = active && running ? Date.now() + duration * 1000 : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, active]);

  // Pause / reprise : on gèle le restant, puis on ré-ancre l'échéance.
  useEffect(() => {
    if (!active || endedRef.current) return;
    if (running) {
      deadlineRef.current = Date.now() + remainingRef.current * 1000;
    } else {
      deadlineRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (!active || !running) return;

    const tick = () => {
      const dl = deadlineRef.current;
      if (dl == null || endedRef.current) return;
      const r = Math.max(0, Math.ceil((dl - Date.now()) / 1000));
      const prev = remainingRef.current;
      if (r !== prev) {
        remainingRef.current = r;
        setRemaining(r);
        // Bip uniquement sur un décrément régulier d'une seconde : au retour
        // d'arrière-plan (saut de plusieurs secondes), pas de rafale sonore.
        if (r === prev - 1 && r >= 1) cbRef.current.onSecond?.(r);
        if (r <= 0) {
          endedRef.current = true;
          deadlineRef.current = null;
          cbRef.current.onEnd?.();
        }
      }
    };

    const interval = setInterval(tick, 250);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, running, resetKey]);

  return remaining;
}
