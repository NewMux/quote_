// Renders the App Store screenshots (1320×2868, iPhone 6.9") and the side-by-side preview strip
// into out/appstore. Set REMOTION_BROWSER to a Chrome / headless-shell path to skip Remotion's
// own browser download.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const SHOTS = [
  ['Store1Summary', '01-summary'],
  ['Store2Documents', '02-documents'],
  ['Store3Detail', '03-detail'],
  ['Store4Sign', '04-sign'],
  ['Store5Pay', '05-pay'],
  ['Store6Clients', '06-clients'],
  ['Store7More', '07-more'],
  ['StoreStrip', 'preview-strip'],
];

mkdirSync('out/appstore', { recursive: true });
const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
for (const [id, file] of SHOTS) {
  execFileSync('npx', ['remotion', 'still', id, `out/appstore/${file}.png`, ...browser], { stdio: 'inherit' });
}
