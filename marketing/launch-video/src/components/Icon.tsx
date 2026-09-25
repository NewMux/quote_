import React from 'react';

/** A small SF Symbols-style icon set, drawn as 24×24 SVG strokes. */
export type IconName =
  | 'house'
  | 'doc'
  | 'people'
  | 'gear'
  | 'plus'
  | 'check'
  | 'checkCircle'
  | 'clock'
  | 'exclaim'
  | 'pencil'
  | 'share'
  | 'mail'
  | 'message'
  | 'folder'
  | 'paperplane'
  | 'repeat'
  | 'bell'
  | 'moon'
  | 'lock'
  | 'photo'
  | 'arrowRight'
  | 'chevron'
  | 'signature'
  | 'download'
  | 'xmark';

const PATHS: Record<IconName, React.ReactNode> = {
  house: <path d="M3.5 11 12 4l8.5 7M6 9.5V20h4.5v-5.5h3V20H18V9.5" />,
  doc: (
    <>
      <path d="M6.5 3h7.5l4.5 4.5V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M13.5 3v5h5M8.5 12.5h7M8.5 16h7" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
      <circle cx="16.5" cy="9" r="2.6" />
      <path d="M16.5 14c2.4 0 4.2 1.4 4.6 4.5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.8 2.8L16.2 9.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  exclaim: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.2v.3" />
    </>
  ),
  pencil: <path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5 4 20ZM14 6.5l3.5 3.5" />,
  share: <path d="M12 3v12M8 7l4-4 4 4M7 10.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.5a1 1 0 0 0-1-1h-1" />,
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  message: <path d="M12 4c5 0 9 3.2 9 7.3s-4 7.2-9 7.2c-1 0-2-.1-2.9-.4L5 20l1-3.4C4.2 15.3 3 13.4 3 11.3 3 7.2 7 4 12 4Z" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2.2h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
  paperplane: <path d="M21 3 3 10.5l7 2.5 2.5 7L21 3ZM10 13l5-5" />,
  repeat: <path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19M16 3l3 3-3 3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5M8 21l-3-3 3-3" />,
  bell: <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15L6 16.5ZM10 20.5a2 2 0 0 0 4 0" />,
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  photo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.7" />
      <path d="m3.5 17 5-4.5 3.5 3 3-2.5 5.5 4.5" />
    </>
  ),
  arrowRight: <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  signature: <path d="M3 17c2.5-6 4.5-9 6-9 2.5 0-2 9 .5 9 1.5 0 3-4.5 4.5-4.5s0 4.5 1.5 4.5c1 0 2-1.5 3-2.5M3 20.5h18" />,
  download: <path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M5 19.5h14" />,
  xmark: <path d="M6 6l12 12M18 6 6 18" />,
};

export const Icon: React.FC<{ name: IconName; size?: number; color?: string; weight?: number; style?: React.CSSProperties }> = ({
  name,
  size = 24,
  color = 'currentColor',
  weight = 2,
  style,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={weight}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0, ...style }}
  >
    {PATHS[name]}
  </svg>
);
