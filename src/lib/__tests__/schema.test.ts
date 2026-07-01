import { describe, it, expect } from 'vitest';
import { parseRemoteAppData } from '../schema';

describe('parseRemoteAppData — cas valides', () => {
  it('objet vide accepté (migrateData comble les manques)', () => {
    const r = parseRemoteAppData({});
    expect(r.ok).toBe(true);
  });

  it('document complet et bien formé accepté', () => {
    const r = parseRemoteAppData({
      workouts: [{ id: 'law', name: 'LA Règle', items: [{ id: 's0', name: 'Pompes', reps: 10, rest: 25, sets: 3, timed: false, dur: 0 }] }],
      days: { '2026-07-01': { water: 2, note: 'ok' } },
      updatedAt: 1751000000000,
      anniversaries: [],
    });
    expect(r.ok).toBe(true);
  });

  it('document ancien sans les champs récents (anniversaries, updatedAt) accepté', () => {
    const r = parseRemoteAppData({ workouts: [], habits: [] });
    expect(r.ok).toBe(true);
  });

  it('champs inconnus (ajout futur) acceptés (passthrough)', () => {
    const r = parseRemoteAppData({ champFutur: 'valeur', nested: { a: 1 } });
    expect(r.ok).toBe(true);
  });

  it('days avec valeur null pour un jour accepté', () => {
    const r = parseRemoteAppData({ days: { '2026-07-01': null } });
    expect(r.ok).toBe(true);
  });
});

describe('parseRemoteAppData — cas corrompus rejetés', () => {
  it('days est une chaîne au lieu d\'un objet → rejeté', () => {
    const r = parseRemoteAppData({ days: 'oops' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('days');
  });

  it('days contient une entrée de type chaîne (pas un objet) → rejeté', () => {
    const r = parseRemoteAppData({ days: { '2026-07-01': 'corrompu' } });
    expect(r.ok).toBe(false);
  });

  it('updatedAt est une chaîne au lieu d\'un nombre → rejeté', () => {
    const r = parseRemoteAppData({ updatedAt: '1751000000000' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('updatedAt');
  });

  it('workouts est un objet au lieu d\'un tableau → rejeté', () => {
    const r = parseRemoteAppData({ workouts: { id: 'law' } });
    expect(r.ok).toBe(false);
  });

  it('workouts[].items contient un exercice avec reps en chaîne → rejeté', () => {
    const r = parseRemoteAppData({
      workouts: [{ id: 'law', name: 'X', items: [{ id: 's0', name: 'Pompes', reps: '10', rest: 25, sets: 3, timed: false, dur: 0 }] }],
    });
    expect(r.ok).toBe(false);
  });

  it('la racine elle-même n\'est pas un objet (tableau, null, primitive) → rejeté', () => {
    expect(parseRemoteAppData([]).ok).toBe(false);
    expect(parseRemoteAppData(null).ok).toBe(false);
    expect(parseRemoteAppData('oops').ok).toBe(false);
    expect(parseRemoteAppData(42).ok).toBe(false);
  });
});
