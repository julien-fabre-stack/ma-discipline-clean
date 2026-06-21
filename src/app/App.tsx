import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, firebaseReady } from '@/lib/firebase';
import { useAppData } from '@/lib/useAppData';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { dateKey } from '@/lib/utils';
import { expandSession, workoutForDay } from '@/lib/workouts';
import { ThemeProvider, useTheme } from '@/shared/theme/ThemeProvider';
import { ConfirmProvider, Icon } from '@/shared/ui';
import type { AppData } from '@/types';
import { Login } from '@/features/auth/Login';
import { SeanceTab } from '@/features/seance/SeanceTab';
import { Runner } from '@/features/seance/Runner';
import { WodRunner } from '@/features/seance/WodRunner';
import { NutritionTab } from '@/features/nutrition/NutritionTab';
import { SuiviTab } from '@/features/suivi/SuiviTab';
import { Settings } from '@/features/settings/Settings';
import type { Wod } from '@/types';

type TabKey = 'seance' | 'nutrition' | 'suivi';

const TABS: [TabKey, string, 'dumbbell' | 'apple' | 'calendar'][] = [
  ['seance', 'Séance', 'dumbbell'],
  ['nutrition', 'Nutrition', 'apple'],
  ['suivi', 'Suivi', 'calendar'],
];

/**
 * Contenu principal de l'app authentifiée. Reçoit `data` garanti non-null,
 * ce qui élimine les vérifications de nullité dans tout l'arbre enfant.
 */
function AuthedApp({
  data,
  update,
  online,
  pendingWrites,
  onLogout,
}: {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
  online: boolean;
  pendingWrites: boolean;
  onLogout: () => void;
}) {
  const { C, dawn, hexA, glowShadow } = useTheme();
  const [tab, setTab] = useState<TabKey>('seance');
  const [runnerIdx, setRunnerIdx] = useState<number | null>(null);
  const [wod, setWod] = useState<Wod | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const today = dateKey();
  const todayWorkout = workoutForDay(data, today);
  const steps = useMemo(
    () => expandSession(todayWorkout ? todayWorkout.items : []),
    [todayWorkout]
  );

  const markSport = () => {
    const day = data.days[today] || {};
    const habits = {
      ...(day.habits && !Array.isArray(day.habits) ? day.habits : {}),
      sport: true,
    };
    const days = { ...data.days };
    days[today] = { ...day, habits };
    update({ days });
  };

  const navAlpha = data.navAlpha == null ? 0.92 : data.navAlpha;

  return (
    <div
      style={{
        background: C.night,
        color: C.text,
        minHeight: '100vh',
        fontFamily: 'system-ui,-apple-system,sans-serif',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {!online && (
        <div
          className="fixed z-40 px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
          style={{
            left: '50%',
            top: 'calc(env(safe-area-inset-top) + 10px)',
            transform: 'translateX(-50%)',
            background: hexA(C.surf, 0.6),
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${hexA(C.gold, 0.4)}`,
            color: C.gold,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: C.gold }} />
          {pendingWrites ? 'Hors ligne · sync en attente' : 'Hors ligne'}
        </div>
      )}

      {tab === 'seance' && (
        <div key="seance" className="tab-enter">
          <SeanceTab
            data={data}
            markSport={markSport}
            openRunner={(idx) => setRunnerIdx(idx)}
            openWod={(w) => setWod(w)}
            openSettings={() => setSettingsOpen(true)}
          />
        </div>
      )}
      {tab === 'nutrition' && (
        <div key="nutrition" className="tab-enter">
          <NutritionTab
            data={data}
            update={update}
            today={today}
            openSettings={() => setSettingsOpen(true)}
          />
        </div>
      )}
      {tab === 'suivi' && (
        <div key="suivi" className="tab-enter">
          <SuiviTab
            data={data}
            update={update}
            today={today}
            openSettings={() => setSettingsOpen(true)}
          />
        </div>
      )}

      {runnerIdx !== null && (
        <Runner
          steps={steps}
          startIdx={runnerIdx}
          data={data}
          onProgress={(idx) => update({ progress: { idx } })}
          onClose={() => setRunnerIdx(null)}
          onDone={() => {
            update({ progress: null });
            markSport();
            setRunnerIdx(null);
          }}
        />
      )}
      {wod && (
        <WodRunner
          wod={wod}
          onClose={() => setWod(null)}
          onDone={() => {
            markSport();
            setWod(null);
          }}
        />
      )}
      {settingsOpen && (
        <Settings
          data={data}
          update={update}
          onClose={() => setSettingsOpen(false)}
          onLogout={() => {
            onLogout();
            setSettingsOpen(false);
          }}
        />
      )}

      <div
        className="fixed bottom-0 left-0 right-0 flex"
        style={{
          background: hexA(C.night, navAlpha),
          backdropFilter: `blur(${navAlpha < 1 ? 20 : 0}px)`,
          WebkitBackdropFilter: `blur(${navAlpha < 1 ? 20 : 0}px)`,
          borderTop: `1px solid ${navAlpha < 1 ? hexA('#FFFFFF', 0.08) : C.line}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {TABS.map(([k, label, icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="flex-1 flex flex-col items-center gap-1 py-3"
            style={{ color: tab === k ? C.ember : C.dim }}
          >
            <Icon name={icon} size={22} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </div>
      {/* Ancre le dawn/glowShadow pour les exports — évite un warning "unused" */}
      <span style={{ display: 'none', background: dawn, boxShadow: glowShadow() }} />
    </div>
  );
}

/** Gère l'état d'authentification et choisit l'écran à afficher. */
export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const online = useOnlineStatus();
  const { data, update, pendingWrites } = useAppData(user?.uid ?? null);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setAuthReady(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  const themeId = data?.theme || 'aube';
  const accent = data?.accent || null;

  return (
    <ThemeProvider themeId={themeId} accent={accent}>
      <ConfirmProvider>
        <AppGate
          authReady={authReady}
          user={user}
          data={data}
          update={update}
          online={online}
          pendingWrites={pendingWrites}
          onLogout={() => auth && signOut(auth)}
        />
      </ConfirmProvider>
    </ThemeProvider>
  );
}

/** Aiguillage entre les états : chargement / non configuré / login / sync / app. */
function AppGate({
  authReady,
  user,
  data,
  update,
  online,
  pendingWrites,
  onLogout,
}: {
  authReady: boolean;
  user: User | null;
  data: AppData | null;
  update: (patch: Partial<AppData>) => void;
  online: boolean;
  pendingWrites: boolean;
  onLogout: () => void;
}) {
  const { C } = useTheme();

  // Applique la couleur de fond au body (au lieu de muter document.body un peu partout).
  useEffect(() => {
    document.body.style.background = C.night;
  }, [C.night]);

  if (!authReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.night, color: C.dim }}
      >
        Chargement…
      </div>
    );
  }
  if (!firebaseReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-center px-8"
        style={{ background: C.night, color: C.ember }}
      >
        Firebase non configuré.
      </div>
    );
  }
  if (!user) return <Login />;
  if (!data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: C.night, color: C.dim }}
      >
        Synchronisation…
      </div>
    );
  }
  return (
    <AuthedApp
      data={data}
      update={update}
      online={online}
      pendingWrites={pendingWrites}
      onLogout={onLogout}
    />
  );
}
