import { useEffect, useState } from 'react';
import type { AppData, SavingsAccount, SavingsCounter } from '@/types';
import type { AppDataPatch } from '@/lib/useAppData';
import { uid } from '@/lib/utils';
import { useToday } from '@/lib/useToday';
import {
  SAVINGS_PERIODS,
  accountsTotal,
  countOccurrences,
  formatEuros,
  parseAmount,
  roundCents,
  savingsTotal,
} from '@/lib/savings';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon, useConfirm } from '@/shared/ui';

export interface SavingsSettingsProps {
  data: AppData;
  update: (patch: AppDataPatch) => void;
}

const fmtInput = (n: number): string => String(n).replace('.', ',');
// Données corrompues / anciennes : un montant illisible vaut 0 (jamais NaN à l'écran).
const num = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) ? n : 0);

/**
 * Champ de montant : garde sa propre chaîne de saisie (pour taper « 12, » ou
 * « - » sans que le champ se réinitialise) et ne remonte que des nombres
 * valides, arrondis au centime. Une saisie vide vaut 0.
 */
function AmountInput({
  value,
  onCommit,
  allowNegative = false,
  className = '',
  ariaLabel,
}: {
  value: number;
  onCommit: (n: number) => void;
  allowNegative?: boolean;
  className?: string;
  ariaLabel: string;
}) {
  const { C } = useTheme();
  const [str, setStr] = useState(() => fmtInput(value));

  // Resynchronise uniquement si la valeur change de l'extérieur (snapshot
  // distant) ; une saisie équivalente (« 12, » = 12) n'est pas écrasée.
  useEffect(() => {
    setStr((s) => (parseAmount(s) === value ? s : fmtInput(value)));
  }, [value]);

  const pattern = allowNegative ? /^-?\d*[.,]?\d*$/ : /^\d*[.,]?\d*$/;

  return (
    <input
      // Pas de inputMode numérique quand le signe « - » est permis : le
      // pavé numérique iOS n'a pas de touche moins.
      inputMode={allowNegative ? undefined : 'decimal'}
      aria-label={ariaLabel}
      value={str}
      onChange={(e) => {
        const v = e.target.value;
        if (!pattern.test(v)) return;
        setStr(v);
        const n = parseAmount(v);
        if (n != null) onCommit(roundCents(n));
      }}
      className={`px-3 py-1.5 rounded-lg text-sm outline-none text-right ${className}`}
      style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
    />
  );
}

function AccountRow({
  account,
  onRename,
  onAmount,
  onDelete,
}: {
  account: SavingsAccount;
  onRename: (name: string) => void;
  onAmount: (n: number) => void;
  onDelete: () => void;
}) {
  const { C } = useTheme();
  return (
    <div className="flex items-center gap-2 py-1.5">
      <input
        aria-label="Nom du compte"
        value={account.name}
        onChange={(e) => onRename(e.target.value)}
        placeholder="Nom du compte"
        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm outline-none"
        style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
      />
      <AmountInput value={num(account.amount)} onCommit={onAmount} className="w-24" ariaLabel={`Montant ${account.name}`} />
      <span className="text-sm" style={{ color: C.dim }}>
        €
      </span>
      <button
        onClick={onDelete}
        aria-label={`Supprimer ${account.name}`}
        className="p-1.5 rounded-full flex-shrink-0"
        style={{ background: C.surf2 }}
      >
        <Icon name="trash" size={14} color={C.dim} />
      </button>
    </div>
  );
}

export function SavingsSettings({ data, update }: SavingsSettingsProps) {
  const { C, dawn, cardShadow, glowShadow } = useTheme();
  const askConfirm = useConfirm();
  const today = useToday();

  const counter = data.savingsCounter || null;
  const accounts = data.savingsAccounts || [];

  // Toutes les écritures utilisent la forme fonctionnelle (état le plus récent).
  const patchCounter = (patch: Partial<SavingsCounter>) =>
    update((prev) => (prev.savingsCounter ? { savingsCounter: { ...prev.savingsCounter, ...patch } } : prev));

  const enable = () =>
    update({
      savingsCounter: { label: 'Épargne', start: today, amount: 0, period: 'week', adjust: 0 },
    });

  const disable = async () => {
    const ok = await askConfirm({
      title: 'Désactiver le compteur',
      message: 'Le compteur disparaît du tableau de bord et ses réglages sont effacés. Continuer ?',
      confirmLabel: 'Désactiver',
    });
    if (ok) update({ savingsCounter: null });
  };

  const addAccount = () =>
    update((prev) => {
      const list = prev.savingsAccounts || [];
      return { savingsAccounts: [...list, { id: uid(), name: `Compte ${list.length + 1}`, amount: 0 }] };
    });

  const patchAccount = (id: string, patch: Partial<SavingsAccount>) =>
    update((prev) => ({
      savingsAccounts: (prev.savingsAccounts || []).map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));

  const deleteAccount = async (a: SavingsAccount) => {
    const ok = await askConfirm({
      title: 'Supprimer le compte',
      message: `Supprimer « ${a.name || 'sans nom'} » (${formatEuros(a.amount)}) ?`,
      confirmLabel: 'Supprimer',
    });
    if (ok) update((prev) => ({ savingsAccounts: (prev.savingsAccounts || []).filter((x) => x.id !== a.id) }));
  };

  const card = { background: C.surf, border: `1px solid ${C.line}`, boxShadow: cardShadow() };

  return (
    <>
      <div className="text-xs tracking-widest uppercase mb-3" style={{ color: C.dim }}>
        Compteur d'épargne
      </div>
      <div className="rounded-2xl p-4 mb-5" style={card}>
        {!counter ? (
          <>
            <div className="text-sm mb-3" style={{ color: C.dim }}>
              Cumule automatiquement un montant à chaque jour, semaine, mois ou année, et l'affiche sous « Sans alcool »
              dans le tableau de bord.
            </div>
            <button
              onClick={enable}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ background: dawn, color: '#1A1206', boxShadow: glowShadow() }}
            >
              Activer le compteur
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Libellé</span>
              <input
                aria-label="Libellé du compteur"
                value={counter.label ?? ''}
                onChange={(e) => patchCounter({ label: e.target.value })}
                placeholder="Épargne"
                className="w-40 px-3 py-1.5 rounded-lg text-sm outline-none text-right"
                style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Date initiale</span>
              <input
                type="date"
                value={counter.start}
                onChange={(e) => {
                  if (e.target.value) patchCounter({ start: e.target.value });
                }}
                className="px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: C.surf2, color: C.text, border: `1px solid ${C.line}` }}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Montant</span>
              <div className="flex items-center gap-2">
                <AmountInput
                  value={num(counter.amount)}
                  onCommit={(n) => patchCounter({ amount: Math.max(0, n) })}
                  className="w-24"
                  ariaLabel="Montant à chaque occurrence"
                />
                <span className="text-sm" style={{ color: C.dim }}>
                  €
                </span>
              </div>
            </div>
            <div className="py-2">
              <div className="text-sm mb-2">Fréquence</div>
              <div className="grid grid-cols-4 gap-1.5">
                {SAVINGS_PERIODS.map((p) => {
                  const on = counter.period === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => patchCounter({ period: p.id })}
                      className="py-2 rounded-lg text-xs font-semibold"
                      style={{
                        background: on ? dawn : C.surf2,
                        color: on ? '#1A1206' : C.dim,
                        border: `1px solid ${on ? 'transparent' : C.line}`,
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Correction</span>
              <div className="flex items-center gap-2">
                <AmountInput
                  value={num(counter.adjust)}
                  onCommit={(n) => patchCounter({ adjust: n })}
                  allowNegative
                  className="w-24"
                  ariaLabel="Correction manuelle"
                />
                <span className="text-sm" style={{ color: C.dim }}>
                  €
                </span>
              </div>
            </div>
            <div className="text-xs mt-1 tabular-nums" style={{ color: C.dim }}>
              Valeur théorique : {countOccurrences(counter.start, today, counter.period)} ×{' '}
              {formatEuros(num(counter.amount))}
              {num(counter.adjust) ? ` ${num(counter.adjust) > 0 ? '+' : '−'} ${formatEuros(Math.abs(num(counter.adjust)))}` : ''} ={' '}
              <span style={{ color: C.text }}>{formatEuros(savingsTotal(counter, today))}</span>
              <br />
              Une occurrence compte dès le jour J. La correction sert à rattraper un écart avec ton solde réel.
            </div>
            <button
              onClick={disable}
              className="w-full py-2.5 rounded-xl font-semibold text-sm mt-4"
              style={{ background: C.surf2, color: C.ember }}
            >
              Désactiver le compteur
            </button>
          </>
        )}
      </div>

      <div className="text-xs tracking-widest uppercase mb-3" style={{ color: C.dim }}>
        Comptes d'épargne
      </div>
      <div className="rounded-2xl p-4 mb-5" style={card}>
        {accounts.length === 0 && (
          <div className="text-sm mb-2" style={{ color: C.dim }}>
            Aucun compte pour l'instant. Visible uniquement ici.
          </div>
        )}
        {accounts.map((a) => (
          <AccountRow
            key={a.id}
            account={a}
            onRename={(name) => patchAccount(a.id, { name })}
            onAmount={(n) => patchAccount(a.id, { amount: n })}
            onDelete={() => deleteAccount(a)}
          />
        ))}
        <button
          onClick={addAccount}
          className="w-full py-2.5 rounded-xl font-semibold text-sm mt-2"
          style={{ background: C.surf2, color: C.gold }}
        >
          + Ajouter un compte
        </button>
        <div
          className="flex items-center justify-between mt-4 pt-3 text-sm font-semibold tabular-nums"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          <span>Total</span>
          <span style={{ color: C.gold }}>{formatEuros(accountsTotal(accounts))}</span>
        </div>
      </div>
    </>
  );
}
