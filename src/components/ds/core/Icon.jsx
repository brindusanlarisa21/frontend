/**
 * TripSplit icon set — Lucide geometry (ISC licensed), inlined so the
 * design system ships zero external icon dependencies.
 * 24px grid, round caps/joins, friendly 1.75 stroke weight.
 */

const PATHS = {
  // navigation / chrome
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h12.5A1.5 1.5 0 0 1 19 6.5V8" />
      <path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2Z" />
      <circle cx="16.5" cy="13.5" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  message: (
    <path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3.5V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M21 20c0-2.6-1.6-4.6-4-5.2" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.1a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.1-2.9H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.1-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.1V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9Z" />
    </>
  ),
  // actions
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 6.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  arrowDownLeft: <path d="M17 7 7 17M16 17H7V8" />,
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 4.5h8L17.5 7h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V5.5A1.5 1.5 0 0 1 6.5 4H15" />
    </>
  ),
  // travel
  pin: (
    <>
      <path d="M12 21c5-5 7.5-8.6 7.5-11.5A7.5 7.5 0 0 0 4.5 9.5C4.5 12.4 7 16 12 21Z" />
      <circle cx="12" cy="9.5" r="2.6" />
    </>
  ),
  plane: <path d="M10.5 14 4 16l1-3-3.5-2 4-1 3-7c.4-.9 1.6-.9 2 0l3 7 4 1-3.5 2 1 3-6.5-2" />,
  bed: (
    <>
      <path d="M3 7v12M3 12h18a0 0 0 0 1 0 0v7M21 19v-5a2 2 0 0 0-2-2" />
      <path d="M3 12V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
    </>
  ),
  utensils: <path d="M5 3v7a2 2 0 0 0 4 0V3M7 11v10M17 3c-1.7 0-3 2-3 5s1 4 3 4v9" />,
  ticket: (
    <>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5v2a2 2 0 0 0 0 3v2A1.5 1.5 0 0 1 19.5 17h-15A1.5 1.5 0 0 1 3 15.5v-2a2 2 0 0 0 0-3Z" />
      <path d="M14 7v10" strokeDasharray="1.5 2.5" />
    </>
  ),
  car: (
    <>
      <path d="M4 13.5 5.5 8a2 2 0 0 1 1.9-1.4h9.2A2 2 0 0 1 18.5 8L20 13.5" />
      <path d="M3 13.5h18v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H6.5v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
      <path d="M6.5 16h1M16.5 16h1" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
  // money
  receipt: (
    <>
      <path d="M5 3.5h14v17l-2.3-1.4-2.3 1.4-2.3-1.4-2.3 1.4-2.3-1.4L5 20.5Z" />
      <path d="M8.5 8h7M8.5 12h7" />
    </>
  ),
  creditCard: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M6.5 14.5h3" />
    </>
  ),
  split: <path d="M5 19V5M5 8h6a2 2 0 0 1 2 2v9M13 13h6M16 10l3 3-3 3" />,
  trendingUp: (
    <>
      <path d="m4 16 5-5 3 3 7-7" />
      <path d="M15 7h5v5" />
    </>
  ),
  dollar: <path d="M12 2v20M16.5 6.5c0-1.9-2-3-4.5-3s-4.5 1.1-4.5 3.2S9.5 9.5 12 10s4.5 1.2 4.5 3.4S14.5 16.5 12 16.5s-4.5-1.1-4.5-3" />,
  // misc / status
  heart: <path d="M12 20S3.5 14.5 3.5 8.7A4.2 4.2 0 0 1 12 6.5a4.2 4.2 0 0 1 8.5 2.2C20.5 14.5 12 20 12 20Z" />,
  thumbsUp: <path d="M7 10v10H4V10ZM7 10l4-7c1.4 0 2.4 1.2 2.1 2.6L12.5 9H19a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 18 19H7" />,
  star: <path d="m12 3 2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.5l1.1-6L3.4 9.3l6-.8Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2.5 20h19Z" />
      <path d="M12 9.5v5M12 17.5h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  logOut: (
    <>
      <path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
      <path d="M16 8l4 4-4 4M9 12h11" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17Z" />
      <path d="m13.5 6.5 3 3" />
    </>
  ),
  filter: <path d="M3 5h18l-7 8v6l-4-2v-4Z" />,
};

function Icon({
  name,
  size = 22,
  strokeWidth = 1.75,
  color = 'currentColor',
  style,
  className,
  ...rest
}) {
  const d = PATHS[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={{ flex: 'none', display: 'block', ...style }}
      {...rest}
    >
      {d || PATHS.info}
    </svg>
  );
}

export default Icon;
