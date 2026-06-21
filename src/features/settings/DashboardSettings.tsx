import type { AppData, Agenda, Habit } from '@/types';
import { uid } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, useConfirm } from '@/shared/ui';
import { AgendaSettings } from './AgendaSettings';

export interface DashboardSettingsProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
}

export function DashboardSettings({ data, update }: DashboardSettingsProps) {
  const { C, cardShadow } = useTheme();
  const askConfirm = useConfirm();
  const habits = data.habits || [];

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

  return (
    <div className="px-5 pb-10">
      <div className="text-xs tracking-widest uppercase mb-1 mt-2" style={{ color: C.dim }}>
        Habitudes quotidiennes
      </div>
      <div className="text-xs mb-3" style={{ color: C.dim }}>
        Ces habitudes apparaissent chaque jour dans le tableau de bord. Une journée « parfaite » = toutes cochées.
      </div>
      <div className="rounded-2xl p-3 mb-6" style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}>
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
      </div>

      <AgendaSettings
        agenda={data.agenda}
        setAgenda={(a: Agenda) => update({ agenda: a })}
      />
    </div>
  );
}
