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

const KIND_LABELS: Record<PeriodKind, string> = {
  status: 'Statut',
  activity: 'Activité',
  cycle: 'Cycle sport',
};

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

/**
 * Éditeur de période BIMODAL.
 * - Création : `initial` absent → champs vides, bouton « Ajouter la période ».
 * - Édition  : `initial` fourni → champs préremplis, bouton « Enregistrer ».
 *
 * Le TYPE (statut / activité / cycle) est modifiable dans les deux modes.
 * Changer de type change le jeu de catégories disponibles : on réinitialise
 * donc `catId` sur la première catégorie du nouveau type, car conserver un
 * catId appartenant à l'ancien type produirait une période orpheline
 * (invisible dans la frise, `labelForPeriod` retomberait sur l'id brut).
 *
 * L'appelant DOIT passer une `key` stable (l'id de la période, ou 'new') :
 * c'est ce qui remonte le composant et réinitialise proprement le state
 * quand on passe d'une période à une autre.
 */
function PeriodEditor({
  initial,
  defaultKind,
  catsForKind,
  onSubmit,
  onCancel,
}: {
  initial?: Period;
  defaultKind: PeriodKind;
  catsForKind: (k: PeriodKind) => AgendaCategory[];
  onSubmit: (p: Omit<Period, 'id'>) => void;
  onCancel: () => void;
}) {
  const { C, dawn, glowShadow } = useTheme();
  const [kind, setKind] = useState<PeriodKind>(initial?.kind ?? defaultKind);
  const [catId, setCatId] = useState(initial?.catId ?? catsForKind(initial?.kind ?? defaultKind)[0]?.id ?? '');
  const [start, setStart] = useState(initial?.start ?? '');
  const [end, setEnd] = useState(initial?.end ?? '');

  const cats = catsForKind(kind);
  // La catégorie doit appartenir au type courant, sinon la période serait
  // orpheline. On valide donc l'appartenance, pas seulement la présence.
  const catOk = cats.some((c) => c.id === catId);
  const valid = Boolean(catOk && start && end && start <= end);

  const changeKind = (k: PeriodKind) => {
    if (k === kind) return;
    setKind(k);
    setCatId(catsForKind(k)[0]?.id ?? '');
  };

  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: C.surf, border: `1px solid ${C.gold}` }}>
      <div className="text-xs mb-2" style={{ color: C.dim }}>
        Type
      </div>
      <div className="flex gap-2 mb-3">
        {(['status', 'activity', 'cycle'] as PeriodKind[]).map((k) => (
          <button
            key={k}
            onClick={() => changeKind(k)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={{ background: kind === k ? dawn : C.surf2, color: kind === k ? '#1A1206' : C.dim }}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>

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
          onClick={() => valid && onSubmit({ kind, catId, start, end })}
          className="flex-[2] py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: valid ? dawn : C.surf2, color: valid ? '#1A1206' : C.dim, boxShadow: valid ? glowShadow() : 'none' }}
        >
          {initial ? 'Enregistrer' : 'Ajouter la période'}
        </button>
      </div>
    </div>
  );
}

function PeriodRow({
  period,
  label,
  color,
  onEdit,
  onDelete,
}: {
  period: Period;
  label: string;
  color: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
      <button onClick={onEdit} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: C.surf }}>
        <Icon name="edit" size={14} color={C.gold} />
      </button>
      <button onClick={onDelete} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: C.surf }}>
        <Icon name="trash" size={14} color={C.dim} />
      </button>
    </div>
  );
}

export function AgendaSettings({ agenda, setAgenda }: AgendaSettingsProps) {
  const { C } = useTheme();
  const askConfirm = useConfirm();
  // periodKind !== null  → éditeur ouvert en mode CRÉATION (avec ce type initial)
  // editingId  !== null  → éditeur ouvert en mode ÉDITION, inline à la place
  //                        de la ligne correspondante.
  // Les deux sont mutuellement exclusifs : ouvrir l'un ferme l'autre.
  const [periodKind, setPeriodKind] = useState<PeriodKind | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  /**
   * Enregistre une période modifiée. L'id est CONSERVÉ : la période garde sa
   * place dans le tableau, donc l'ordre de résolution de statusOf() (première
   * période qui matche) reste inchangé — on ne déplace pas silencieusement la
   * priorité d'un statut en le modifiant.
   */
  const savePeriod = (id: string, p: Omit<Period, 'id'>) => {
    setAgenda({ ...agenda, periods: periods.map((x) => (x.id === id ? { ...p, id } : x)) });
    setEditingId(null);
  };
  const delPeriod = async (id: string) => {
    const ok = await askConfirm({ title: 'Supprimer la période', message: 'Supprimer cette période ?' });
    if (ok) {
      if (editingId === id) setEditingId(null);
      setAgenda({ ...agenda, periods: periods.filter((p) => p.id !== id) });
    }
  };
  const startEdit = (id: string) => {
    setPeriodKind(null); // ferme l'éditeur de création s'il était ouvert
    setEditingId(id);
  };
  const startCreate = (k: PeriodKind) => {
    setEditingId(null); // ferme l'éditeur d'édition s'il était ouvert
    setPeriodKind(k);
  };

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
          Applique un statut, une activité ou un état de cycle (actif/off) sur une plage de dates. Touche le crayon pour modifier une période existante.
        </div>

        {periodKind ? (
          <PeriodEditor
            key="new"
            defaultKind={periodKind}
            catsForKind={catsForKind}
            onSubmit={addPeriod}
            onCancel={() => setPeriodKind(null)}
          />
        ) : (
          <div className="flex gap-2 mb-4">
            {(['status', 'activity', 'cycle'] as PeriodKind[]).map((k) => (
              <button
                key={k}
                onClick={() => startCreate(k)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: C.surf2, color: C.gold }}
              >
                + {KIND_LABELS[k]}
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
            .map((p) =>
              // En édition, l'éditeur remplace la ligne SUR PLACE : on voit
              // immédiatement quelle période on modifie, sans scroll.
              // La `key` porte l'id : passer d'une période à une autre remonte
              // le composant et réinitialise son state sur la bonne période.
              editingId === p.id ? (
                <PeriodEditor
                  key={p.id}
                  initial={p}
                  defaultKind={p.kind}
                  catsForKind={catsForKind}
                  onSubmit={(np) => savePeriod(p.id, np)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <PeriodRow
                  key={p.id}
                  period={p}
                  label={`${KIND_LABELS[p.kind]} · ${labelForPeriod(p)}`}
                  color={colorForPeriod(p)}
                  onEdit={() => startEdit(p.id)}
                  onDelete={() => delPeriod(p.id)}
                />
              )
            )
        )}
      </Collapsible>
    </div>
  );
}
