import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppData } from '@/types';
import { DEFAULT_ACTIVITIES, DEFAULT_RDV_TYPES, DEFAULT_STATUSES } from '@/lib/defaults';
import { activitiesOf, eventsOf, ratioOfDay, statusOf } from '@/lib/agenda';
import { sportStatus } from '@/lib/workouts';
import { addDays, daysBetween, dateKey, parseKey } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui';
import { DayPanel } from './DayPanel';

export interface SuiviTabProps {
  data: AppData;
  update: (patch: Partial<AppData>) => void;
  today: string;
  openSettings: () => void;
}

const ROWH = 38;
const LANEW = 7;

export function SuiviTab({ data, update, today, openSettings }: SuiviTabProps) {
  const { C, dawn, glowShadow } = useTheme();
  const dfStart = (data.drinkfree && data.drinkfree.start) || today;
  const drinkCount = Math.max(0, daysBetween(dfStart, today));
  const _dy = Math.floor(drinkCount / 365);
  const _dr = drinkCount % 365;
  const _dm = Math.floor(_dr / 30);
  const _dd = _dr % 30;
  const driLabel =
    (_dy > 0 ? _dy + (_dy > 1 ? ' ans ' : ' an ') : '') + (_dm > 0 ? _dm + ' mois ' : '') + _dd + ' j';
  const Y = new Date().getFullYear();
  const tk = dateKey();

  const streak = useMemo(() => {
    let s = 0;
    let broke = false;
    const yearStart = `${Y}-01-01`;
    const all: string[] = [];
    for (let k = yearStart; k <= `${Y}-12-31`; k = addDays(k, 1)) all.push(k);
    for (let i = all.length - 1; i >= 0; i--) {
      const k = all[i];
      if (k > tk) continue;
      if (broke) break;
      if (ratioOfDay(data, k) >= 1) s++;
      else broke = true;
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.days, data.habits, Y, tk]);

  const agenda = data.agenda || {
    statuses: DEFAULT_STATUSES,
    activities: DEFAULT_ACTIVITIES,
    rdvTypes: DEFAULT_RDV_TYPES,
    periods: [],
    events: [],
  };
  const statuses = agenda.statuses || [];
  const activities = agenda.activities || [];
  const rdvTypes = agenda.rdvTypes || [];
  const [selectedDay, setSelectedDay] = useState(today);
  const days = useMemo(() => {
    const start = addDays(today, -60);
    const end = `${Y + 1}-12-31`;
    const ds: string[] = [];
    for (let k = start; k <= end; k = addDays(k, 1)) ds.push(k);
    return ds;
  }, [today, Y]);
  const todayRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    todayRef.current?.scrollIntoView({ block: 'start' });
  }, []);

  const findNextDay = (pred: (k: string) => boolean): string | null => {
    const i0 = days.indexOf(selectedDay);
    const start = i0 === -1 ? days.indexOf(today) : i0;
    if (start === -1) return null;
    for (let i = start + 1; i < days.length; i++) {
      if (pred(days[i])) return days[i];
    }
    for (let i = 0; i <= start; i++) {
      if (pred(days[i])) return days[i];
    }
    return null;
  };
  const scrollToDay = (k: string | null) => {
    if (!k) return;
    setSelectedDay(k);
    requestAnimationFrame(() => {
      const el = document.getElementById('day-' + k);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };
  const goToStatus = (catId: string) =>
    scrollToDay(findNextDay((k) => {
      const s = statusOf(agenda, k);
      return Boolean(s && s.id === catId);
    }));
  const goToActivity = (catId: string) =>
    scrollToDay(findNextDay((k) => activitiesOf(agenda, k).some((a) => a.id === catId)));
  const goToCycle = (catId: string) => scrollToDay(findNextDay((k) => sportStatus(data, k) === catId));
  const goToPerfect = () => scrollToDay(findNextDay((k) => k <= today && ratioOfDay(data, k) >= 1));
  const goToRdv = (catId: string) =>
    scrollToDay(findNextDay((k) => eventsOf(agenda, k).some((e) => e.typeId === catId)));

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 64px)' }}
    >
      <div className="flex-shrink-0 px-5 pb-3" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}>
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">Tableau de bord</h1>
          <button onClick={openSettings} className="p-2 rounded-full" style={{ background: C.surf }}>
            <Icon name="gear" size={18} color={C.dim} />
          </button>
        </div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs">
            <span className="tracking-widest uppercase" style={{ color: C.gold }}>
              Sans alcool
            </span>{' '}
            <span style={{ color: C.dim }}>· {driLabel}</span>
            {streak > 0 && (
              <span style={{ color: C.dim }}>
                {' '}
                · série {streak} j
              </span>
            )}
          </div>
          <button
            onClick={() => scrollToDay(today)}
            className="flex items-center gap-1 text-xs font-bold tabular-nums px-2.5 py-1 rounded-full"
            style={{ color: '#1A1206', background: dawn, boxShadow: glowShadow() }}
          >
            <Icon name="calendar" size={13} /> Aujourd'hui
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[9px] tracking-widest uppercase flex-shrink-0" style={{ color: C.dim, width: 50 }}>
            Statuts
          </span>
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => goToStatus(s.id)}
              className="px-2 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 whitespace-nowrap"
              style={{ background: s.color, color: '#1A1206' }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mb-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[9px] tracking-widest uppercase flex-shrink-0" style={{ color: C.dim, width: 50 }}>
            Cycle
          </span>
          <button
            onClick={() => goToCycle('actif')}
            className="px-2 py-1 rounded-full text-[10px] flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
            style={{ background: C.surf, border: `1px solid ${C.line}` }}
          >
            <span className="rounded-sm" style={{ width: 5, height: 12, background: C.ok }} />
            actif
          </button>
          <button
            onClick={() => goToCycle('off')}
            className="px-2 py-1 rounded-full text-[10px] flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
            style={{ background: C.surf, border: `1px solid ${C.line}` }}
          >
            <span className="rounded-sm" style={{ width: 5, height: 12, background: '#46405C' }} />
            off
          </button>
          <button
            onClick={goToPerfect}
            className="px-2 py-1 rounded-full text-[10px] flex items-center gap-1 flex-shrink-0 whitespace-nowrap"
            style={{ background: C.surf, border: `1px solid ${C.line}` }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: C.ok }} />
            parfaite
          </button>
        </div>
        <div className="flex items-center gap-2 mb-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[9px] tracking-widest uppercase flex-shrink-0" style={{ color: C.dim, width: 50 }}>
            Périodes
          </span>
          {activities.map((a) => (
            <button
              key={a.id}
              onClick={() => goToActivity(a.id)}
              className="px-2 py-1 rounded-full text-[10px] flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
              style={{ background: C.surf, border: `1px solid ${a.color}` }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
              {a.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <span className="text-[9px] tracking-widest uppercase flex-shrink-0" style={{ color: C.dim, width: 50 }}>
            RDV
          </span>
          {rdvTypes.length === 0 && (
            <span className="text-[10px]" style={{ color: C.dim }}>
              Configure tes catégories dans Réglages → Tableau de bord
            </span>
          )}
          {rdvTypes.map((r) => (
            <button
              key={r.id}
              onClick={() => goToRdv(r.id)}
              className="px-2 py-1 rounded-full text-[10px] flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
              style={{ background: C.surf, border: `1px solid ${r.color}` }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden" style={{ borderTop: `1px solid ${C.line}` }}>
        <div className="overflow-y-auto flex-shrink-0" style={{ width: 74 + (activities.length + 1) * (LANEW + 2) + 14 }}>
          {days.map((k) => {
            const st = statusOf(agenda, k);
            const perfect = ratioOfDay(data, k) >= 1 && k <= today;
            const isToday = k === today;
            const isSel = k === selectedDay;
            const sport = sportStatus(data, k);
            const evts = eventsOf(agenda, k);
            const dayActs = activitiesOf(agenda, k);
            const d = parseKey(k);
            const wknd = [0, 6].includes(d.getDay());
            const cycColor = sport === 'actif' ? C.ok : sport === 'off' ? '#46405C' : 'transparent';
            const bg = wknd ? C.surf2 : st ? st.color : C.night;
            const txt = !wknd && st ? '#1A1206' : isToday ? C.gold : k < today ? C.text : C.dim;
            return (
              <button
                key={k}
                ref={isToday ? todayRef : null}
                id={'day-' + k}
                onClick={() => setSelectedDay(k)}
                className="w-full flex items-center gap-1"
                style={{
                  height: ROWH,
                  background: bg,
                  outline: isSel ? `2px solid ${C.gold}` : 'none',
                  outlineOffset: '-2px',
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <span className="flex-shrink-0 self-stretch" style={{ width: LANEW, background: cycColor }} />
                <span className="text-[10px] leading-tight text-left flex-1 min-w-0 pl-1.5" style={{ color: txt }}>
                  {d.toLocaleDateString('fr-FR', { weekday: 'short' })}.
                  <br />
                  {d.getDate()} {d.toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
                <span className="flex flex-col items-center justify-center gap-0.5 flex-shrink-0" style={{ width: 10 }}>
                  {perfect && <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.ok }} />}
                  {evts.slice(0, 2).map((e) => (
                    <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ background: e.color || '#FFC24B' }} />
                  ))}
                </span>
                <span className="flex items-stretch flex-shrink-0 self-stretch" style={{ gap: 2, paddingRight: 2 }}>
                  {activities.map((a) => (
                    <span
                      key={a.id}
                      style={{ width: LANEW, background: dayActs.some((x) => x.id === a.id) ? a.color : 'transparent' }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <DayPanel data={data} update={update} dayKey={selectedDay} />
        </div>
      </div>
    </div>
  );
}
