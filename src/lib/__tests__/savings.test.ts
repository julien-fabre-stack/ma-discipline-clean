import { describe, it, expect } from 'vitest';
import type { SavingsCounter } from '@/types';
import {
  accountsTotal,
  countOccurrences,
  formatEuros,
  parseAmount,
  roundCents,
  savingsTotal,
} from '../savings';
import { defaultAppData, migrateData } from '../defaults';

const counter = (over: Partial<SavingsCounter> = {}): SavingsCounter => ({
  label: 'Épargne',
  start: '2024-12-07',
  amount: 50,
  period: 'week',
  adjust: 0,
  ...over,
});

describe('countOccurrences — hebdomadaire', () => {
  it('le jour de départ compte (1ʳᵉ occurrence)', () => {
    expect(countOccurrences('2024-12-07', '2024-12-07', 'week')).toBe(1);
  });
  it('veille de la 2ᵉ occurrence → toujours 1', () => {
    expect(countOccurrences('2024-12-07', '2024-12-13', 'week')).toBe(1);
  });
  it('7 jours plus tard → 2', () => {
    expect(countOccurrences('2024-12-07', '2024-12-14', 'week')).toBe(2);
  });
  it('samedis du 07/12/2024 au lundi 09/11/2026 → 101', () => {
    expect(countOccurrences('2024-12-07', '2026-11-09', 'week')).toBe(101);
  });
  it('samedi 14/11/2026 → 102 (compté dès le jour J)', () => {
    expect(countOccurrences('2024-12-07', '2026-11-14', 'week')).toBe(102);
  });
  it('départ dans le futur → 0', () => {
    expect(countOccurrences('2026-12-01', '2026-11-09', 'week')).toBe(0);
  });
});

describe('countOccurrences — quotidien', () => {
  it('même jour → 1', () => {
    expect(countOccurrences('2026-11-09', '2026-11-09', 'day')).toBe(1);
  });
  it('10 jours plus tard → 11', () => {
    expect(countOccurrences('2026-11-01', '2026-11-11', 'day')).toBe(11);
  });
  it('départ dans le futur → 0', () => {
    expect(countOccurrences('2026-11-10', '2026-11-09', 'day')).toBe(0);
  });
});

describe('countOccurrences — mensuel', () => {
  it('même jour → 1', () => {
    expect(countOccurrences('2026-01-15', '2026-01-15', 'month')).toBe(1);
  });
  it('veille du quantième suivant → 1', () => {
    expect(countOccurrences('2026-01-15', '2026-02-14', 'month')).toBe(1);
  });
  it('quantième suivant → 2', () => {
    expect(countOccurrences('2026-01-15', '2026-02-15', 'month')).toBe(2);
  });
  it('fin de mois bornée : 31 janv → 28 févr compte la 2ᵉ occurrence', () => {
    expect(countOccurrences('2026-01-31', '2026-02-27', 'month')).toBe(1);
    expect(countOccurrences('2026-01-31', '2026-02-28', 'month')).toBe(2);
  });
  it('le 31 revient en mars (pas de dérive après février)', () => {
    expect(countOccurrences('2026-01-31', '2026-03-30', 'month')).toBe(2);
    expect(countOccurrences('2026-01-31', '2026-03-31', 'month')).toBe(3);
  });
  it('passage d\'année : 15 déc 2025 → 15 janv 2026 = 2', () => {
    expect(countOccurrences('2025-12-15', '2026-01-15', 'month')).toBe(2);
  });
});

describe('countOccurrences — annuel', () => {
  it('jour de départ → 1', () => {
    expect(countOccurrences('2024-12-07', '2024-12-07', 'year')).toBe(1);
  });
  it('veille de l\'anniversaire → 1, jour J → 2', () => {
    expect(countOccurrences('2024-12-07', '2025-12-06', 'year')).toBe(1);
    expect(countOccurrences('2024-12-07', '2025-12-07', 'year')).toBe(2);
  });
  it('29 févr → 28 févr les années non bissextiles', () => {
    expect(countOccurrences('2024-02-29', '2025-02-27', 'year')).toBe(1);
    expect(countOccurrences('2024-02-29', '2025-02-28', 'year')).toBe(2);
  });
});

describe('countOccurrences — entrées invalides', () => {
  it('date mal formée → 0 (jamais de NaN)', () => {
    expect(countOccurrences('', '2026-11-09', 'week')).toBe(0);
    expect(countOccurrences('2026-11-09', 'abc', 'month')).toBe(0);
  });
});

describe('savingsTotal', () => {
  it('50 €/samedi depuis le 07/12/2024 → 5 050 € le 09/11/2026', () => {
    expect(savingsTotal(counter(), '2026-11-09')).toBe(5050);
  });
  it('la correction s\'ajoute (et peut être négative)', () => {
    expect(savingsTotal(counter({ adjust: -50 }), '2026-11-09')).toBe(5000);
    expect(savingsTotal(counter({ adjust: 25.5 }), '2026-11-09')).toBe(5075.5);
  });
  it('montant ou correction invalides → traités comme 0', () => {
    expect(savingsTotal(counter({ amount: NaN }), '2026-11-09')).toBe(0);
    expect(savingsTotal(counter({ adjust: NaN }), '2026-11-09')).toBe(5050);
  });
  it('arrondi au centime', () => {
    expect(savingsTotal(counter({ amount: 0.1, period: 'day', start: '2026-11-07' }), '2026-11-09')).toBe(0.3);
  });
});

describe('accountsTotal', () => {
  it('somme des comptes, liste vide → 0', () => {
    expect(accountsTotal(undefined)).toBe(0);
    expect(accountsTotal([])).toBe(0);
    expect(
      accountsTotal([
        { id: 'a', name: 'Livret', amount: 1200.1 },
        { id: 'b', name: 'PEL', amount: 300.2 },
      ])
    ).toBe(1500.3);
  });
  it('ignore les montants invalides', () => {
    expect(accountsTotal([{ id: 'a', name: 'X', amount: NaN }, { id: 'b', name: 'Y', amount: 10 }])).toBe(10);
  });
});

describe('parseAmount / roundCents / formatEuros', () => {
  it('accepte virgule et point', () => {
    expect(parseAmount('12,5')).toBe(12.5);
    expect(parseAmount('12.5')).toBe(12.5);
    expect(parseAmount('-20')).toBe(-20);
  });
  it('saisie en cours → 0, saisie illisible → null', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('-')).toBe(0);
    expect(parseAmount('abc')).toBeNull();
  });
  it('roundCents', () => {
    expect(roundCents(0.1 + 0.2)).toBe(0.3);
  });
  it('formatEuros contient le montant et le symbole €', () => {
    const s = formatEuros(5050).replace(/\s/g, '');
    expect(s).toBe('5050€');
    expect(formatEuros(12.5).replace(/\s/g, '')).toBe('12,5€');
    expect(formatEuros(NaN).replace(/\s/g, '')).toBe('0€');
  });
});

describe('migrateData — épargne', () => {
  it('ancien document sans champs épargne → compteur désactivé, aucun compte', () => {
    const m = migrateData({});
    expect(m.savingsCounter).toBeNull();
    expect(m.savingsAccounts).toEqual([]);
  });
  it('conserve un compteur et des comptes existants', () => {
    const c = counter();
    const accounts = [{ id: 'a', name: 'Livret A', amount: 100 }];
    const m = migrateData({ savingsCounter: c, savingsAccounts: accounts });
    expect(m.savingsCounter).toEqual(c);
    expect(m.savingsAccounts).toEqual(accounts);
  });
  it('valeurs corrompues → repli propre', () => {
    const m = migrateData({
      savingsCounter: 'oops' as unknown as SavingsCounter,
      savingsAccounts: 'oops' as unknown as [],
    });
    expect(m.savingsCounter).toBeNull();
    expect(m.savingsAccounts).toEqual([]);
  });
  it('defaultAppData expose les valeurs par défaut', () => {
    const d = defaultAppData();
    expect(d.savingsCounter).toBeNull();
    expect(d.savingsAccounts).toEqual([]);
  });
});
