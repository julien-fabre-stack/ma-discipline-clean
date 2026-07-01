import { describe, it, expect } from 'vitest';
import { migrateData, defaultAppData, DEFAULT_RDV_TYPES } from '../defaults';
import { addDays, dateKey } from '../utils';
import type { AppData, Exercise, WeekTemplate } from '@/types';

describe('migrateData — document vide', () => {
  it('{} produit un état complet équivalent aux défauts', () => {
    const m = migrateData({});
    const d = defaultAppData();
    expect(m.workouts.length).toBe(d.workouts.length);
    expect(m.workouts[0].id).toBe('law');
    expect(m.habits.length).toBe(d.habits.length);
    expect(m.agenda.rdvTypes.length).toBe(DEFAULT_RDV_TYPES.length);
    expect(m.anniversaries).toEqual([]);
    expect(m.updatedAt).toBe(0);
    expect(m.days).toEqual({});
  });
});

describe('migrateData — legacy session → workouts', () => {
  // NB : migrateData part de `{ ...defaultAppData(), ...raw }`, et
  // defaultAppData() remplit déjà `workouts` avec la séance par défaut.
  // La branche `session` legacy (`!x.workouts || !x.workouts.length`)
  // n'est donc atteignable QUE si `raw.workouts` est explicitement vide.
  // On fige ce comportement réel plutôt que le comportement supposé.
  it('un document sans `workouts` récupère la séance par défaut (le spread ne vide jamais x.workouts)', () => {
    const session: Exercise[] = [
      { id: 's0', name: 'Pompes', reps: 10, rest: 25, sets: 3, timed: false, dur: 0 },
    ];
    const m = migrateData({ session } as Record<string, unknown>);
    expect(m.workouts).toHaveLength(1);
    expect(m.workouts[0].id).toBe('law');
    // defaultAppData() a déjà peuplé workouts avant que `session` ne soit
    // regardé : la séance par défaut (52 exercices) est utilisée, PAS
    // la session legacy fournie ici.
    expect(m.workouts[0].items.length).toBeGreaterThan(1);
    expect(m.workouts[0].items).not.toEqual(session);
  });

  it('workouts explicitement vide ([]) écrase le défaut → la session legacy est alors utilisée', () => {
    const session: Exercise[] = [
      { id: 's0', name: 'Pompes', reps: 10, rest: 25, sets: 3, timed: false, dur: 0 },
    ];
    const m = migrateData({ workouts: [], session } as unknown as Record<string, unknown>);
    expect(m.workouts).toHaveLength(1);
    expect(m.workouts[0].id).toBe('law');
    expect(m.workouts[0].items).toEqual(session);
  });

  it('workouts existants prioritaires sur la session legacy', () => {
    const workouts = [{ id: 'w9', name: 'Custom', items: [] as Exercise[] }];
    const m = migrateData({ workouts, session: [{ id: 'x' }] } as Record<string, unknown>);
    expect(m.workouts[0].id).toBe('w9');
  });
});

describe('migrateData — weekTemplate', () => {
  it('normalise le modèle mono-séance {jour: id} vers {jour: [id]}', () => {
    const m = migrateData({
      weekTemplate: { 1: 'law', 3: 'law' } as unknown as WeekTemplate,
    });
    expect(m.weekTemplate).toEqual({ 1: ['law'], 3: ['law'] });
  });

  it('supprime les entrées vides (tableau vide, chaîne vide)', () => {
    const m = migrateData({
      weekTemplate: { 1: [], 2: '' as unknown as string[], 3: ['law'] } as unknown as WeekTemplate,
    });
    expect(m.weekTemplate).toEqual({ 3: ['law'] });
  });

  it('weekTemplate absent → gabarit par défaut sur la 1ʳᵉ séance', () => {
    const m = migrateData({});
    const w0 = m.workouts[0].id;
    expect(m.weekTemplate).toEqual({ 1: [w0], 2: [w0], 4: [w0], 5: [w0] });
  });
});

describe('migrateData — drinkfree', () => {
  it('ancien modèle {date, count} → start = date - count jours', () => {
    const m = migrateData({
      drinkfree: { date: '2024-01-10', count: 5 } as unknown as AppData['drinkfree'],
    });
    expect(m.drinkfree.start).toBe(addDays('2024-01-10', -5));
  });

  it('absent → start = aujourd\'hui', () => {
    const m = migrateData({ drinkfree: undefined as unknown as AppData['drinkfree'] });
    expect(m.drinkfree.start).toBe(dateKey());
  });

  it('nouveau modèle {start} conservé tel quel', () => {
    const m = migrateData({ drinkfree: { start: '2025-05-05' } });
    expect(m.drinkfree.start).toBe('2025-05-05');
  });
});

describe('migrateData — agenda / anniversaires', () => {
  it('agenda sans rdvTypes → rdvTypes injectés, reste conservé', () => {
    const agenda = {
      statuses: [{ id: 's', label: 'S', color: '#fff' }],
      activities: [],
      periods: [],
      events: [],
    } as unknown as AppData['agenda'];
    const m = migrateData({ agenda });
    expect(m.agenda.rdvTypes).toHaveLength(DEFAULT_RDV_TYPES.length);
    expect(m.agenda.statuses[0].id).toBe('s');
  });

  it('anniversaries non-tableau → []', () => {
    const m = migrateData({ anniversaries: 'oops' as unknown as AppData['anniversaries'] });
    expect(m.anniversaries).toEqual([]);
  });
});

describe('migrateData — updatedAt (garde de fraîcheur)', () => {
  it.each([undefined, NaN, Infinity, '123' as unknown as number, null as unknown as number])(
    'valeur invalide %p → 0',
    (v) => {
      const m = migrateData({ updatedAt: v as number });
      expect(m.updatedAt).toBe(0);
    }
  );
  it('valeur valide conservée', () => {
    const m = migrateData({ updatedAt: 1751000000000 });
    expect(m.updatedAt).toBe(1751000000000);
  });
});

describe('migrateData — idempotence', () => {
  it('migrer deux fois ≡ migrer une fois', () => {
    const raw = {
      weekTemplate: { 1: 'law' } as unknown as WeekTemplate,
      drinkfree: { date: '2024-01-10', count: 5 } as unknown as AppData['drinkfree'],
    };
    const once = migrateData(raw);
    const twice = migrateData(JSON.parse(JSON.stringify(once)));
    expect(twice).toEqual(once);
  });
});
