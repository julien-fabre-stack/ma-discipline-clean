import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useTheme } from '@/shared/theme/ThemeProvider';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Fournit `askConfirm` à toute l'arborescence + monte le modal correspondant.
 * Remplace le couple `askConfirm()` / `_confirmFn` global mutable de la v1
 * par un contexte React classique — même usage côté appelant (`await askConfirm(...)`),
 * mais sans variable module-level partagée entre instances.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { C, cardShadow } = useTheme();
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const askConfirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setPending({ ...opts, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={askConfirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-5"
            style={{ background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold mb-1" style={{ color: C.text }}>
              {pending.title || 'Confirmer la suppression'}
            </div>
            <div className="text-sm mb-5" style={{ color: C.dim }}>
              {pending.message || 'Cette action est irréversible. Veux-tu continuer ?'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => close(false)}
                className="flex-1 py-3 rounded-2xl font-semibold"
                style={{ background: C.surf2, color: C.text }}
              >
                {pending.cancelLabel || 'Annuler'}
              </button>
              <button
                onClick={() => close(true)}
                className="flex-1 py-3 rounded-2xl font-bold"
                style={{ background: C.ember, color: '#fff' }}
              >
                {pending.confirmLabel || 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
