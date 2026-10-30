import { describe, it, expect } from 'vitest';
import { exerciseImageFile } from '../exerciseImages';

describe('exerciseImageFile — nouvelles illustrations', () => {
  it('pike push-up (avant la règle générique « pompe »)', () => {
    expect(exerciseImageFile('Push-up pike')).toBe('pike-push-up.jpg');
    expect(exerciseImageFile('Pike push-up')).toBe('pike-push-up.jpg');
    expect(exerciseImageFile('Pompes pike')).toBe('pike-push-up.jpg');
    expect(exerciseImageFile('Pompes piquées')).toBe('pike-push-up.jpg');
  });
  it('bird dog (avant la règle « quadrupédie » du bear crawl)', () => {
    expect(exerciseImageFile('Bird dog')).toBe('bird-dog.jpg');
    expect(exerciseImageFile('Bird-dog')).toBe('bird-dog.jpg');
    expect(exerciseImageFile('Chien-oiseau')).toBe('bird-dog.jpg');
  });
  it('glute bridge / pont fessier', () => {
    expect(exerciseImageFile('Glute bridge')).toBe('glute-bridge.jpg');
    expect(exerciseImageFile('Pont fessier')).toBe('glute-bridge.jpg');
    expect(exerciseImageFile('Pont')).toBe('glute-bridge.jpg');
    expect(exerciseImageFile('Relevé de bassin')).toBe('glute-bridge.jpg');
  });
  it('les correspondances existantes ne bougent pas', () => {
    expect(exerciseImageFile('Pompes')).toBe('pompes-normales.jpg');
    expect(exerciseImageFile('Pompes diamant')).toBe('pompes-diamant.jpg');
    expect(exerciseImageFile('Bear crawling')).toBe('bear-crawling.jpg');
    expect(exerciseImageFile('Squat')).toBe('squat.jpg');
    expect(exerciseImageFile('Gainage')).toBe('gainage.jpg');
    expect(exerciseImageFile('Exercice inconnu')).toBeNull();
  });
});
