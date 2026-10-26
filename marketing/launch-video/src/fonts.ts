import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Inter, Bricolage Grotesque (the brand typeface), Cairo (Arabic glyphs, for the Arabic promo in
// src/ar) and Instrument Serif (the documentary's captions, src/doc), all SIL Open Font License,
// bundled locally so renders never depend on the network.
export const fontsReady = Promise.all([
  ...[400, 500, 600, 700, 800, 900].map((weight) =>
    loadFont({ family: 'Inter', url: staticFile(`fonts/Inter-${weight}.woff2`), weight: String(weight) })
  ),
  ...[400, 600, 700, 800].map((weight) =>
    loadFont({ family: 'Bricolage Grotesque', url: staticFile(`fonts/Bricolage-${weight}.woff2`), weight: String(weight) })
  ),
  ...[600, 700, 800, 900].map((weight) =>
    loadFont({ family: 'Cairo', url: staticFile(`fonts/Cairo-${weight}.woff2`), weight: String(weight) })
  ),
  loadFont({ family: 'Instrument Serif', url: staticFile('fonts/InstrumentSerif-Regular.woff2'), weight: '400', style: 'normal' }),
  loadFont({ family: 'Instrument Serif', url: staticFile('fonts/InstrumentSerif-Italic.woff2'), weight: '400', style: 'italic' }),
]);
