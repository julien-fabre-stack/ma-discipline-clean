import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppDataPatch } from '@/lib/useAppData';
import { addDays, parseKey } from '@/lib/utils';
import { Icon, useConfirm } from '@/shared/ui';
import { useJournal } from '@/lib/useJournal';
import { exportMonthPdf, type JournalExportEntry } from '@/lib/journalPdf';
import { useJournalSession } from './JournalSession';
import { JournalLock } from './JournalLock';
import { JournalEntry } from './JournalEntry';

const J = {
  bg: '#F2EFE9',
  card: '#FAFAF7',
  border: '#D6D0C4',
  dateCol: '#EDEBE4',
  text: '#2C2820',
  dim: '#9C9488',
  accent: '#B85C4A',
  serif: "Georgia, 'Times New Roman', serif",
};

export interface JournalTabProps {
  update: (patch: AppDataPatch) => void;
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
      await askConfirm({ title: 'Aucune entrée', message: `Aucune entrée pour ${month} à exporter.` });
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
        style={{
          height: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 64px)',
          fontFamily: J.serif,
          color: J.text,
        }}
      >
        <JournalHeader onSettings={openSettings} onExport={null} onLock={null} exporting={false} />
        <JournalLock uid={uid} onPinCreated={(verifier) => update({ journalMeta: { verifier } })} />
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
      style={{
        height: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 64px)',
        fontFamily: J.serif,
        color: J.text,
      }}
    >
      <JournalHeader onSettings={openSettings} onExport={doExport} onLock={lock} exporting={exporting} />

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="px-4 pt-2 pb-3">
          <button
            onClick={() => setEditDay(today)}
            className="w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{
              background: 'rgba(250,250,247,0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${J.border}`,
              color: J.accent,
              fontFamily: J.serif,
              borderRadius: 2,
            }}
          >
            <Icon name="plus" size={15} color={J.accent} />
            Écrire aujourd'hui
          </button>
        </div>

        {loading && (
          <div className="text-center py-8 text-sm" style={{ color: J.dim, fontFamily: J.serif }}>
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
            if (!isToday) return null;
            return (
              <button
                key={k}
                onClick={() => setEditDay(k)}
                className="w-full flex items-stretch text-left"
                style={{ borderTop: `1px solid ${J.border}`, borderBottom: `1px solid ${J.border}`, marginBottom: -1 }}
              >
                <div
                  className="flex flex-col items-center justify-center flex-shrink-0 py-4"
                  style={{ width: 72, background: 'rgba(237,235,228,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRight: `1px solid ${J.border}` }}
                >
                  <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: J.serif, color: J.text }}>{d.getDate()}</span>
                  <span className="text-[11px] mt-0.5" style={{ color: J.dim }}>{weekday}.</span>
                </div>
                <div className="flex-1 px-4 py-4 flex items-center" style={{ background: 'rgba(250,250,247,0.5)' }}>
                  <span className="text-sm italic" style={{ color: J.dim }}>Écrire aujourd'hui…</span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={k}
              onClick={() => setEditDay(k)}
              className="w-full flex items-stretch text-left"
              style={{ borderTop: `1px solid ${J.border}`, borderBottom: `1px solid ${J.border}`, marginBottom: -1 }}
            >
              <div
                className="flex flex-col items-center justify-center flex-shrink-0 py-4"
                style={{ width: 72, background: 'rgba(237,235,228,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRight: `1px solid ${J.border}` }}
              >
                <span className="text-2xl font-bold tabular-nums" style={{ fontFamily: J.serif, color: J.text }}>{d.getDate()}</span>
                <span className="text-[11px] mt-0.5" style={{ color: J.dim }}>{weekday}.</span>
              </div>
              <div className="flex-1 px-4 py-4 flex items-center" style={{ background: 'rgba(250,250,247,0.6)' }}>
                <span className="text-sm line-clamp-2" style={{ color: J.text, fontFamily: J.serif, lineHeight: 1.55 }}>
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

function JournalHeader({
  onSettings, onExport, onLock, exporting,
}: {
  onSettings: () => void;
  onExport: (() => void) | null;
  onLock: (() => void) | null;
  exporting: boolean;
}) {
  return (
    <div
      className="flex-shrink-0 px-5 pb-3 flex items-end justify-between"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
        borderBottom: `1px solid ${J.border}`,
      }}
    >
      <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: J.serif, color: J.text, letterSpacing: '-0.01em' }}>
        Journal
      </h1>
      <div className="flex items-center gap-1 pb-1">
        {onExport && (
          <button onClick={onExport} disabled={exporting} className="p-2 rounded-full" style={{ background: 'rgba(237,235,228,0.8)', opacity: exporting ? 0.5 : 1 }}>
            <Icon name="download" size={17} color={J.dim} />
          </button>
        )}
        {onLock && (
          <button onClick={onLock} className="p-2 rounded-full" style={{ background: 'rgba(237,235,228,0.8)' }}>
            <Icon name="logout" size={17} color={J.dim} />
          </button>
        )}
        <button onClick={onSettings} className="p-2 rounded-full" style={{ background: 'rgba(237,235,228,0.8)' }}>
          <Icon name="gear" size={17} color={J.dim} />
        </button>
      </div>
    </div>
  );
}
