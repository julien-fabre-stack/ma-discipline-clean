import { useEffect, useState } from 'react';
import { useTheme } from '@/shared/theme/ThemeProvider';

/**
 * Fond décoratif estompé, affiché derrière toute l'application.
 * Une image est piochée aléatoirement à chaque changement de `seed`
 * (typiquement le changement d'onglet). Le thème reste au premier plan :
 * l'image est posée en très faible opacité, sous un voile de la couleur de fond.
 *
 * Performance : images WebP optimisées (~7-16 ko), une seule <div> en
 * position fixed, pas de ré-render des onglets.
 */

const BG_FILES = ['bg1.webp', 'bg2.webp'];

export function BackgroundDecor({ seed }: { seed: string | number }) {
  const { C, hexA } = useTheme();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const file = BG_FILES[Math.floor(Math.random() * BG_FILES.length)];
    setSrc(`${import.meta.env.BASE_URL}backgrounds/${file}`);
  }, [seed]);

  if (!src) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Image décorative */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.22,
          transition: 'opacity 600ms ease',
        }}
      />
      {/* Voile léger et uniforme pour garantir la lisibilité du contenu */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: hexA(C.night, 0.45),
        }}
      />
    </div>
  );
}
