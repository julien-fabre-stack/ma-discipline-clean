import { describe, it, expect } from 'vitest';
import { stripUndefined, decideSnapshot, type SnapshotContext } from '../guards';

describe('stripUndefined', () => {
  it('retire undefined à plat', () => {
    expect(stripUndefined({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' });
  });

  it('conserve null (accepté par Firestore)', () => {
    expect(stripUndefined({ a: null, b: undefined })).toEqual({ a: null });
  });

  it('nettoie récursivement objets et tableaux', () => {
    const input = {
      days: {
        '2026-07-01': { water: undefined, habits: { sport: true } },
      },
      list: [{ x: undefined, y: 1 }, 2, null],
    };
    expect(stripUndefined(input)).toEqual({
      days: { '2026-07-01': { habits: { sport: true } } },
      list: [{ y: 1 }, 2, null],
    });
  });

  it('laisse les primitives intactes', () => {
    expect(stripUndefined(42)).toBe(42);
    expect(stripUndefined('a')).toBe('a');
    expect(stripUndefined(false)).toBe(false);
    expect(stripUndefined(null)).toBe(null);
  });

  it('un tableau contenant undefined garde sa longueur (Firestore n\'a pas d\'undefined en tableau après JSON de toute façon)', () => {
    // map conserve les trous en les visitant : undefined dans un tableau
    // reste undefined — ce cas n'existe pas dans AppData (données issues
    // de JSON), le test documente simplement le comportement.
    const r = stripUndefined([1, undefined, 3] as unknown[]);
    expect(r.length).toBe(3);
  });
});

describe('decideSnapshot — verrou de saisie (localDirty)', () => {
  const base: SnapshotContext = {
    localDirty: false,
    hasLocalData: true,
    localUpdatedAt: 100,
    incomingUpdatedAt: 100,
    fromCache: true,
    hasPendingWrites: false,
  };

  it('saisie en cours + état affiché → ignore-dirty (cache OU serveur)', () => {
    expect(decideSnapshot({ ...base, localDirty: true })).toBe('ignore-dirty');
    expect(decideSnapshot({ ...base, localDirty: true, fromCache: false })).toBe('ignore-dirty');
  });

  it('saisie en cours mais AUCUN état affiché → premier chargement accepté', () => {
    expect(
      decideSnapshot({ ...base, localDirty: true, hasLocalData: false })
    ).toBe('accept');
  });
});

describe('decideSnapshot — garde de fraîcheur', () => {
  const base: SnapshotContext = {
    localDirty: false,
    hasLocalData: true,
    localUpdatedAt: 200,
    incomingUpdatedAt: 100, // snapshot PLUS ANCIEN
    fromCache: true,
    hasPendingWrites: false,
  };

  it('snapshot périmé venant du cache → ignore-stale (pas de re-poussée)', () => {
    expect(decideSnapshot(base)).toBe('ignore-stale');
  });

  it('snapshot périmé avec pendingWrites → ignore-stale', () => {
    expect(
      decideSnapshot({ ...base, fromCache: false, hasPendingWrites: true })
    ).toBe('ignore-stale');
  });

  it('snapshot périmé confirmé SERVEUR → repush-local (auto-guérison)', () => {
    expect(
      decideSnapshot({ ...base, fromCache: false, hasPendingWrites: false })
    ).toBe('repush-local');
  });

  it('snapshot plus récent → accept', () => {
    expect(
      decideSnapshot({ ...base, incomingUpdatedAt: 300 })
    ).toBe('accept');
  });

  it('égalité d\'horodatage → accept (le serveur fait foi à égalité)', () => {
    expect(
      decideSnapshot({ ...base, incomingUpdatedAt: 200 })
    ).toBe('accept');
  });

  it('aucun état local → tout snapshot accepté (démarrage à froid)', () => {
    expect(
      decideSnapshot({ ...base, hasLocalData: false, localUpdatedAt: 0 })
    ).toBe('accept');
  });

  it('documents legacy sans updatedAt (0 des deux côtés) → accept', () => {
    expect(
      decideSnapshot({ ...base, localUpdatedAt: 0, incomingUpdatedAt: 0 })
    ).toBe('accept');
  });
});
