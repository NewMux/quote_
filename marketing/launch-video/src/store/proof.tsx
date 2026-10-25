import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Phone } from '../components/Phone';
import { ClientsScreen, DetailScreen, DocumentsScreen, SignScreen, SummaryScreen } from './app/screens';

const SCREENS = [SummaryScreen, DocumentsScreen, DetailScreen, SignScreen, ClientsScreen];

/** Dev aid: every rebuilt app screen side by side, to check them against the real app. */
export const AppProof: React.FC = () => (
  <AbsoluteFill style={{ background: '#D8D8DE' }}>
    {SCREENS.map((S, i) => (
      <Phone key={i} width={640} lightScreen shadow="0 30px 60px rgba(0,0,0,0.25)" style={{ left: 40 + i * 680, top: 50 }}>
        <S />
      </Phone>
    ))}
  </AbsoluteFill>
);
