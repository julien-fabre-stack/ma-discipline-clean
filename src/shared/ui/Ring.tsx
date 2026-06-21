import { useTheme } from '@/shared/theme/ThemeProvider';

export interface RingProps {
  value: number;
  max: number;
  id?: string;
}

export function Ring({ value, max, id = 'g' }: RingProps) {
  const { C } = useTheme();
  const R = 86;
  const CIRC = 2 * Math.PI * R;
  const off = CIRC * (1 - (max ? value / max : 0));
  return (
    <svg width="190" height="190" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.ember} />
          <stop offset="100%" stopColor={C.gold} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r={R} fill="none" stroke={C.surf2} strokeWidth="10" />
      <circle
        cx="100"
        cy="100"
        r={R}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={CIRC}
        strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 0.9s linear' }}
      />
    </svg>
  );
}
