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
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: C.surf2 }}
      >
        <Icon name="minus" size={14} />
      </button>
      <span className="tabular-nums w-12 text-center font-semibold">{value}</span>
      <button
        onClick={() => onChange(value + step)}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: C.surf2 }}
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}
