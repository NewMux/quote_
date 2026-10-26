import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BRAND_FONT } from '../brand';
import { FONT } from '../theme';
import { DocumentsScreen, SummaryScreen } from './app/screens';
import { ScreenSize } from './app/ui';
import { PAL } from './design';

// How the app would look on the iPhone Duo: four states of the same screen. Sizes come from Apple's
// published pixel specs at 3× (outer 1398×2034 px, inner 2670×1878 px), so the point sizes are
// derived, not official. A mockup, not a simulator capture.
const K = 1.35; // px per point
const OUTER = { w: 466, h: 678 };
const INNER = { w: 890, h: 626 };
const CAP = 720; // PR #7's content width cap
const BEZEL = 18;

const Foldable: React.FC<{ w: number; h: number; radius: number; children: React.ReactNode }> = ({ w, h, radius, children }) => (
  <div style={{ width: w * K + 2 * BEZEL, height: h * K + 2 * BEZEL, borderRadius: radius, background: '#0B0B0D', padding: BEZEL, boxShadow: '0 40px 90px rgba(18,17,43,0.28), inset 0 0 0 2px #2A2A2E' }}>
    <div style={{ position: 'relative', width: w * K, height: h * K, borderRadius: radius - BEZEL, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, transform: `scale(${K})`, transformOrigin: '0 0' }}>{children}</div>
    </div>
  </div>
);

type Cell = { title: string; note: string; w: number; h: number; inset: number; responsiveChart: boolean; kind: 'outer' | 'inner'; letterbox?: boolean };

const cells = (notes: { c: string; d: string }): Cell[] => [
  { title: 'Closed: outer display', note: 'A normal iPhone layout, 466 pt wide. Works today with no changes.', ...OUTER, inset: 16, responsiveChart: false, kind: 'outer' },
  { title: 'Open, today’s build (1.0.2)', note: 'Built with the older SDK, the app shows at a familiar iPhone size (a phone-shaped window; my approximation).', ...INNER, inset: 16, responsiveChart: false, kind: 'inner', letterbox: true },
  { title: 'Open, iOS 27 build, without PR #7', note: notes.c, ...INNER, inset: 16, responsiveChart: false, kind: 'inner' },
  { title: 'Open, iOS 27 build, with PR #7', note: notes.d, ...INNER, inset: 16 + (INNER.w - CAP) / 2, responsiveChart: true, kind: 'inner' },
];

const CELL_W = INNER.w * K + 2 * BEZEL;
const GAP = 90;
const HEAD = 330;
const ROW1 = OUTER.h * K + 2 * BEZEL;
const ROW2 = INNER.h * K + 2 * BEZEL;
const CAPTION = 190;

export const DUO_W = Math.round(2 * CELL_W + 3 * GAP);
export const DUO_H = Math.round(HEAD + ROW1 + CAPTION + GAP + ROW2 + CAPTION + GAP / 2);

export const DuoPreview: React.FC<{ Screen: React.FC; name: string; notes: { c: string; d: string } }> = ({ Screen, name, notes }) => {
  const rows = [ROW1, ROW2];
  const CELLS = cells(notes);
  return (
    <AbsoluteFill style={{ background: PAL.paper, fontFamily: FONT, color: PAL.midnight }}>
      <div style={{ position: 'absolute', left: GAP, top: 90 }}>
        <div style={{ fontFamily: BRAND_FONT, fontSize: 92, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>iPhone Duo: how {name} would look</div>
        <div style={{ fontSize: 33, opacity: 0.62, marginTop: 18, maxWidth: 2500, lineHeight: 1.3 }}>
          A mockup from Apple’s published display sizes (points at 3×, not official), using the app’s real layouts. Not a simulator capture; a real Duo may place the tab bar and navigation differently.
        </div>
      </div>
      {CELLS.map((c, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const left = GAP + col * (CELL_W + GAP);
        const top = HEAD + (row === 0 ? 0 : ROW1 + CAPTION + GAP);
        const deviceW = c.w * K + 2 * BEZEL;
        const letterScale = INNER.h / 852;
        return (
          <div key={c.title} style={{ position: 'absolute', left, top, width: CELL_W }}>
            <div style={{ height: rows[row], display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Foldable w={c.w} h={c.h} radius={c.kind === 'outer' ? 78 : 62}>
                {c.letterbox ? (
                  <div style={{ position: 'absolute', inset: 0, background: '#000', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: 393 * letterScale, height: INNER.h, overflow: 'hidden', borderRadius: 22 }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, width: 393, height: 852, transform: `scale(${letterScale})`, transformOrigin: '0 0' }}>
                        <ScreenSize.Provider value={{ w: 393, h: 852, inset: 16, responsiveChart: false }}>
                          <Screen />
                        </ScreenSize.Provider>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ScreenSize.Provider value={{ w: c.w, h: c.h, inset: c.inset, responsiveChart: c.responsiveChart }}>
                    <Screen />
                  </ScreenSize.Provider>
                )}
              </Foldable>
            </div>
            <div style={{ marginTop: 34, textAlign: 'center', width: Math.max(deviceW, 900), marginLeft: (CELL_W - Math.max(deviceW, 900)) / 2 }}>
              <div style={{ fontFamily: BRAND_FONT, fontSize: 50, fontWeight: 800, letterSpacing: '-0.03em' }}>{c.title}</div>
              <div style={{ fontSize: 30, opacity: 0.66, marginTop: 8, lineHeight: 1.3 }}>{c.note}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const DuoSummary: React.FC = () => (
  <DuoPreview
    Screen={SummaryScreen}
    name="Summary"
    notes={{ c: 'The app fills the 890 pt screen: the period control and the four tiles stretch edge to edge.', d: 'Content stays a 720 pt column, so the tiles keep a phone-like proportion.' }}
  />
);
export const DuoDocuments: React.FC = () => (
  <DuoPreview
    Screen={DocumentsScreen}
    name="Documents"
    notes={{ c: 'The app fills the 890 pt screen: rows stretch edge to edge, so a client’s name and its amount end up far apart.', d: 'Content stays a 720 pt column: names and amounts stay close enough to read across.' }}
  />
);
