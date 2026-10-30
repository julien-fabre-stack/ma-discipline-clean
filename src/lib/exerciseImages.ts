/**
 * Détermine quel fichier image illustrer pour un exercice donné, à partir
 * de son nom. Porté à l'identique depuis la v1 (exerciseImageFile).
 */

const normEx = (s: string | undefined): string =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function exerciseImageFile(name: string | undefined): string | null {
  const n = normEx(name);
  if (!n) return null;
  if (n.includes('burpee')) return 'burpee-pompe.jpg';
  if (n.includes('diamant')) return 'pompes-diamant.jpg';
  // Testés AVANT « pompe » et « quadrup » : « Pompes pike » doit afficher le
  // pike, et le bird dog ne doit pas tomber sur l'image du bear crawl.
  if (n.includes('pike') || n.includes('pique')) return 'pike-push-up.jpg';
  if (n.includes('bird') || (n.includes('chien') && n.includes('oiseau'))) return 'bird-dog.jpg';
  if (n.includes('glute') || n.includes('bridge') || /\bpont\b/.test(n) || n.includes('bassin'))
    return 'glute-bridge.jpg';
  if (n.includes('pompe')) {
    if ((n.includes('torse') || n.includes('buste')) && n.includes('surelev'))
      return 'pompes-torse-souleve.jpg';
    if ((n.includes('jambe') || n.includes('pied')) && n.includes('surelev'))
      return 'pompes-jambes-surelevees.jpg';
    return 'pompes-normales.jpg';
  }
  if (n.includes('traction')) {
    if (n.includes('supination')) return 'tractions-supination.jpg';
    if (n.includes('milieu') || n.includes('neutre')) return 'tractions-prise-milieu.jpg';
    return 'tractions-pronation.jpg';
  }
  if (n.includes('maker')) return 'maker-press.jpg';
  if (n.includes('coup')) {
    if (n.includes('pied')) return 'coups-de-pied.jpg';
    if (n.includes('poing')) return 'coups-de-poing.jpg';
  }
  if (n.includes('roue') || n.includes('abdo')) return 'roue-abdos.jpg';
  if (n.includes('gainage') || n.includes('planche')) return 'gainage.jpg';
  if (n.includes('battle') || n.includes('corde')) return 'battle-rope.jpg';
  if (n.includes('jumping') || n.includes('jack')) return 'jumping-jack.jpg';
  if (n.includes('squat')) {
    if (n.includes('deep') || n.includes('profond')) return 'deep-squat.jpg';
    return 'squat.jpg';
  }
  if (n.includes('wall') || n.includes('chaise')) return 'wall-sit.jpg';
  if (n.includes('mountain') || n.includes('grimpeur')) return 'mountain-climbers.jpg';
  if (n.includes('shoulder') || n.includes('epaule')) return 'shoulder-tap.jpg';
  if (n.includes('bear') || n.includes('ours') || n.includes('quadrup')) return 'bear-crawling.jpg';
  if (n.includes('medit')) return 'meditation.jpg';
  return null;
}

const EX_IMG_BASE = `${import.meta.env.BASE_URL}exercices/`;

export function exerciseImageSrc(name: string | undefined): string | null {
  const f = exerciseImageFile(name);
  return f ? EX_IMG_BASE + f : null;
}
