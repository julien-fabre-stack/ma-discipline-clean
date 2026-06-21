import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from './Icon';

export interface SwipeRowProps {
  children: ReactNode;
  onDelete: () => Promise<boolean>;
  style?: CSSProperties;
}

const MAXP = 84;

export function SwipeRow({ children, onDelete, style }: SwipeRowProps) {
  const { C } = useTheme();
  const [dx, setDx] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const locked = useRef(false);

  const onStart = (x: number, y: number) => {
    startX.current = x;
    startY.current = y;
    dragging.current = true;
    locked.current = false;
  };

  const onMove = (x: number, y: number) => {
    if (!dragging.current) return;
    const ddx = x - startX.current;
    const ddy = y - startY.current;
    if (!locked.current) {
      if (Math.abs(ddx) > 8 || Math.abs(ddy) > 8) {
        locked.current = true;
        if (Math.abs(ddy) > Math.abs(ddx)) {
          dragging.current = false;
          return;
        }
      }
    }
    let nd = ddx;
    if (nd > 0) nd = nd * 0.25; // léger rebond à droite
    if (nd < -MAXP - 30) nd = -MAXP - 30 + (nd + MAXP + 30) * 0.2;
    setDx(nd);
  };

  const onEnd = () => {
    if (!dragging.current) {
      if (dx < -MAXP * 0.6) setDx(-MAXP);
      else setDx(0);
      return;
    }
    dragging.current = false;
    if (dx < -MAXP * 0.6) setDx(-MAXP);
    else setDx(0);
  };

  const handleDelete = async () => {
    const ok = await onDelete();
    if (!ok) setDx(0);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          background: C.ember,
        }}
      >
        <button
          onClick={handleDelete}
          style={{
            width: MAXP,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            background: 'transparent',
            border: 'none',
          }}
        >
          <Icon name="trash" size={20} color="#fff" />
        </button>
      </div>
      <div
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging.current ? 'none' : 'transform 260ms cubic-bezier(.22,1,.36,1)',
          position: 'relative',
          background: C.surf,
          touchAction: 'pan-y',
        }}
        onTouchStart={(e) => onStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => onMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={onEnd}
      >
        {children}
      </div>
    </div>
  );
}
