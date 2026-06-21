import { useState } from 'react';
import type { AppData, AgendaEvent } from '@/types';
import { DEFAULT_HABITS, RDV_COLORS } from '@/lib/defaults';
import { activitiesOf, eventsOf, statusOf } from '@/lib/agenda';
import { sportStatus } from '@/lib/workouts';
import { parseKey, uid } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Collapsible, Icon, useConfirm } from '@/shared/ui';

export interface DayPanelProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
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
  const note = day.note || '';
  const habits = data.habits || DEFAULT_HABITS;
  const dh = day.habits && !Array.isArray(day.habits) ? day.habits : {};
  const [newTodo, setNewTodo] = useState('');
  const [evtDraft, setEvtDraft] = useState<EventDraft | null>(null);
  const [open, setOpen] = useState({ habits: false, rdv: false, todo: false, note: false });
  const toggle = (k: keyof typeof open) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const st = statusOf(agenda, dayKey);
  const acts = activitiesOf(agenda, dayKey);
  const evts = eventsOf(agenda, dayKey);
  const sport = sportStatus(data, dayKey);

  const setDay = (patch: Partial<typeof day>) => {
    const d = { ...(data.days || {}) };
    d[dayKey] = { ...day, ...patch };
    update({ days: d });
  };
  const setHabit = (id: string) => setDay({ habits: { ...dh, [id]: !dh[id] } });
  const addTodo = () => {
    if (!newTodo.trim()) return;
    setDay({ todos: [...todos, { id: uid(), text: newTodo.trim(), done: false }] });
    setNewTodo('');
  };
  const toggleTodo = (id: string) =>
    setDay({ todos: todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) });
  const delTodo = async (id: string) => {
    const t = todos.find((x) => x.id === id);
    const ok = await askConfirm({
      title: 'Supprimer la tâche',
      message: `Supprimer « ${t && t.text ? t.text : 'cette tâche'} » ?`,
    });
    if (!ok) return;
    setDay({ todos: todos.filter((t) => t.id !== id) });
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
    update({ agenda: { ...agenda, events: [...(agenda.events || []), newEvent] } });
    setEvtDraft(null);
  };
  const delEvent = async (id: string) => {
    const e = (agenda.events || []).find((x) => x.id === id);
    const ok = await askConfirm({
      title: 'Supprimer le rendez-vous',
      message: `Supprimer « ${e && e.label ? e.label : 'ce rendez-vous'} » ?`,
    });
    if (!ok) return;
    update({ agenda: { ...agenda, events: (agenda.events || []).filter((e) => e.id !== id) } });
  };

  const dateLabel = parseKey(dayKey).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const doneCount = habits.filter((h) => dh[h.id]).length;
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
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: C.surf2, color: C.text }}
        >
          Sport :{' '}
          <span style={sport === 'actif' ? { fontWeight: 800, textDecoration: 'underline' } : { fontStyle: 'italic', color: C.dim }}>
            {sport}
          </span>
        </span>
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
                  background: dh[it.id] ? dawn : 'transparent',
                  border: dh[it.id] ? 'none' : `2px solid ${C.surf}`,
                }}
              >
                {dh[it.id] && <Icon name="check" size={11} color="#1A1206" strokeWidth={3} />}
              </div>
              <span className="text-xs" style={{ color: dh[it.id] ? C.text : C.dim }}>
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

      <Collapsible title="Note" badge={note.trim() ? '●' : null} open={open.note} onToggle={() => toggle('note')}>
        <textarea
          value={note}
          onChange={(e) => setDay({ note: e.target.value })}
          rows={3}
          placeholder="Notes du jour…"
          className="w-full px-3 py-2.5 rounded-xl outline-none text-sm mb-1"
          style={{ background: C.night, color: C.text, border: `1px solid ${C.line}` }}
        />
      </Collapsible>
    </div>
  );
}
