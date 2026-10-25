import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Inter and Bricolage Grotesque, the brand typeface (both SIL Open Font License), bundled locally
// so renders never depend on the network.
export const fontsReady = Promise.all([
  ...[400, 500, 600, 700, 800, 900].map((weight) =>
    loadFont({ family: 'Inter', url: staticFile(`fonts/Inter-${weight}.woff2`), weight: String(weight) })
  ),
  ...[400, 600, 700, 800].map((weight) =>
    loadFont({ family: 'Bricolage Grotesque', url: staticFile(`fonts/Bricolage-${weight}.woff2`), weight: String(weight) })
  ),
]);
