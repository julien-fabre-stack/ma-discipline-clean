import type { ReactNode } from 'react';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from './Icon';

export interface CollapsibleProps {
  title: string;
  badge?: string | number | null;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function Collapsible({ title, badge, open, onToggle, children }: CollapsibleProps) {
  const { C } = useTheme();
  return (
    <div className="mb-3">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-1.5">
        <span className="text-xs tracking-widest uppercase" style={{ color: C.dim }}>
          {title}
          {badge != null && badge !== '' && <span style={{ color: C.gold }}> · {badge}</span>}
        </span>
        <Icon
          name="down"
          size={14}
          color={C.dim}
          style={{
            transition: 'transform 320ms cubic-bezier(.22,1,.36,1)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 320ms cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div
          style={{
            minHeight: 0,
            overflow: 'hidden',
            opacity: open ? 1 : 0,
            transition: `opacity 220ms ease ${open ? '60ms' : '0ms'}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
