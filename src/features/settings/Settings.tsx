import { useRef, useState } from 'react';
import type { AppData } from '@/types';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, type IconName } from '@/shared/ui';
import { ProfileSettings } from './ProfileSettings';
import { TrainingSettings } from './TrainingSettings';
import { NutritionSettings } from './NutritionSettings';
import { DashboardSettings } from './DashboardSettings';
import { ThemeSettings } from './ThemeSettings';
import { BeginnerQuestionnaire } from './BeginnerQuestionnaire';
import { HelpSettings } from './HelpSettings';

export interface SettingsProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
  onClose: () => void;
  onLogout: () => void;
}

type Section = 'profil' | 'training' | 'nutrition' | 'dashboard' | 'apparence' | 'debutant' | 'aide';

const MENUS: [Section, IconName, string, string][] = [
  ['profil', 'user', 'Data opérateur', 'Nom, âge, photo, objectifs'],
  ['training', 'dumbbell', 'Training', 'Workouts, WOD, semaine type'],
  ['nutrition', 'apple', 'Nutrition', 'Objectifs caloriques & eau'],
  ['dashboard', 'calendar', 'Tableau de bord', 'Habitudes & agenda'],
  ['apparence', 'palette', 'Apparence', 'Thème, accent, transparence'],
  ['debutant', 'flame', 'Programme débutant', 'Questionnaire & programme IA'],
  ['aide', 'help', 'Aide & FAQ', 'Tuto, principe de fonctionnement'],
];

const TITLES: Record<Section, string> = {
  profil: 'Data opérateur',
  training: 'Training',
  nutrition: 'Nutrition',
  dashboard: 'Tableau de bord',
  apparence: 'Apparence',
  debutant: 'Programme débutant',
  aide: 'Aide & FAQ',
};

export function Settings({ data, update, onClose, onLogout }: SettingsProps) {
  const { C, cardShadow } = useTheme();
  const [section, setSection] = useState<Section | null>(null);
  const prev = useRef<Section | null>(null);
  if (section) prev.current = section;
  const sec = section || prev.current;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: C.night, color: C.text }}>
      <div
        className="flex items-center gap-2 px-4 pt-5 pb-3"
        style={{ borderBottom: `1px solid ${C.line}`, paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
      >
        {section ? (
          <button onClick={() => setSection(null)} className="p-2 rounded-full flex-shrink-0" style={{ background: C.surf }}>
            <Icon name="left" size={20} color={C.gold} />
          </button>
        ) : (
          <div style={{ width: 36 }} className="flex-shrink-0" />
        )}
        <div className="font-bold text-lg flex-1 text-center truncate">{section ? TITLES[section] : 'Réglages'}</div>
        <button onClick={onClose} className="p-2 rounded-full flex-shrink-0" style={{ background: C.surf }}>
          <Icon name="x" size={20} color={C.dim} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div
          className="absolute inset-0 overflow-y-auto px-5 pt-5 pb-8"
          style={{
            transform: section ? 'translateX(-22%)' : 'translateX(0)',
            opacity: section ? 0 : 1,
            transition: 'transform 360ms cubic-bezier(.22,1,.36,1),opacity 260ms ease',
            pointerEvents: section ? 'none' : 'auto',
          }}
        >
          {MENUS.map(([k, ic, l, desc]) => (
            <button
              key={k}
              onClick={() => setSection(k)}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl mb-3"
              style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: C.surf2 }}>
                <Icon name={ic} size={20} color={C.gold} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-sm">{l}</div>
                <div className="text-xs truncate" style={{ color: C.dim }}>
                  {desc}
                </div>
              </div>
              <Icon name="right" size={18} color={C.dim} />
            </button>
          ))}
          <button
            onClick={onLogout}
            className="w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 mt-4"
            style={{ background: C.surf, color: C.dim }}
          >
            <Icon name="logout" size={18} /> Se déconnecter
          </button>
          <div className="text-center text-xs mt-6" style={{ color: C.dim }}>
            Ma Discipline · v2
          </div>
        </div>

        <div
          className="absolute inset-0 overflow-y-auto pt-5 pb-8"
          style={{
            transform: section ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 360ms cubic-bezier(.22,1,.36,1)',
            pointerEvents: section ? 'auto' : 'none',
          }}
        >
          {sec === 'profil' && <ProfileSettings data={data} update={update} />}
          {sec === 'training' && <TrainingSettings data={data} update={update} />}
          {sec === 'nutrition' && <NutritionSettings data={data} update={update} />}
          {sec === 'dashboard' && <DashboardSettings data={data} update={update} />}
          {sec === 'apparence' && <ThemeSettings data={data} update={update} />}
          {sec === 'debutant' && (
            <div className="px-5">
              <BeginnerQuestionnaire embedded onClose={() => setSection(null)} />
            </div>
          )}
          {sec === 'aide' && <HelpSettings />}
        </div>
      </div>
    </div>
  );
}
