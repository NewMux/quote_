import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Inter (SIL Open Font License), bundled locally so renders never depend on the network.
export const fontsReady = Promise.all(
  [400, 500, 600, 700, 800, 900].map((weight) =>
    loadFont({ family: 'Inter', url: staticFile(`fonts/Inter-${weight}.woff2`), weight: String(weight) })
  )
);
