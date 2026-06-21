import type { CSSProperties, SyntheticEvent } from 'react';
import { exerciseImageSrc } from '@/lib/exerciseImages';

export interface ExerciseImgProps {
  name: string;
  className?: string;
  style?: CSSProperties;
}

function handleImgError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  const cur = img.src;
  if (cur.endsWith('.png')) {
    img.src = cur.replace('.png', '.jpg');
  } else if (cur.endsWith('.jpg')) {
    img.src = cur.replace('.jpg', '.png');
  } else {
    img.style.display = 'none';
    return;
  }
  img.onerror = () => {
    img.style.display = 'none';
  };
}

export function ExerciseImg({ name, className, style }: ExerciseImgProps) {
  const src = exerciseImageSrc(name);
  if (!src) return null;
  return <img src={src} alt="" className={className} style={style} onError={handleImgError} />;
}
