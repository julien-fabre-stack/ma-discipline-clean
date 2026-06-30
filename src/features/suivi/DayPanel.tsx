import { useState, useRef, useEffect } from 'react';
import type { AppData, AgendaEvent } from '@/types';
import type { AppDataPatch } from '@/lib/useAppData';
import { DEFAULT_HABITS, RDV_COLORS } from '@/lib/defaults';
import { activitiesOf, anniversariesOf, eventsOf, statusOf, upcomingAnniversaries } from '@/lib/agenda';
import { sportStatus } from '@/lib/workouts';
import { parseKey, uid, dateKey } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Collapsible, Icon, useConfirm } from '@/shared/ui';

export interface DayPanelProps {
  data: AppData;
  update: (patch: AppDataPatch) => void;
  dayKey: string;
}

interface EventDraft {
  label: string;
  time: string;
  typeId: string | null;
  color: string;
}

export function DayPanel({ data, update, dayKey }: DayPanelProps) {
  const { C, dawn, glowShadow } = useTheme();
  const askConfirm = useConfirm();
  const agenda = data.agenda || { statuses: [], activities: [], rdvTypes: [], periods: [], events: [] };
  const rdvTypes = agenda.rdvTypes || [];
  const day = data.days[dayKey] || {};
  const todos = day.todos || [];
  const habits = data.habits || DEFAULT_HABITS;
  const dh = day.habits && !Array.isArray(day.habits) ? day.habits : {};
  const [newTodo, setNewTodo] = useState('');
  const [evtDraft, setEvtDraft] = useState<EventDraft | null>(null);
  const [open, setOpen] = useState({ habits: false, rdv: false, todo: false, note: false });
  const toggle = (k: keyof typeof open) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  // État optimiste local des cases d'habitudes : la case bascule INSTANTANÉMENT
  // au tap, sans attendre l'aller-retour Firestore (qui restait parfois en
  // suspens et donnait l'impression que la coche « ne marchait pas »). On
  // repart de zéro à chaque changement de jour.
  const [optHabits, setOptHabits] = useState<Record<string, boolean>>({});

  // --- Note : état local + debounce long + protection contre les snapshots ---
  // Le textarea est toujours réactif (état local), la sauvegarde part après
  // 1500ms d'inactivité. Quand le champ est focusé (isFocusedRef = true),
  // on ignore les mises à jour externes (snapshots Firestore) pour éviter
  // que le retour du serveur n'écrase la frappe en cours.
  const [noteText, setNoteText] = useState(day.note || '');
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const dayKeyRef = useRef(dayKey);
  const noteTextRef = useRef(noteText);
  noteTextRef.current = noteText;

  const saveNote = (val: string, targetDayKey: string) => {
    update((prev) => {
      const existing = prev.days[targetDayKey] || {};
      if ((existing.note || '') === val) return prev; // no-op
      const d = { ...(prev.days || {}) };
      d[targetDayKey] = { ...existing, note: val };
      return { days: d };
    });
  };

  // Quand on change de jour : annule le debounce en cours, charge la nouvelle note.
  if (dayKey !== dayKeyRef.current) {
    if (noteDebounceRef.current) {
      clearTimeout(noteDebounceRef.current);
      noteDebounceRef.current = null;
      // Flush immédiat de l'ancien jour avant de changer.
      saveNote(noteTextRef.current, dayKeyRef.current);
    }
    dayKeyRef.current = dayKey;
    const fresh = (data.days[dayKey] || {}).note || '';
    setNoteText(fresh);
    noteTextRef.current = fresh;
    // Réinitialise l'optimisme des habitudes pour le nouveau jour (sinon une
    // case pourrait apparaître cochée à tort sur le jour suivant).
    setOptHabits({});
  }

  // Sync depuis les données externes, SEULEMENT si le champ n'est pas focusé.
  // Cas : on revient sur ce jour après une synchro Firestore depuis un autre appareil.
  const externalNote = day.note || '';
  useEffect(() => {
    if (!isFocusedRef.current) {
      setNoteText(externalNote);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalNote]);

  // Flush au démontage (changement d'onglet, fermeture…).
  useEffect(() => {
    return () => {
      if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
      saveNote(noteTextRef.current, dayKeyRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNoteChange = (val: string) => {
    setNoteText(val);
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
    noteDebounceRef.current = setTimeout(() => {
      saveNote(val, dayKeyRef.current);
    }, 1500);
  };

  const st = statusOf(agenda, dayKey);
  const acts = activitiesOf(agenda, dayKey);
  const evts = eventsOf(agenda, dayKey);
  const sport = sportStatus(data, dayKey);
  const annivToday = anniversariesOf(data, dayKey);
  // Rappel "à venir" uniquement sur la fiche d'aujourd'hui, pour éviter
  // qu'il s'affiche en double sur les 7 jours précédant l'événement.
  const annivSoon = dayKey === dateKey() ? upcomingAnniversaries(data, dayKey, 7) : [];

  // Toutes les écritures passent par la forme fonctionnelle update((prev)=>…) :
  // la nouvelle valeur est calculée depuis l'état LE PLUS RÉCENT (prev), jamais
  // depuis les variables figées au render. C'est ce qui empêche un tap rapide
  // (ou un snapshot intercalé) d'annuler le tap précédent.
  const habitChecked = (id: string) => (id in optHabits ? optHabits[id] : !!dh[id]);
  const setHabit = (id: string) => {
    const next = !habitChecked(id);
    setOptHabits((o) => ({ ...o, [id]: next })); // réponse visuelle immédiate
    update((prev) => {
      const cur = prev.days[dayKey] || {};
      const curH = cur.habits && !Array.isArray(cur.habits) ? cur.habits : {};
      const d = { ...(prev.days || {}) };
      d[dayKey] = { ...cur, habits: { ...curH, [id]: next } };
      return { days: d };
    });
  };
  const addTodo = () => {
    const text = newTodo.trim();
    if (!text) return;
    update((prev) => {
      const cur = prev.days[dayKey] || {};
      const d = { ...(prev.days || {}) };
      d[dayKey] = { ...cur, todos: [...(cur.todos || []), { id: uid(), text, done: false }] };
      return { days: d };
    });
    setNewTodo('');
  };
  const toggleTodo = (id: string) =>
    update((prev) => {
      const cur = prev.days[dayKey] || {};
      const d = { ...(prev.days || {}) };
      d[dayKey] = { ...cur, todos: (cur.todos || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t)) };
      return { days: d };
    });
  const delTodo = async (id: string) => {
    const t = todos.find((x) => x.id === id);
    const ok = await askConfirm({
      title: 'Supprimer la tâche',
      message: `Supprimer « ${t && t.text ? t.text : 'cette tâche'} » ?`,
    });
    if (!ok) return;
    update((prev) => {
      const cur = prev.days[dayKey] || {};
      const d = { ...(prev.days || {}) };
      d[dayKey] = { ...cur, todos: (cur.todos || []).filter((x) => x.id !== id) };
      return { days: d };
    });
  };
  const addEvent = () => {
    if (!evtDraft || !evtDraft.label.trim()) return;
    const newEvent: AgendaEvent = {
      id: uid(),
      date: dayKey,
      label: evtDraft.label.trim(),
      time: evtDraft.time || '',
      typeId: evtDraft.typeId || null,
      color: evtDraft.color || RDV_COLORS[0],
    };
    update((prev) => {
      const ag = prev.agenda || agenda;
      return { agenda: { ...ag, events: [...(ag.events || []), newEvent] } };
    });
    setEvtDraft(null);
  };
  const delEvent = async (id: string) => {
    const e = (agenda.events || []).find((x) => x.id === id);
    const ok = await askConfirm({
      title: 'Supprimer le rendez-vous',
      message: `Supprimer « ${e && e.label ? e.label : 'ce rendez-vous'} » ?`,
    });
    if (!ok) return;
    update((prev) => {
      const ag = prev.agenda || agenda;
      return { agenda: { ...ag, events: (ag.events || []).filter((x) => x.id !== id) } };
    });
  };

  const dateLabel = parseKey(dayKey).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const doneCount = habits.filter((h) => habitChecked(h.id)).length;
  const openTodos = todos.filter((t) => !t.done).length;

  return (
    <div>
      <div className="font-bold capitalize mb-2" style={{ fontSize: 15, lineHeight: 1.3 }}>
        {dateLabel}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {st && (
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: st.color, color: '#1A1206' }}
          >
            {st.label}
          </span>
        )}
        {sport && (
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: C.surf2, color: C.text }}
          >
            Sport :{' '}
            <span style={sport === 'actif' ? { fontWeight: 800, textDecoration: 'underline' } : { fontStyle: 'italic', color: C.dim }}>
              {sport}
            </span>
          </span>
        )}
        {acts.map((a) => (
          <span
            key={a.id}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
            style={{ background: C.night, color: C.text, border: `1px solid ${a.color}` }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
            {a.label}
          </span>
        ))}
      </div>

      {annivToday.length > 0 && (
        <div
          className="rounded-2xl px-4 py-3 mb-3 flex items-start gap-3"
          style={{ background: C.gold, color: '#1A1206' }}
        >
          <Icon name="cake" size={20} color="#1A1206" />
          <div className="min-w-0">
            {annivToday.map((h, i) => (
              <div key={i} className="text-sm font-bold leading-tight">
                {h.label}
                {h.years != null && (
                  <span className="font-semibold"> · {h.years} ans</span>
                )}
              </div>
            ))}
            <div className="text-[11px] font-semibold opacity-80 mt-0.5">
              C'est aujourd'hui 🎂
            </div>
          </div>
        </div>
      )}

      {annivSoon.length > 0 && (
        <div
          className="rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2.5"
          style={{ background: C.surf2, border: `1px solid ${C.gold}` }}
        >
          <Icon name="cake" size={16} color={C.gold} />
          <div className="text-xs min-w-0" style={{ color: C.text }}>
            {annivSoon.map((a, i) => (
              <span key={i}>
                {i > 0 && ' · '}
                <span className="font-semibold">{a.label}</span>{' '}
                <span style={{ color: C.dim }}>
                  {a.inDays === 1 ? 'demain' : `dans ${a.inDays} j`}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <Collapsible title="Habitudes" badge={`${doneCount}/${habits.length}`} open={open.habits} onToggle={() => toggle('habits')}>
        <div className="rounded-xl overflow-hidden mb-1" style={{ border: `1px solid ${C.line}` }}>
          {habits.map((it, i) => (
            <button
              key={it.id}
              onClick={() => setHabit(it.id)}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
              style={{ background: i % 2 ? C.night : C.surf2 }}
            >
              <div
                className="rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  width: 18,
                  height: 18,
                  background: habitChecked(it.id) ? dawn : 'transparent',
                  border: habitChecked(it.id) ? 'none' : `2px solid ${C.surf}`,
                }}
              >
                {habitChecked(it.id) && <Icon name="check" size={11} color="#1A1206" strokeWidth={3} />}
              </div>
              <span className="text-xs" style={{ color: habitChecked(it.id) ? C.text : C.dim }}>
                {it.label}
              </span>
            </button>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="Rendez-vous" badge={evts.length || null} open={open.rdv} onToggle={() => toggle('rdv')}>
        <div className="rounded-xl mb-2 overflow-hidden" style={{ background: C.night, border: `1px solid ${C.line}` }}>
          {evts.length === 0 && (
            <div className="px-3 py-2.5 text-sm" style={{ color: C.dim }}>
              Aucun RDV.
            </div>
          )}
          {evts.map((e, i) => {
            const rt = rdvTypes.find((x) => x.id === e.typeId);
            const sub = [rt && rt.label, e.time].filter(Boolean).join(' · ');
            return (
              <div
                key={e.id}
                className="flex items-center gap-2 px-3 py-2.5"
                style={{ borderTop: i > 0 ? `1px solid ${C.line}` : 'none' }}
              >
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color || RDV_COLORS[0] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{e.label}</div>
                  {sub && (
                    <div className="text-xs" style={{ color: C.gold }}>
                      {sub}
                    </div>
                  )}
                </div>
                <button onClick={() => delEvent(e.id)} className="p-1.5 rounded-lg" style={{ background: C.surf2 }}>
                  <Icon name="trash" size={14} color={C.dim} />
                </button>
              </div>
            );
          })}
        </div>
        {evtDraft ? (
          <div className="rounded-xl p-3 mb-1" style={{ background: C.night }}>
            <input
              autoFocus
              value={evtDraft.label}
              onChange={(e) => setEvtDraft({ ...evtDraft, label: e.target.value })}
              placeholder="Intitulé du RDV"
              className="w-full px-3 py-2.5 rounded-xl mb-2 outline-none text-sm"
              style={{ background: C.surf2, color: C.text }}
            />
            {rdvTypes.length > 0 ? (
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {rdvTypes.map((rt) => {
                  const sel = evtDraft.typeId === rt.id;
                  return (
                    <button
                      key={rt.id}
                      onClick={() => setEvtDraft({ ...evtDraft, typeId: rt.id, color: rt.color })}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                      style={{ background: sel ? rt.color : C.surf2, color: sel ? '#1A1206' : C.dim }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: sel ? '#1A1206' : rt.color }} />
                      {rt.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-1.5 mb-2">
                {RDV_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEvtDraft({ ...evtDraft, color: c, typeId: null })}
                    className="w-7 h-7 rounded-full flex-shrink-0"
                    style={{ background: c, border: (evtDraft.color || RDV_COLORS[0]) === c ? `2px solid ${C.text}` : '2px solid transparent' }}
                  />
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="time"
                value={evtDraft.time}
                onChange={(e) => setEvtDraft({ ...evtDraft, time: e.target.value })}
                className="flex-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                style={{ background: C.surf2, color: C.text }}
              />
              <button onClick={() => setEvtDraft(null)} className="px-4 rounded-xl text-sm" style={{ background: C.surf2, color: C.dim }}>
                Annuler
              </button>
              <button
                onClick={addEvent}
                className="px-4 rounded-xl text-sm font-semibold"
                style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
              >
                OK
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              const first = rdvTypes[0];
              setEvtDraft({ label: '', time: '', typeId: first ? first.id : null, color: first ? first.color : RDV_COLORS[0] });
            }}
            className="w-full py-2.5 rounded-xl font-semibold text-sm mb-1 flex items-center justify-center gap-2"
            style={{ background: C.surf2, color: C.gold }}
          >
            <Icon name="plus" size={16} /> Ajouter un RDV
          </button>
        )}
      </Collapsible>

      <Collapsible title="À faire" badge={openTodos || null} open={open.todo} onToggle={() => toggle('todo')}>
        <div className="rounded-xl mb-2 overflow-hidden" style={{ background: C.night, border: `1px solid ${C.line}` }}>
          {todos.length === 0 && (
            <div className="px-3 py-2.5 text-sm" style={{ color: C.dim }}>
              Rien pour l'instant.
            </div>
          )}
          {todos.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-3 py-2.5"
              style={{ borderTop: i > 0 ? `1px solid ${C.line}` : 'none' }}
            >
              <button
                onClick={() => toggleTodo(t.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: t.done ? dawn : 'transparent', border: t.done ? 'none' : `2px solid ${C.surf2}` }}
              >
                {t.done && <Icon name="check" size={14} color="#1A1206" strokeWidth={3} />}
              </button>
              <span className="flex-1 text-sm" style={{ color: t.done ? C.dim : C.text, textDecoration: t.done ? 'line-through' : 'none' }}>
                {t.text}
              </span>
              <button onClick={() => delTodo(t.id)} className="p-1.5 rounded-lg" style={{ background: C.surf2 }}>
                <Icon name="trash" size={14} color={C.dim} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-1">
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="Nouvelle tâche"
            className="flex-1 px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: C.night, color: C.text, border: `1px solid ${C.line}` }}
          />
          <button onClick={addTodo} className="px-4 rounded-xl" style={{ background: C.surf2 }}>
            <Icon name="plus" size={18} color={C.gold} />
          </button>
        </div>
      </Collapsible>

      <Collapsible
        title="Note"
        badge={noteText.trim() ? '●' : null}
        open={open.note}
        onToggle={() => toggle('note')}
      >
        <textarea
          value={noteText}
          onChange={(e) => handleNoteChange(e.target.value)}
          onFocus={() => { isFocusedRef.current = true; }}
          onBlur={() => {
            isFocusedRef.current = false;
            // Flush immédiat au blur (sortie du champ).
            if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current);
            saveNote(noteTextRef.current, dayKeyRef.current);
          }}
          rows={3}
          placeholder="Notes du jour…"
          className="w-full px-3 py-2.5 rounded-xl outline-none text-sm mb-1"
          style={{ background: C.night, color: C.text, border: `1px solid ${C.line}` }}
        />
      </Collapsible>
    </div>
  );
}
