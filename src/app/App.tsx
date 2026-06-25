import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, firebaseReady } from '@/lib/firebase';
import { useAppData } from '@/lib/useAppData';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { dateKey } from '@/lib/utils';
import { expandSession, getWorkouts, workoutForDay } from '@/lib/workouts';
import { ThemeProvider, useTheme } from '@/shared/theme/ThemeProvider';
import { ConfirmProvider, Icon } from '@/shared/ui';
import { BackgroundDecor } from '@/shared/ui/BackgroundDecor';
import type { AppData } from '@/types';
import { Login } from '@/features/auth/Login';
import { SeanceTab } from '@/features/seance/SeanceTab';
import { Runner } from '@/features/seance/Runner';
import { WodRunner } from '@/features/seance/WodRunner';
import { NutritionTab } from '@/features/nutrition/NutritionTab';
import { SuiviTab } from '@/features/suivi/SuiviTab';
import { Settings } from '@/features/settings/Settings';
import { JournalTab } from '@/features/journal/JournalTab';
import { JournalSessionProvider } from '@/features/journal/JournalSession';
import type { Wod } from '@/types';

type TabKey = 'seance' | 'nutrition' | 'suivi' | 'journal';

const TABS: [TabKey, string, 'dumbbell' | 'apple' | 'calendar' | 'edit'][] = [
 ['seance', 'Séance', 'dumbbell'],
 ['nutrition', 'Nutrition', 'apple'],
 ['suivi', 'Suivi', 'calendar'],
 ['journal', 'Journal', 'edit'],
];

function AuthedApp({
 data,
 update,
 uid,
 online,
 pendingWrites,
 onLogout,
}: {
 data: AppData;
 update: (patch: Partial<AppData>) => void;
 uid: string;
 online: boolean;
 pendingWrites: boolean;
 onLogout: () => void;
}) {
 const { C, dawn, hexA, glowShadow, tabTransition } = useTheme();
 const tabClass = `tab-enter tab-${tabTransition}`;
 const [tab, setTab] = useState<TabKey>('seance');
 const [runner, setRunner] = useState<{ wid: string; idx: number } | null>(null);
 const [wod, setWod] = useState<Wod | null>(null);
 const [settingsOpen, setSettingsOpen] = useState(false);

 const today = dateKey();
 const todayWorkout = workoutForDay(data, today);
 const runnerWorkout = runner
   ? getWorkouts(data).find((w) => w.id === runner.wid) || todayWorkout
   : null;
 const steps = useMemo(
   () => expandSession(runnerWorkout ? runnerWorkout.items : []),
   [runnerWorkout]
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
   <JournalSessionProvider verifier={data.journalMeta?.verifier ?? null}>
   <div
     style={{
       background: 'transparent',
       color: C.text,
       minHeight: '100vh',
       fontFamily: 'var(--font-app)',
       paddingTop: 'env(safe-area-inset-top)',
       position: 'relative',
     }}
   >
     <BackgroundDecor seed={tab} />
     <div style={{ position: 'relative', zIndex: 1 }}>
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
       <div key="seance" className={tabClass}>
         <SeanceTab
           data={data}
           markSport={markSport}
           openRunner={(wid, idx) => setRunner({ wid, idx })}
           openWod={(w) => setWod(w)}
           openSettings={() => setSettingsOpen(true)}
         />
       </div>
     )}

     {tab === 'nutrition' && (
       <div key="nutrition" className={tabClass}>
         <NutritionTab
           data={data}
           update={update}
           today={today}
           openSettings={() => setSettingsOpen(true)}
         />
       </div>
     )}

     {tab === 'suivi' && (
       <div key="suivi" className={tabClass}>
         <SuiviTab
           data={data}
           update={update}
           today={today}
           openSettings={() => setSettingsOpen(true)}
         />
       </div>
     )}

     {tab === 'journal' && (
       <div key="journal" className={tabClass}>
         <JournalTab
           update={update}
           uid={uid}
           today={today}
           openSettings={() => setSettingsOpen(true)}
         />
       </div>
     )}

     {runner !== null && (
       <Runner
         steps={steps}
         startIdx={runner.idx}
         data={data}
         onProgress={(idx) => update({ progress: { wid: runner.wid, idx } })}
         onClose={() => setRunner(null)}
         onDone={() => {
           update({ progress: null });
           markSport();
           setRunner(null);
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
     </div>

     <div
       className="fixed bottom-0 left-0 right-0 flex"
       style={{
         zIndex: 30,
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

     <span style={{ display: 'none', background: dawn, boxShadow: glowShadow() }} />
   </div>
   </JournalSessionProvider>
 );
}

export function App() {
 const [user, setUser] = useState<User | null>(null);
 const [authReady, setAuthReady] = useState(false);
 const online = useOnlineStatus();

 const appData = useAppData(authReady && user ? user.uid : null);

 useEffect(() => {
   if (!firebaseReady || !auth) {
     setAuthReady(true);
     return;
   }
   const timer = setTimeout(() => setAuthReady(true), 3000);
   const unsub = onAuthStateChanged(auth, (u) => {
     clearTimeout(timer);
     setUser(u);
     setAuthReady(true);
   });
   return () => { clearTimeout(timer); unsub(); };
 }, []);

 const themeId = appData.data?.theme || 'aube';
 const accent = appData.data?.accent || null;
 const appearance = {
   customColors: appData.data?.customColors ?? null,
   fontFamily: appData.data?.fontFamily,
   fontScale: appData.data?.fontScale,
   textColor: appData.data?.textColor ?? null,
   dimColor: appData.data?.dimColor ?? null,
   tabTransition: appData.data?.tabTransition,
   animSpeed: appData.data?.animSpeed,
   buttonAnim: appData.data?.buttonAnim,
 };

 return (
   <ThemeProvider themeId={themeId} accent={accent} appearance={appearance}>
     <ConfirmProvider>
       <AppGate
         authReady={authReady}
         user={user}
         data={appData.data}
         update={appData.update}
         online={online}
         pendingWrites={appData.pendingWrites}
         onLogout={() => auth && signOut(auth)}
       />
     </ConfirmProvider>
   </ThemeProvider>
 );
}

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

 useEffect(() => {
  document.body.style.background = 'transparent';
}, []);


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
       {online ? 'Synchronisation…' : 'Hors ligne — données indisponibles'}
     </div>
   );
 }

 return (
   <AuthedApp
     data={data}
     update={update}
     uid={user.uid}
     online={online}
     pendingWrites={pendingWrites}
     onLogout={onLogout}
   />
 );
}

