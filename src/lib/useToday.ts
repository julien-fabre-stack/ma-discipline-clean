import { useEffect, useState } from 'react';
import { dateKey } from './utils';

/**
 * Date du jour (clé YYYY-MM-DD) RÉACTIVE.
 *
 * Problème corrigé : `dateKey()` calculé au render restait figé si la PWA
 * demeurait ouverte après minuit (iOS garde l'app en vie des jours entiers).
 * Conséquence : « Sport ✓ », les repas ou les cases d'habitudes étaient
 * écrits sur la VEILLE.
 *
 * Le hook se met à jour :
 *  - au retour au premier plan (visibilitychange / focus) — le cas iOS réel,
 *    car les timers JS sont gelés en arrière-plan ;
 *  - via un timer armé sur minuit (+2 s de marge) pour le cas « app ouverte
 *    à l'écran pendant le passage de minuit ».
 */
export function useToday(): string {
  const [today, setToday] = useState<string>(() => dateKey());

  useEffect(() => {
    // setToday avec le même string ne redéclenche pas de render (Object.is).
    const check = () => setToday((prev) => {
      const k = dateKey();
      return k === prev ? prev : k;
    });

    const onVis = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', check);

    let timer: ReturnType<typeof setTimeout> | null = null;
    const armMidnight = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2);
      timer = setTimeout(() => {
        check();
        armMidnight();
      }, next.getTime() - now.getTime());
    };
    armMidnight();

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', check);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return today;
}
