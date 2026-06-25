import { useEffect, useRef, useState } from 'react';

const BG_FILES = ['bg1.webp', 'bg2.webp'];

function pickFile(seed: string | number): string {
  const idx = typeof seed === 'number'
    ? seed % BG_FILES.length
    : Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % BG_FILES.length;
  return `${import.meta.env.BASE_URL}backgrounds/${BG_FILES[idx]}`;
}

export function BackgroundDecor({ seed }: { seed: string | number }) {
  const [src, setSrc] = useState(() => pickFile(seed));
  const prevSeed = useRef(seed);

  useEffect(() => {
    if (seed === prevSeed.current) return;
    prevSeed.current = seed;
    setSrc(pickFile(seed));
  }, [seed]);

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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.22,
        }}
      />
    </div>
  );
}
