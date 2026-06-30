import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, firebaseReady } from '@/lib/firebase';
import { useAppData, type AppDataPatch } from '@/lib/useAppData';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { dateKey } from '@/lib/utils';
import { expandSession, getWorkouts, workoutForDay } from '@/lib/workouts';
import { ThemeProvider, useTheme } from '@/shared/theme/ThemeProvider';
import { ConfirmProvider, Icon } from '@/shared/ui';
import { BackgroundDecor } from '@/shared/ui/BackgroundDecor';
import type { AppData } from '@/types';
import { Login } from '@/features/auth/Login';
// Séance et Suivi sont chargés directement (Séance = onglet par défaut au démarrage).
import { SeanceTab } from '@/features/seance/SeanceTab';
import { SuiviTab } from '@/features/suivi/SuiviTab';
import { JournalSessionProvider } from '@/features/journal/JournalSession';
import type { Wod } from '@/types';

// Onglets et écrans lourds chargés à la demande (code-splitting).
// Chaque import() devient un chunk séparé, téléchargé seulement à l'ouverture.
const NutritionTab = lazy(() =>
  import('@/features/nutrition/NutritionTab').then((m) => ({ default: m.NutritionTab }))
);
const JournalTab = lazy(() =>
  import('@/features/journal/JournalTab').then((m) => ({ default: m.JournalTab }))
);
const Settings = lazy(() =>
  import('@/features/settings/Settings').then((m) => ({ default: m.Settings }))
);
const Runner = lazy(() =>
  import('@/features/seance/Runner').then((m) => ({ default: m.Runner }))
);
const WodRunner = lazy(() =>
  import('@/features/seance/WodRunner').then((m) => ({ default: m.WodRunner }))
);

type TabKey = 'seance' | 'nutrition' | 'suivi' | 'journal';

const TABS: [TabKey, string, 'dumbbell' | 'apple' | 'calendar' | 'edit'][] = [
 ['seance', 'Séance', 'dumbbell'],
 ['nutrition', 'Nutrition', 'apple'],
 ['suivi', 'Suivi', 'calendar'],
 ['journal', 'Journal', 'edit'],
];

// Fallback affiché pendant le chargement d'un chunk lazy (très bref).
// Transparent pour ne pas faire flasher le fond ; le wallpaper reste visible.
function TabFallback() {
  return <div style={{ minHeight: '50vh' }} />;
}

function AuthedApp({
 data,
 update,
 uid,
 online,
 pendingWrites,
 archiveError,
 localCacheError,
 onLogout,
}: {
 data: AppData;
 update: (patch: AppDataPatch) => void;
 uid: string;
 online: boolean;
 pendingWrites: boolean;
 archiveError: string | null;
 localCacheError: boolean;
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
   update((prev) => {
     const day = prev.days[today] || {};
     const habits = {
       ...(day.habits && !Array.isArray(day.habits) ? day.habits : {}),
       sport: true,
     };
     const days = { ...prev.days };
     days[today] = { ...day, habits };
     return { days };
   });
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

     {archiveError && (
       <div
         className="fixed z-40 px-3 py-2 rounded-xl text-[11px] font-semibold"
         style={{
           left: '50%',
           top: 'calc(env(safe-area-inset-top) + 48px)',
           transform: 'translateX(-50%)',
           background: hexA(C.surf, 0.92),
           backdropFilter: 'blur(16px)',
           WebkitBackdropFilter: 'blur(16px)',
           border: `1px solid ${hexA(C.ember, 0.5)}`,
           color: C.ember,
           whiteSpace: 'nowrap',
         }}
       >
         ⚠️ Archivage échoué ({archiveError}) · Données Firestore intactes
       </div>
     )}

     {localCacheError && (
       <div
         className="fixed z-40 px-3 py-2 rounded-xl text-[11px] font-semibold"
         style={{
           left: '50%',
           top: archiveError
             ? 'calc(env(safe-area-inset-top) + 86px)'
             : 'calc(env(safe-area-inset-top) + 48px)',
           transform: 'translateX(-50%)',
           background: hexA(C.surf, 0.92),
           backdropFilter: 'blur(16px)',
           WebkitBackdropFilter: 'blur(16px)',
           border: `1px solid ${hexA(C.gold, 0.4)}`,
           color: C.gold,
           whiteSpace: 'nowrap',
         }}
       >
         ⚠️ Cache local plein · Mode hors-ligne limité
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
         <Suspense fallback={<TabFallback />}>
           <NutritionTab
             data={data}
             update={update}
             today={today}
             openSettings={() => setSettingsOpen(true)}
           />
         </Suspense>
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
         <Suspense fallback={<TabFallback />}>
           <JournalTab
             update={update}
             uid={uid}
             today={today}
             openSettings={() => setSettingsOpen(true)}
           />
         </Suspense>
       </div>
     )}

     {runner !== null && (
       <Suspense fallback={null}>
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
       </Suspense>
     )}

     {wod && (
       <Suspense fallback={null}>
         <WodRunner
           wod={wod}
           onClose={() => setWod(null)}
           onDone={() => {
             markSport();
             setWod(null);
           }}
         />
       </Suspense>
     )}

     {settingsOpen && (
       <Suspense fallback={null}>
         <Settings
           data={data}
           update={update}
           online={online}
           pendingWrites={pendingWrites}
           onClose={() => setSettingsOpen(false)}
           onLogout={() => {
             onLogout();
             setSettingsOpen(false);
           }}
         />
       </Suspense>
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

 // Dernier uid connu, mémorisé pour permettre un démarrage HORS-LIGNE même si
 // Firebase Auth n'a pas encore (ou pas pu) restaurer la session en mode avion.
 const cachedUidRef = useRef<string | null>(
   typeof localStorage !== 'undefined' ? localStorage.getItem('last_uid') : null
 );

 useEffect(() => {
   if (!firebaseReady || !auth) {
     setAuthReady(true);
     return;
   }
   const timer = setTimeout(() => setAuthReady(true), 3000);
   const unsub = onAuthStateChanged(auth, (u) => {
     clearTimeout(timer);
     setUser(u);
     if (u) {
       cachedUidRef.current = u.uid;
       try { localStorage.setItem('last_uid', u.uid); } catch { /* quota */ }
     }
     setAuthReady(true);
   });
   return () => { clearTimeout(timer); unsub(); };
 }, []);

 // uid effectif : l'utilisateur Firebase connecté, ou — hors-ligne seulement —
 // le dernier uid connu, pour que l'app démarre en mode avion sans rester
 // bloquée sur l'écran de connexion.
 const effectiveUid = user?.uid ?? (!online ? cachedUidRef.current : null);
 const appData = useAppData(authReady ? effectiveUid : null);

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
         uid={effectiveUid}
         data={appData.data}
         update={appData.update}
         online={online}
         pendingWrites={appData.pendingWrites}
         archiveError={appData.archiveError}
         localCacheError={appData.localCacheError}
         onLogout={() => { try { localStorage.removeItem('last_uid'); } catch { /* */ } if (auth) signOut(auth); }}
       />
     </ConfirmProvider>
   </ThemeProvider>
 );
}

function AppGate({
 authReady,
 uid,
 data,
 update,
 online,
 pendingWrites,
 archiveError,
 localCacheError,
 onLogout,
}: {
 authReady: boolean;
 uid: string | null;
 data: AppData | null;
 update: (patch: AppDataPatch) => void;
 online: boolean;
 pendingWrites: boolean;
 archiveError: string | null;
 localCacheError: boolean;
 onLogout: () => void;
}) {
 const { C } = useTheme();

 useEffect(() => {
   document.body.style.background = 'transparent';
 }, []);

 if (!authReady) {
   return (
     <div className="min-h-screen flex items-center justify-center" style={{ background: C.night, color: C.dim }}>
       Chargement…
     </div>
   );
 }

 if (!firebaseReady) {
   return (
     <div className="min-h-screen flex items-center justify-center text-center px-8" style={{ background: C.night, color: C.ember }}>
       Firebase non configuré.
     </div>
   );
 }

 if (!uid) return <Login />;

 if (!data) {
   return (
     <div className="min-h-screen flex items-center justify-center" style={{ background: C.night, color: C.dim }}>
       {online ? 'Synchronisation…' : 'Hors ligne — données indisponibles'}
     </div>
   );
 }

 return (
   <AuthedApp
     data={data}
     update={update}
     uid={uid}
     online={online}
     pendingWrites={pendingWrites}
     archiveError={archiveError}
     localCacheError={localCacheError}
     onLogout={onLogout}
   />
 );
}
