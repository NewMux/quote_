import React from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { SCREEN_H, SCREEN_W } from '../../components/Phone';
import { FONT } from '../../theme';

// Building blocks for the screens in screens.tsx, rebuilt from the app's own source (the tokens in
// src/lib/theme.ts, the Tailwind text styles, and the list / card / button components) in iOS
// points, light mode. Inter stands in for SF Pro.

export const LIGHT = {
  grouped: '#F2F2F7',
  card: '#FFFFFF',
  label: '#111827',
  secondary: '#5F6368',
  tertiary: '#8A8A8E',
  chevron: '#B8B8BD',
  separator: '#E5E5EA',
  secondaryFill: '#EFEFF0',
  field: '#D1D1D6',
  tint: '#157A63',
  brand: '#157A63',
  destructive: '#D70015',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
} as const;

export const STATUS = {
  draft: { bg: '#EEF1F0', fg: '#4B5563', label: 'Draft', icon: 'pencil' },
  issued: { bg: '#FDECC8', fg: '#8A5A06', label: 'Issued', icon: 'paperplane' },
  partially_paid: { bg: '#FCE4C4', fg: '#A14B08', label: 'Partially Paid', icon: 'clock' },
  paid: { bg: '#DFF6E8', fg: '#17784A', label: 'Paid', icon: 'checkCircle' },
  overdue: { bg: '#FCE2E2', fg: '#B3261E', label: 'Overdue', icon: 'exclaim' },
} as const satisfies Record<string, { bg: string; fg: string; label: string; icon: IconName }>;
export type StatusKey = keyof typeof STATUS;

/** The app's avatar palette (src/lib/theme.ts). */
export const AVATAR_COLORS = ['#157A63', '#A14B08', '#1D5FC4', '#6D3FD1', '#B3261E', '#0B6E8A', '#7A5A06', '#4B5563'];

export const Screen: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = LIGHT.grouped }) => (
  <div style={{ position: 'absolute', inset: 0, width: SCREEN_W, height: SCREEN_H, background: bg, fontFamily: FONT, color: LIGHT.label, overflow: 'hidden' }}>
    {children}
  </div>
);

/** The Liquid Glass material: a translucent, blurred, lightly lit capsule. */
export const glass = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.74)',
  backdropFilter: 'blur(18px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.8)',
  boxShadow: '0 6px 20px rgba(0,0,0,0.10), inset 0 0 0 0.5px rgba(255,255,255,0.9)',
  ...extra,
});

export const GlassButton: React.FC<{ icon: IconName; prominent?: boolean; size?: number }> = ({ icon, prominent, size = 44 }) => (
  <div
    style={{
      ...glass(prominent ? { background: LIGHT.brand, backdropFilter: 'none', boxShadow: '0 6px 16px rgba(21,122,99,0.35)' } : undefined),
      width: size,
      height: size,
      borderRadius: size / 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Icon name={icon} size={19} weight={2.3} color={prominent ? '#fff' : LIGHT.label} />
  </div>
);

/** A tab root's navigation bar: glass buttons on the right, the large title below. */
export const LargeTitleBar: React.FC<{ title: string; buttons: IconName[] }> = ({ title, buttons }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 4 }}>
    <div style={{ position: 'absolute', top: 58, right: 16, display: 'flex', gap: 10 }}>
      {buttons.map((b) => (
        <GlassButton key={b} icon={b} />
      ))}
    </div>
    <div style={{ position: 'absolute', top: 108, left: 20, fontSize: 34, lineHeight: '41px', fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
  </div>
);

const TABS: { name: IconName; label: string }[] = [
  { name: 'house', label: 'Summary' },
  { name: 'doc', label: 'Documents' },
  { name: 'people', label: 'Clients' },
  { name: 'gear', label: 'Settings' },
];

/** The iOS 26 system tab bar: a floating glass capsule, the selected tab in a darker pill. */
export const TabBar: React.FC<{ active: number }> = ({ active }) => (
  <>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, background: 'linear-gradient(to bottom, rgba(242,242,247,0) 0%, rgba(242,242,247,0.92) 62%)', zIndex: 5 }} />
    <div style={{ position: 'absolute', left: 21, right: 21, bottom: 27, height: 64, borderRadius: 32, padding: 4, display: 'flex', zIndex: 6, ...glass({ background: 'rgba(250,250,252,0.78)' }) }}>
      {TABS.map((t, i) => (
        <div
          key={t.label}
          style={{
            flex: 1,
            borderRadius: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            background: i === active ? 'rgba(120,120,128,0.16)' : 'transparent',
            color: i === active ? LIGHT.tint : '#5F6368',
          }}
        >
          <Icon name={t.name} size={23} weight={i === active ? 2.2 : 1.9} color={i === active ? LIGHT.tint : '#5F6368'} />
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.01em' }}>{t.label}</div>
        </div>
      ))}
    </div>
    <div style={{ position: 'absolute', bottom: 8, left: (SCREEN_W - 134) / 2, width: 134, height: 5, borderRadius: 3, background: '#111', zIndex: 7 }} />
  </>
);

export const Segmented: React.FC<{ values: string[]; selected: number }> = ({ values, selected }) => (
  <div style={{ position: 'relative', height: 36, borderRadius: 18, background: 'rgba(118,118,128,0.12)', display: 'flex', padding: 2 }}>
    {values.map((v, i) => (
      <div
        key={v}
        style={{
          flex: 1,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: i === selected ? 600 : 500,
          background: i === selected ? '#FFFFFF' : 'transparent',
          boxShadow: i === selected ? '0 2px 6px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)' : 'none',
        }}
      >
        {v}
      </div>
    ))}
  </div>
);

/** An inset-grouped section: optional header, a 26 pt rounded card, optional footer. */
export const Section: React.FC<{ header?: string; footer?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ header, footer, children, style }) => (
  <div style={{ marginBottom: 32, ...style }}>
    {header ? <div style={{ fontSize: 13, lineHeight: '18px', color: LIGHT.secondary, padding: '0 16px', marginBottom: 8 }}>{header}</div> : null}
    <div style={{ background: LIGHT.card, borderRadius: 26, overflow: 'hidden' }}>{children}</div>
    {footer ? <div style={{ fontSize: 13, lineHeight: '18px', color: LIGHT.secondary, padding: '0 16px', marginTop: 8 }}>{footer}</div> : null}
  </div>
);

export const Hairline: React.FC<{ inset: number }> = ({ inset }) => <div style={{ marginLeft: inset, height: 0.5, background: LIGHT.separator }} />;

export const Chevron: React.FC = () => <Icon name="chevron" size={14} weight={2.6} color={LIGHT.chevron} />;

/** A circle in a system color with a white glyph: the filled SF Symbols (checkmark.circle.fill…). */
export const SymbolFill: React.FC<{ kind: 'check' | 'clock' | 'exclaim' | 'pencil' | 'plane'; color: string; size?: number }> = ({ kind, color, size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" style={{ display: 'block', flexShrink: 0 }}>
    <circle cx="10" cy="10" r="10" fill={color} />
    <g fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {kind === 'check' ? <path d="m5.6 10.4 3 3 5.8-6.4" /> : null}
      {kind === 'clock' ? <path d="M10 5.2V10l3.2 1.9" /> : null}
      {kind === 'exclaim' ? (
        <>
          <path d="M10 5.2v5.6" />
          <circle cx="10" cy="14.3" r="0.4" fill="#fff" />
        </>
      ) : null}
      {kind === 'pencil' ? <path d="m6.4 13.6.5-2.3 5.2-5.2a1.3 1.3 0 0 1 1.8 1.8l-5.2 5.2-2.3.5Z" strokeWidth="1.5" /> : null}
      {kind === 'plane' ? <path d="m14.6 5.4-9 3.6 3.6 1.2 1.2 3.6 4.2-8.4Z" strokeWidth="1.4" /> : null}
    </g>
  </svg>
);

export const Avatar: React.FC<{ name: string; color: string; size?: number }> = ({ name, color, size = 36 }) => {
  const parts = name.replace(/&/g, ' ').trim().split(/\s+/).filter(Boolean);
  const initials = parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

/** The app's Button: a capsule, `filled` (brand) or `tinted` (brand at 15%). */
export const AppButton: React.FC<{ label: string; variant: 'filled' | 'tinted'; large?: boolean; icon?: IconName }> = ({ label, variant, large, icon }) => (
  <div
    style={{
      minHeight: large ? 52 : 44,
      borderRadius: 999,
      padding: large ? '14px 24px' : '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      background: variant === 'filled' ? LIGHT.brand : 'rgba(21,122,99,0.15)',
      color: variant === 'filled' ? '#fff' : LIGHT.tint,
      fontSize: large ? 17 : 15,
      fontWeight: 600,
    }}
  >
    {icon ? <Icon name={icon} size={large ? 19 : 17} weight={2.4} color={variant === 'filled' ? '#fff' : LIGHT.tint} /> : null}
    {label}
  </div>
);
