import { useEffect, useRef } from 'react';

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
