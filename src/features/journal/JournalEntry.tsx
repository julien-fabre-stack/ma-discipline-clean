import { useEffect, useState } from 'react';
import { parseKey } from '@/lib/utils';
import { Icon, useConfirm } from '@/shared/ui';
import { useJournalSession } from './JournalSession';
import type { JournalDoc } from '@/lib/useJournal';

const J = {
  bg: '#F2EFE9',
  card: '#FAFAF7',
  border: '#D6D0C4',
  text: '#2C2820',
  dim: '#9C9488',
  accent: '#B85C4A',
  serif: "Georgia, 'Times New Roman', serif",
};

export interface JournalEntryProps {
  dayKey: string;
  doc: JournalDoc | undefined;
  onSave: (date: string, title: string, body: string) => Promise<void>;
  onDelete: (date: string) => Promise<void>;
  onBack: () => void;
}

export function JournalEntry({ dayKey, doc, onSave, onDelete, onBack }: JournalEntryProps) {
  const { decrypt } = useJournalSession();
  const askConfirm = useConfirm();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = doc?.title ? await decrypt(doc.title) : '';
        const b = doc?.body ? await decrypt(doc.body) : '';
        if (!alive) return;
        setTitle(t);
        setBody(b);
      } catch {
        if (alive) { setTitle(''); setBody(''); }
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  const d = parseKey(dayKey);
  const dateLabel = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(dayKey, title.trim(), body);
      setDirty(false);
      onBack();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const ok = await askConfirm({
      title: "Supprimer l'entrée",
      message: 'Supprimer définitivement cette entrée du journal ?',
    });
    if (!ok) return;
    await onDelete(dayKey);
    onBack();
  };

  const back = async () => {
    if (dirty && (title.trim() || body.trim())) {
      const ok = await askConfirm({
        title: 'Quitter sans enregistrer',
        message: 'Tes modifications ne seront pas sauvegardées. Continuer ?',
      });
      if (!ok) return;
    }
    onBack();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: J.bg, color: J.text, fontFamily: J.serif }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 pb-3"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          borderBottom: `1px solid ${J.border}`,
          background: J.bg,
        }}
      >
        <button
          onClick={back}
          className="p-2 rounded-full flex-shrink-0"
          style={{ background: J.card, border: `1px solid ${J.border}` }}
        >
          <Icon name="left" size={18} color={J.dim} />
        </button>

        <div className="flex-1 min-w-0">
          <div
            className="text-sm capitalize truncate"
            style={{ color: J.dim, fontFamily: J.serif, fontStyle: 'italic' }}
          >
            {dateLabel}
          </div>
        </div>

        {doc && (
          <button
            onClick={remove}
            className="p-2 rounded-full flex-shrink-0"
            style={{ background: J.card, border: `1px solid ${J.border}` }}
          >
            <Icon name="trash" size={17} color={J.dim} />
          </button>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm font-semibold flex-shrink-0"
          style={{
            background: J.accent,
            color: '#FFF',
            borderRadius: 2,
            fontFamily: J.serif,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? '…' : 'Enregistrer'}
        </button>
      </div>

      {!loaded ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: J.dim }}>
          Déchiffrement…
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col" style={{ background: J.card }}>
          {/* Numéro du jour en grand */}
          <div
            className="flex-shrink-0 px-6 pt-6 pb-2"
            style={{ borderBottom: `1px solid ${J.border}` }}
          >
            <div
              className="text-6xl font-bold tabular-nums leading-none"
              style={{ color: J.text, fontFamily: J.serif }}
            >
              {d.getDate()}
            </div>
          </div>

          <div className="flex-1 px-6 pt-4 pb-10 flex flex-col">
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
              placeholder="Titre"
              className="w-full bg-transparent outline-none mb-4"
              style={{
                color: J.text,
                fontFamily: J.serif,
                fontSize: 20,
                fontWeight: 700,
                borderBottom: `1px solid ${J.border}`,
                paddingBottom: 8,
              }}
            />
            <textarea
              value={body}
              onChange={(e) => { setBody(e.target.value); setDirty(true); }}
              placeholder="Écris ici…"
              className="w-full flex-1 bg-transparent outline-none resize-none"
              style={{
                color: J.text,
                fontFamily: J.serif,
                fontSize: 16,
                lineHeight: 2,
                minHeight: 300,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
