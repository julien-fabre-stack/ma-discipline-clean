import type { ReactElement } from 'react';

/** Tous les tracés SVG de la v1, portés à l'identique. */
export const ICON_PATHS: Record<string, ReactElement> = {
  play: <path d="M7 4 L20 12 L7 20 Z" fill="currentColor" stroke="none" />,
  pause: (
    <g fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </g>
  ),
  check: <path d="M20 6 L9 17 L4 12" />,
  plus: (
    <g>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </g>
  ),
  minus: <path d="M5 12h14" />,
  x: (
    <g>
      <path d="M18 6 L6 18" />
      <path d="M6 6 L18 18" />
    </g>
  ),
  skip: (
    <g>
      <path d="M5 4 L15 12 L5 20 Z" fill="currentColor" stroke="none" />
      <path d="M19 5v14" />
    </g>
  ),
  flame: (
    <path
      d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 1-2-1-4-1-8z"
      fill="currentColor"
      stroke="none"
    />
  ),
  trophy: (
    <g>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v6a5 5 0 0 1-10 0z" />
      <path d="M5 5H3v1a3 3 0 0 0 3 3" />
      <path d="M19 5h2v1a3 3 0 0 1-3 3" />
    </g>
  ),
  dumbbell: (
    <g>
      <path d="M6 7v10" />
      <path d="M9 5v14" />
      <path d="M15 5v14" />
      <path d="M18 7v10" />
      <path d="M9 12h6" />
    </g>
  ),
  apple: (
    <path
      d="M12 7c-2-3-7-2-7 3 0 4 3 9 7 9s7-5 7-9c0-5-5-6-7-3z"
      fill="currentColor"
      stroke="none"
    />
  ),
  calendar: (
    <g>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M9 15l2 2 4-4" />
    </g>
  ),
  gear: (
    <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </g>
  ),
  drop: (
    <path d="M12 3s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10z" fill="currentColor" stroke="none" />
  ),
  search: (
    <g>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </g>
  ),
  trash: (
    <g>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </g>
  ),
  logout: (
    <g>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </g>
  ),
  user: (
    <g>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </g>
  ),
  download: (
    <g>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </g>
  ),
  palette: (
    <g>
      <path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2 0-1.5 1-2 2-2h1a4 4 0 0 0 4-4c0-5-4-8-9-8z" />
      <circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
    </g>
  ),
  up: <path d="M18 15l-6-6-6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  left: <path d="M15 18l-6-6 6-6" />,
  right: <path d="M9 18l6-6-6-6" />,
  edit: (
    <g>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </g>
  ),
  copy: (
    <g>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </g>
  ),
  help: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9.3a2.8 2.8 0 1 1 4.4 2.6c-.9.5-1.6 1-1.6 2.1" />
      <path d="M12 17.3h.01" />
    </g>
  ),
  cake: (
    <g>
      <path d="M4 20h16" />
      <path d="M4 20v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" />
      <path d="M4 15c1.2 0 1.2 1 2.4 1s1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1 1.2 1 2.4 1 1.2-1 2.4-1" />
      <path d="M12 8.5V6" />
      <path d="M12 4.2c.6.5.9 1 .9 1.5a.9.9 0 0 1-1.8 0c0-.5.3-1 .9-1.5Z" fill="currentColor" stroke="none" />
    </g>
  ),
};

export type IconName = keyof typeof ICON_PATHS;
