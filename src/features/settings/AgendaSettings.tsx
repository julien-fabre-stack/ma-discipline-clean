import { useState } from 'react';
import type { Agenda, AgendaCategory, Period, PeriodKind } from '@/types';
import { CYCLE_CATS } from '@/lib/defaults';
import { parseKey, uid } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Collapsible, Icon, useConfirm } from '@/shared/ui';

export interface AgendaSettingsProps {
  agenda: Agenda;
  setAgenda: (a: Agenda) => void;
}

type CatBucket = 'statuses' | 'activities' | 'rdvTypes';

const PALETTE = ['#FF7A45', '#FFC24B', '#5BC0FF', '#A78BFA', '#4ADE80', '#FF6FA5', '#34D1BF', '#E5484D'];

function CatList({
  hint,
  cats,
  onChange,
}: {
  hint: string;
  cats: AgendaCategory[];
  onChange: (cats: AgendaCategory[]) => void;
}) {
  const { C } = useTheme();
  const askConfirm = useConfirm();
  const add = () => onChange([...cats, { id: uid(), label: 'Nouveau', color: PALETTE[cats.length % PALETTE.length] }]);
  const set = (id: string, patch: Partial<AgendaCategory>) =>
    onChange(cats.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const del = async (c: AgendaCategory) => {
    const ok = await askConfirm({ title: 'Supprimer la catégorie', message: `Supprimer « ${c.label} » ?` });
    if (ok) onChange(cats.filter((x) => x.id !== c.id));
  };
  return (
    <div className="mb-1">
      <div className="text-xs mb-2" style={{ color: C.dim }}>
        {hint}
      </div>
      {cats.map((c) => (
        <div key={c.id} className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl" style={{ background: C.surf2 }}>
          <label className="relative flex-shrink-0" style={{ width: 26, height: 26 }}>
            <span className="block w-full h-full rounded-full" style={{ background: c.color }} />
            <input
              type="color"
              value={c.color.startsWith('#') ? c.color : '#FF7A45'}
              onChange={(e) => set(c.id, { color: e.target.value })}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
          <input
            value={c.label}
            onChange={(e) => set(c.id, { label: e.target.value })}
            className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none min-w-0"
            style={{ background: C.surf, color: C.text }}
          />
          <button onClick={() => del(c)} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: C.surf }}>
            <Icon name="trash" size={14} color={C.dim} />
          </button>
        </div>
      ))}
      <button onClick={add} className="w-full py-2 rounded-xl text-sm font-semibold" style={{ background: C.surf2, color: C.gold }}>
        + Ajouter
      </button>
    </div>
  );
}

function PeriodEditor({
  kind,
  cats,
  onAdd,
  onCancel,
}: {
  kind: PeriodKind;
  cats: AgendaCategory[];
  onAdd: (p: Omit<Period, 'id'>) => void;
  onCancel: () => void;
}) {
  const { C, dawn, glowShadow } = useTheme();
  const [catId, setCatId] = useState(cats[0]?.id || '');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const valid = catId && start && end && start <= end;
  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: C.surf }}>
      <div className="text-xs mb-2" style={{ color: C.dim }}>
        Catégorie
      </div>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => setCatId(c.id)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
            style={{ background: catId === c.id ? c.color : C.surf2, color: catId === c.id ? '#1A1206' : C.dim }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: catId === c.id ? '#1A1206' : c.color }} />
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <div className="text-xs mb-1" style={{ color: C.dim }}>
            Début
          </div>
          <input
            type="date"
            value={start}
            onChange={(e) => {
              const s = e.target.value;
              setStart(s);
              if (!end || end < s) setEnd(s);
            }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
          />
        </div>
        <div className="flex-1">
          <div className="text-xs mb-1" style={{ color: C.dim }}>
            Fin
          </div>
          <input
            type="date"
            min={start || undefined}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-semibold text-sm" style={{ background: C.surf2, color: C.dim }}>
          Annuler
        </button>
        <button
          disabled={!valid}
          onClick={() => valid && onAdd({ kind, catId, start, end })}
          className="flex-[2] py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: valid ? dawn : C.surf2, color: valid ? '#1A1206' : C.dim, boxShadow: valid ? glowShadow() : 'none' }}
        >
          Ajouter la période
        </button>
      </div>
    </div>
  );
}

function PeriodRow({ period, label, color, onDelete }: { period: Period; label: string; color: string; onDelete: () => void }) {
  const { C } = useTheme();
  const fmtD = (k: string) => parseKey(k).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' });
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2" style={{ background: C.surf2 }}>
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{label}</div>
        <div className="text-xs" style={{ color: C.dim }}>
          {fmtD(period.start)} → {fmtD(period.end)}
        </div>
      </div>
      <button onClick={onDelete} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: C.surf }}>
        <Icon name="trash" size={14} color={C.dim} />
      </button>
    </div>
  );
}

export function AgendaSettings({ agenda, setAgenda }: AgendaSettingsProps) {
  const { C } = useTheme();
  const askConfirm = useConfirm();
  const [periodKind, setPeriodKind] = useState<PeriodKind | null>(null);
  const [open, setOpen] = useState<CatBucket | 'periods' | null>(null);
  const toggle = (s: CatBucket | 'periods') => setOpen((cur) => (cur === s ? null : s));

  const statuses = agenda.statuses || [];
  const activities = agenda.activities || [];
  const rdvTypes = agenda.rdvTypes || [];
  const periods = agenda.periods || [];

  const setBucket = (bucket: CatBucket, cats: AgendaCategory[]) => {
    // Si on supprime une catégorie, on retire les périodes orphelines associées.
    const validIds = new Set(cats.map((c) => c.id));
    const kindOf: Record<CatBucket, PeriodKind> = { statuses: 'status', activities: 'activity', rdvTypes: 'status' };
    const prunedPeriods =
      bucket === 'rdvTypes'
        ? periods
        : periods.filter((p) => p.kind !== kindOf[bucket] || validIds.has(p.catId));
    setAgenda({ ...agenda, [bucket]: cats, periods: prunedPeriods });
  };

  const catsForKind = (k: PeriodKind): AgendaCategory[] =>
    k === 'status' ? statuses : k === 'activity' ? activities : CYCLE_CATS;
  const labelForPeriod = (p: Period): string => {
    const c = catsForKind(p.kind).find((x) => x.id === p.catId);
    return c ? c.label : p.catId;
  };
  const colorForPeriod = (p: Period): string => {
    const c = catsForKind(p.kind).find((x) => x.id === p.catId);
    return c ? c.color : '#888';
  };

  const addPeriod = (p: Omit<Period, 'id'>) => {
    setAgenda({ ...agenda, periods: [...periods, { ...p, id: uid() }] });
    setPeriodKind(null);
  };
  const delPeriod = async (id: string) => {
    const ok = await askConfirm({ title: 'Supprimer la période', message: 'Supprimer cette période ?' });
    if (ok) setAgenda({ ...agenda, periods: periods.filter((p) => p.id !== id) });
  };

  const kindLabels: Record<PeriodKind, string> = { status: 'Statut', activity: 'Activité', cycle: 'Cycle sport' };

  return (
    <div>
      <Collapsible title="Statuts (fond coloré, exclusifs)" badge={statuses.length || null} open={open === 'statuses'} onToggle={() => toggle('statuses')}>
        <CatList hint="Un seul statut par jour : Mission, Repos, Permission…" cats={statuses} onChange={(c) => setBucket('statuses', c)} />
      </Collapsible>

      <Collapsible title="Activités (liserés, cumulables)" badge={activities.length || null} open={open === 'activities'} onToggle={() => toggle('activities')}>
        <CatList hint="Plusieurs possibles le même jour, affichées en colonnes latérales." cats={activities} onChange={(c) => setBucket('activities', c)} />
      </Collapsible>

      <Collapsible title="Types de RDV" badge={rdvTypes.length || null} open={open === 'rdvTypes'} onToggle={() => toggle('rdvTypes')}>
        <CatList hint="Catégories de rendez-vous (couleur de la pastille dans la timeline)." cats={rdvTypes} onChange={(c) => setBucket('rdvTypes', c)} />
      </Collapsible>

      <Collapsible title="Périodes" badge={periods.length || null} open={open === 'periods'} onToggle={() => toggle('periods')}>
        <div className="text-xs mb-3" style={{ color: C.dim }}>
          Applique un statut, une activité ou un état de cycle (actif/off) sur une plage de dates.
        </div>

        {periodKind ? (
          <PeriodEditor kind={periodKind} cats={catsForKind(periodKind)} onAdd={addPeriod} onCancel={() => setPeriodKind(null)} />
        ) : (
          <div className="flex gap-2 mb-4">
            {(['status', 'activity', 'cycle'] as PeriodKind[]).map((k) => (
              <button
                key={k}
                onClick={() => setPeriodKind(k)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: C.surf2, color: C.gold }}
              >
                + {kindLabels[k]}
              </button>
            ))}
          </div>
        )}

        {periods.length === 0 ? (
          <div className="text-sm text-center py-4" style={{ color: C.dim }}>
            Aucune période définie.
          </div>
        ) : (
          [...periods]
            .sort((a, b) => (a.start < b.start ? 1 : -1))
            .map((p) => (
              <PeriodRow key={p.id} period={p} label={`${kindLabels[p.kind]} · ${labelForPeriod(p)}`} color={colorForPeriod(p)} onDelete={() => delPeriod(p.id)} />
            ))
        )}
      </Collapsible>
    </div>
  );
}
