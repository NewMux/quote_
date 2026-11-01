// Renders the App Store screenshots (1320×2868, iPhone 6.9") and the side-by-side preview strip
// into out/appstore (English) and out/appstore-ar (Arabic). Pass `en` or `ar` to render just one. Set REMOTION_BROWSER to a Chrome / headless-shell path to skip Remotion's
// own browser download.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const FILES = [
  ['1Summary', '01-summary'],
  ['2Documents', '02-documents'],
  ['3Detail', '03-detail'],
  ['4Sign', '04-sign'],
  ['5Pay', '05-pay'],
  ['6Clients', '06-clients'],
  ['7More', '07-more'],
];
const SETS = {
  en: { dir: 'out/appstore', shots: FILES.map(([id, file]) => [`Store${id}`, file]), strip: 'StoreStrip' },
  ar: { dir: 'out/appstore-ar', shots: FILES.map(([id, file]) => [`StoreAr${id}`, file]), strip: 'StoreStripAr' },
};

const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
const only = process.argv[2];
for (const [lang, { dir, shots, strip }] of Object.entries(SETS)) {
  if (only && only !== lang) continue;
  mkdirSync(dir, { recursive: true });
  for (const [id, file] of [...shots, [strip, 'preview-strip']]) {
    execFileSync('npx', ['remotion', 'still', id, `${dir}/${file}.png`, ...browser], { stdio: 'inherit' });
  }
}
