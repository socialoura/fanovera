/* Admin icon set — JSX SVG inline */

export const Ic = {
  dashboard: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 13l9-9 9 9M5 11v9a1 1 0 001 1h12a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  cart: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 4h2l2.5 12h11l2-8H6.5M9 20a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  tag: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M20 12L12 20l-9-9V3h8l9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  ),
  layers: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l9 5-9 5-9-5 9-5zm0 9l9 5-9 5-9-5M3 12l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  zap: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  cog: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 5a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  bell: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M18 16v-5a6 6 0 10-12 0v5l-2 2h16l-2-2zM10 21a2 2 0 004 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  mail: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calendar: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  download: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  plus: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ),
  edit: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M16 4l4 4-12 12H4v-4L16 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  trash: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  arrowUp: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrowDown: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  filter: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  refresh: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  more: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  star: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7l3-7z" />
    </svg>
  ),
  drag: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  ),
  external: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M14 4h6v6M20 4l-9 9M10 6H5a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  check: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  x: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  wallet: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 7a2 2 0 012-2h12a2 2 0 012 2v1H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="17" cy="14" r="1.5" fill="currentColor" />
    </svg>
  ),
  chevronRight: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chat: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};
