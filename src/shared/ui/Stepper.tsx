import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from './Icon';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
}

export function Stepper({ value, onChange, step = 1, min = 0 }: StepperProps) {
  const { C } = useTheme();
  // État optimiste interne : l'affichage et le prochain calcul partent de la
  // dernière valeur locale (ref), pas de la prop `value` qui peut retarder le
  // temps qu'un aller-retour Firestore se fasse. Sans ça, deux « + » rapprochés
  // repartent de la même base et ne comptent qu'une fois.
  const [local, setLocal] = useState(value);
  const ref = useRef(value);

  // Resynchronise quand la valeur externe change réellement (reset, sync…).
  useEffect(() => {
    ref.current = value;
    setLocal(value);
  }, [value]);

  const bump = (delta: number) => {
    const next = Math.max(min, ref.current + delta);
    ref.current = next;
    setLocal(next);
    onChange(next);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => bump(-step)}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: C.surf2 }}
      >
        <Icon name="minus" size={14} />
      </button>
      <span className="tabular-nums w-12 text-center font-semibold">{local}</span>
      <button
        onClick={() => bump(step)}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: C.surf2 }}
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}
