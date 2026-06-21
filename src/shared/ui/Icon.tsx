import type { CSSProperties } from 'react';
import { ICON_PATHS, type IconName } from './iconPaths';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, color, strokeWidth = 2, fill = 'none', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color, flexShrink: 0, ...style }}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
