import { describe, it, expect } from 'vitest';
import {
  pad,
  dateKey,
  fmt,
  daysBetween,
  parseKey,
  addDays,
  mondayOf,
  monthKey,
  addMonths,
  daysInMonth,
  inRange,
  pruneOldDays,
  normName,
} from '../utils';

describe('pad / fmt', () => {
  it('pad ajoute un zéro sous 10', () => {
    expect(pad(3)).toBe('03');
    expect(pad(12)).toBe('12');
    expect(pad(0)).toBe('00');
  });
  it('fmt formate mm:ss', () => {
    expect(fmt(0)).toBe('00:00');
    expect(fmt(65)).toBe('01:05');
    expect(fmt(3599)).toBe('59:59');
  });
});

describe('dateKey / parseKey', () => {
  it('aller-retour identité', () => {
    const k = '2026-07-01';
    expect(dateKey(parseKey(k))).toBe(k);
  });
  it('formate en local, pas UTC', () => {
    // 1er janvier à minuit local ne doit jamais glisser au 31 décembre.
    expect(dateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
});

describe('addDays', () => {
  it('avance dans le même mois', () => {
    expect(addDays('2026-07-01', 5)).toBe('2026-07-06');
  });
  it('franchit le mois et l\'année', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
  it('gère le 29 février', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
  it('traverse le changement d\'heure (Europe/Paris, fin mars) sans glisser', () => {
    // setDate travaille en calendrier local : le passage à l'heure d'été
    // (nuit du dernier dimanche de mars) ne doit pas décaler la date.
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26'); // heure d'hiver
  });
});

describe('daysBetween', () => {
  it('différence simple', () => {
    expect(daysBetween('2026-07-01', '2026-07-11')).toBe(10);
    expect(daysBetween('2026-07-11', '2026-07-01')).toBe(-10);
  });
  it('reste exact à travers le changement d\'heure (parse UTC)', () => {
    // new Date('YYYY-MM-DD') parse en UTC : pas d'heure d'été en UTC,
    // donc toujours des multiples exacts de 24 h. Ce test FIGE ce
    // comportement (une réécriture en local casserait ces bornes).
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});

describe('mondayOf', () => {
  it('un lundi reste lui-même', () => {
    expect(mondayOf('2026-06-29')).toBe('2026-06-29'); // lundi
  });
  it('un dimanche remonte au lundi précédent', () => {
    expect(mondayOf('2026-07-05')).toBe('2026-06-29');
  });
  it('un mercredi remonte au lundi de la semaine', () => {
    expect(mondayOf('2026-07-01')).toBe('2026-06-29');
  });
});

describe('monthKey / addMonths / daysInMonth / inRange', () => {
  it('monthKey tronque', () => {
    expect(monthKey('2026-07-01')).toBe('2026-07');
  });
  it('addMonths franchit l\'année', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
  it('daysInMonth connaît février bissextile', () => {
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2026-07')).toBe(31);
  });
  it('inRange bornes incluses', () => {
    expect(inRange('2026-07-01', '2026-07-01', '2026-07-31')).toBe(true);
    expect(inRange('2026-07-31', '2026-07-01', '2026-07-31')).toBe(true);
    expect(inRange('2026-08-01', '2026-07-01', '2026-07-31')).toBe(false);
  });
});

describe('pruneOldDays', () => {
  const today = '2026-07-01';
  const cutoff = addDays(today, -400); // borne : conservée (k >= cutoff)

  it('conserve le jour exactement à J-400 (borne incluse)', () => {
    const days = { [cutoff]: { a: 1 } };
    const r = pruneOldDays(days, today);
    expect(r.kept[cutoff]).toEqual({ a: 1 });
    expect(r.changed).toBe(false);
  });

  it('retire le jour à J-401', () => {
    const old = addDays(today, -401);
    const days = { [old]: { a: 1 }, [today]: { b: 2 } };
    const r = pruneOldDays(days, today);
    expect(r.removed[old]).toEqual({ a: 1 });
    expect(r.kept[today]).toEqual({ b: 2 });
    expect(r.changed).toBe(true);
  });

  it('days undefined → résultat vide, changed=false', () => {
    const r = pruneOldDays(undefined, today);
    expect(r.kept).toEqual({});
    expect(r.removed).toEqual({});
    expect(r.changed).toBe(false);
  });
});

describe('normName', () => {
  it('normalise accents, casse, espaces', () => {
    expect(normName('  Pompes   Diamants ')).toBe('pompes diamants');
    expect(normName('Élévations latérales')).toBe('elevations laterales');
    expect(normName(undefined)).toBe('');
  });
});
