import { describe, expect, it } from 'vitest';
import { parseBilanAdjustments } from '../bilanImport';

describe('parseBilanAdjustments', () => {
  it('parse le bloc nominal complet', () => {
    const text = [
      '=== AJUSTEMENTS MA DISCIPLINE ===',
      'train: 2300',
      'recup: 2000',
      'repos: 1750',
      'eau: 2.5',
      'note: Semaine solide, on augmente légèrement les protéines.',
    ].join('\n');
    expect(parseBilanAdjustments(text)).toEqual({
      train: 2300,
      recup: 2000,
      repos: 1750,
      water: 2.5,
      note: 'Semaine solide, on augmente légèrement les protéines.',
    });
  });

  it('tolère accents, majuscules, suffixes kcal/L et virgule décimale', () => {
    const text = 'Séance : 2 400 kcal\nRécupération = 2100kcal\nEAU: 2,25 L';
    expect(parseBilanAdjustments(text)).toEqual({
      train: 2400,
      recup: 2100,
      water: 2.25,
      note: null,
    });
  });

  it('ignore le texte autour du bloc (réponse Claude complète collée)', () => {
    const text =
      'Voici mon analyse détaillée…\nTu progresses bien.\n\n' +
      '=== AJUSTEMENTS MA DISCIPLINE ===\nrepos: 1800\nnote: RAS';
    const r = parseBilanAdjustments(text);
    expect(r?.repos).toBe(1800);
    expect(r?.note).toBe('RAS');
    expect(r?.train).toBeUndefined();
  });

  it('rejette les valeurs hors plage plausible', () => {
    expect(parseBilanAdjustments('train: 120')).toBeNull(); // < 800 kcal
    expect(parseBilanAdjustments('eau: 40')).toBeNull(); // > 10 L
    const mixed = parseBilanAdjustments('train: 120\nrepos: 1800');
    expect(mixed).toEqual({ repos: 1800, note: null });
  });

  it('retourne null si rien d’exploitable', () => {
    expect(parseBilanAdjustments('bonjour, super bilan !')).toBeNull();
    expect(parseBilanAdjustments('')).toBeNull();
  });
});
