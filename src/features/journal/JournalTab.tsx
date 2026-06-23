import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppData } from '@/types';
import { addDays, parseKey } from '@/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, useConfirm } from '@/shared/ui';
import { useJournal } from '@/lib/useJournal';
import { exportMonthPdf, type JournalExportEntry } from '@/lib/journalPdf';
import { useJournalSession } from './JournalSession';
import { JournalLock } from './JournalLock';
import { JournalEntry } from './JournalEntry';

export interface JournalTabProps {
  update: (patch: Partial<AppData>) => void;
  uid: string;
  today: string;
  openSettings: () => void;
  initialDay?: string | null;
  onConsumeInitialDay?: () => void;
}

interface DecryptedPreview {
  title: string;
}

export function JournalTab({
  update,
  uid,
  today,
  openSettings,
  initialDay,
  onConsumeInitialDay,
}: JournalTabProps) {
  const { C, dawn, glowShadow } = useTheme();
  const askConfirm = useConfirm();
  const { unlocked, encrypt, decrypt, lock } = useJournalSession();
  const { entries, loading, saveEntry, deleteEntry } = useJournal(unlocked ? uid : null);

  const [editDay, setEditDay] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, DecryptedPreview>>({});
  const [exporting, setExporting] = useState(false);
  const decryptingRef = useRef(false);

  useEffect(() => {
    if (initialDay && unlocked && editDay === null) {
      setEditDay(initialDay);
      onConsumeInitialDay?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDay, unlocked]);

  const listDays = useMemo(() => {
    const ds: string[] = [];
    for (let i = 0; i < 90; i++) ds.push(addDays(today, -i));
    return ds;
  }, [today]);

  useEffect(() => {
    if (!unlocked || loading) return;
    const missing = Object.keys(entries).filter((k) => !(k in previews));
    if (missing.length === 0 || decryptingRef.current) return;
    decryptingRef.current = true;
    void (async () => {
      const next: Record<string, DecryptedPreview> = {};
      for (const k of missing) {
        try {
          const e = entries[k];
          const title = e.title ? await decrypt(e.title) : '';
          const body = e.body ? await decrypt(e.body) : '';
          next[k] = { title: title.trim() || body.trim().slice(0, 60) };
        } catch {
          next[k] = { title: '🔒 illisible' };
        }
      }
      setPreviews((p) => ({ ...p, ...next }));
      decryptingRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, unlocked, loading]);

  const onSave = async (date: string, title: string, body: string) => {
    const payload: { title?: { iv: string; ct: string }; body: { iv: string; ct: string } } = {
      body: await encrypt(body),
    };
    if (title) payload.title = await encrypt(title);
    await saveEntry(date, payload);
    setPreviews((p) => ({ ...p, [date]: { title: title || body.trim().slice(0, 60) } }));
  };

  const onDelete = async (date: string) => {
    await deleteEntry(date);
    setPreviews((p) => {
      const n = { ...p };
      delete n[date];
      return n;
    });
  };

  const doExport = async () => {
    const month = today.slice(0, 7);
    const monthKeys = Object.keys(entries).filter((k) => k.startsWith(month));
    if (monthKeys.length === 0) {
      await askConfirm({
        title: 'Aucune entrée',
        message: `Aucune entrée pour ${month} à exporter.`,
      });
      return;
    }
    const ok = await askConfirm({
      title: 'Exporter en PDF',
      message: 'Le PDF exporté ne sera PAS chiffré : il contiendra tes entrées en clair. Continuer ?',
    });
    if (!ok) return;
    setExporting(true);
    try {
      const exp: JournalExportEntry[] = [];
      for (const k of monthKeys) {
        const e = entries[k];
        const title = e.title ? await decrypt(e.title) : '';
        const body = e.body ? await decrypt(e.body) : '';
        exp.push({ date: k, title, body });
      }
      exportMonthPdf(month, exp);
    } finally {
      setExporting(false);
    }
  };

  if (!unlocked) {
    return (
      <div
        className="flex flex-col"
        style={{ height: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 64px)' }}
      >
        <Header C={C} onSettings={openSettings} onExport={null} onLock={null} exporting={false} />
        <JournalLock
          uid={uid}
          onPinCreated={(verifier) => update({ journalMeta: { verifier } })}
        />
      </div>
    );
  }

  if (editDay) {
    return (
      <JournalEntry
        dayKey={editDay}
        doc={entries[editDay]}
        onSave={onSave}
        onDelete={onDelete}
        onBack={() => setEditDay(null)}
      />
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 64px)' }}
    >
      <Header C={C} onSettings={openSettings} onExport={doExport} onLock={lock} exporting={exporting} />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <button
          onClick={() => setEditDay(today)}
          className="w-full py-3 rounded-xl font-semibold text-sm mb-4 flex items-center justify-center gap-2"
          style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
        >
          <Icon name="plus" size={16} /> Entrée du jour
        </button>

        {loading && (
          <div className="text-center py-8 text-sm" style={{ color: C.dim }}>
            Chargement…
          </div>
        )}

        {listDays.map((k) => {
          const entry = entries[k];
          const d = parseKey(k);
          const weekday = d.toLocaleDateString('fr-FR', { weekday: 'short' });
          const isToday = k === today;
          const preview = previews[k];

          if (!entry) {
            return (
              <button
                key={k}
                onClick={() => setEditDay(k)}
                className="w-full flex items-center gap-3 px-2 py-2 text-left opacity-60"
              >
                <span className="text-[11px] tabular-nums" style={{ color: C.dim, width: 56 }}>
                  {d.getDate()} {weekday}.
                </span>
                <span className="text-xs" style={{ color: C.dim }}>
                  {isToday ? "Écrire aujourd'hui…" : '—'}
                </span>
              </button>
            );
          }

          return (
            <button
              key={k}
              onClick={() => setEditDay(k)}
              className="w-full flex items-stretch gap-3 mb-2 rounded-xl overflow-hidden text-left"
              style={{ background: C.surf, border: `1px solid ${C.line}` }}
            >
              <div
                className="flex flex-col items-center justify-center flex-shrink-0 px-3 py-3"
                style={{ background: C.surf2, minWidth: 58 }}
              >
                <span className="text-lg font-bold tabular-nums">{d.getDate()}</span>
                <span className="text-[10px]" style={{ color: C.dim }}>
                  {weekday}.
                </span>
              </div>
              <div className="flex-1 min-w-0 py-3 pr-3 flex items-center">
                <span className="text-sm line-clamp-2" style={{ color: C.text }}>
                  {preview ? preview.title || '(sans titre)' : '…'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Header({
  C,
  onSettings,
  onExport,
  onLock,
  exporting,
}: {
  C: ReturnType<typeof useTheme>['C'];
  onSettings: () => void;
  onExport: (() => void) | null;
  onLock: (() => void) | null;
  exporting: boolean;
}) {
  return (
    <div
      className="flex-shrink-0 px-5 pb-3 flex items-start justify-between"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
    >
      <h1 className="text-2xl font-extrabold tracking-tight">Journal</h1>
      <div className="flex items-center gap-2">
        {onExport && (
          <button
            onClick={onExport}
            disabled={exporting}
            className="p-2 rounded-full"
            style={{ background: C.surf, opacity: exporting ? 0.5 : 1 }}
          >
            <Icon name="download" size={18} color={C.dim} />
          </button>
        )}
        {onLock && (
          <button onClick={onLock} className="p-2 rounded-full" style={{ background: C.surf }}>
            <Icon name="logout" size={18} color={C.dim} />
          </button>
        )}
        <button onClick={onSettings} className="p-2 rounded-full" style={{ background: C.surf }}>
          <Icon name="gear" size={18} color={C.dim} />
        </button>
      </div>
    </div>
  );
}
