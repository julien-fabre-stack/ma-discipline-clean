import { useState } from 'react';
import type { AppData, Agenda, Habit, Anniversary } from '@/types';
import { uid, dateKey } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Collapsible, Icon, useConfirm } from '@/shared/ui';
import { AgendaSettings } from './AgendaSettings';

export interface DashboardSettingsProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
}

export function DashboardSettings({ data, update }: DashboardSettingsProps) {
  const { C } = useTheme();
  const askConfirm = useConfirm();
  const habits = data.habits || [];
  const anniversaries = data.anniversaries || [];
  const [habitsOpen, setHabitsOpen] = useState(false);
  const [annivOpen, setAnnivOpen] = useState(false);

  const move = (i: number, dir: number) => {
    const s = [...habits];
    const j = i + dir;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    update({ habits: s });
  };
  const setLabel = (id: string, label: string) =>
    update({ habits: habits.map((h) => (h.id === id ? { ...h, label } : h)) });
  const add = () => update({ habits: [...habits, { id: uid(), label: 'Nouvelle habitude' } as Habit] });
  const del = async (h: Habit) => {
    const ok = await askConfirm({ title: "Supprimer l'habitude", message: `Supprimer « ${h.label} » ?` });
    if (ok) update({ habits: habits.filter((x) => x.id !== h.id) });
  };

  // --- Anniversaires ---
  const setAnniv = (id: string, patch: Partial<Anniversary>) =>
    update({ anniversaries: anniversaries.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const addAnniv = () =>
    update({
      anniversaries: [
        ...anniversaries,
        { id: uid(), label: 'Anniversaire', date: dateKey(), notify: true } as Anniversary,
      ],
    });
  const delAnniv = async (a: Anniversary) => {
    const ok = await askConfirm({ title: "Supprimer l'anniversaire", message: `Supprimer « ${a.label} » ?` });
    if (ok) update({ anniversaries: anniversaries.filter((x) => x.id !== a.id) });
  };

  return (
    <div className="px-5 pb-10">
      <Collapsible title="Habitudes quotidiennes" badge={habits.length || null} open={habitsOpen} onToggle={() => setHabitsOpen((o) => !o)}>
        <div className="text-xs mb-3" style={{ color: C.dim }}>
          Ces habitudes apparaissent chaque jour dans le tableau de bord. Une journée « parfaite » = toutes cochées.
        </div>
        {habits.map((h, i) => (
          <div key={h.id} className="flex items-center gap-2 mb-2 last:mb-0">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} className="p-0.5">
                <Icon name="up" size={13} color={C.dim} />
              </button>
              <button onClick={() => move(i, 1)} className="p-0.5">
                <Icon name="down" size={13} color={C.dim} />
              </button>
            </div>
            <input
              value={h.label}
              onChange={(e) => setLabel(h.id, e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none min-w-0"
              style={{ background: C.surf2, color: C.text }}
            />
            <button onClick={() => del(h)} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: C.surf2 }}>
              <Icon name="trash" size={14} color={C.dim} />
            </button>
          </div>
        ))}
        <button onClick={add} className="w-full py-2 rounded-xl text-sm font-semibold mt-1" style={{ background: C.surf2, color: C.gold }}>
          + Ajouter une habitude
        </button>
      </Collapsible>

      <Collapsible title="Dates anniversaires" badge={anniversaries.length || null} open={annivOpen} onToggle={() => setAnnivOpen((o) => !o)}>
        <div className="text-xs mb-3" style={{ color: C.dim }}>
          Anniversaires récurrents (chaque année). Le jour J, un rappel s'affiche dans la fiche du jour et un point doré apparaît dans la frise.
          Avec l'alerte activée, un rappel apparaît aussi 7 jours avant. Ta propre date de naissance (réglée dans « Data opérateur ») est rappelée automatiquement.
        </div>
        {anniversaries.map((a) => (
          <div key={a.id} className="rounded-xl p-3 mb-2" style={{ background: C.surf2 }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="cake" size={16} color={C.gold} />
              <input
                value={a.label}
                onChange={(e) => setAnniv(a.id, { label: e.target.value })}
                placeholder="Nom (ex. Maman, Léa…)"
                className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none min-w-0"
                style={{ background: C.surf, color: C.text }}
              />
              <button onClick={() => delAnniv(a)} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: C.surf }}>
                <Icon name="trash" size={14} color={C.dim} />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <input
                type="date"
                value={a.date}
                onChange={(e) => setAnniv(a.id, { date: e.target.value })}
                className="px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: C.surf, color: C.text, border: `1px solid ${C.line}` }}
              />
              <button
                onClick={() => setAnniv(a.id, { notify: !a.notify })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
                style={{
                  background: a.notify ? C.gold : C.surf,
                  color: a.notify ? '#1A1206' : C.dim,
                  border: `1px solid ${a.notify ? C.gold : C.line}`,
                }}
              >
                <Icon name="calendar" size={12} color={a.notify ? '#1A1206' : C.dim} />
                Alerte 7j {a.notify ? 'on' : 'off'}
              </button>
            </div>
          </div>
        ))}
        <button onClick={addAnniv} className="w-full py-2 rounded-xl text-sm font-semibold mt-1" style={{ background: C.surf2, color: C.gold }}>
          + Ajouter un anniversaire
        </button>
      </Collapsible>

      <AgendaSettings
        agenda={data.agenda}
        setAgenda={(a: Agenda) => update({ agenda: a })}
      />
    </div>
  );
}
