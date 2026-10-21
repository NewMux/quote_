// Renders the App Store screenshots (1320×2868, iPhone 6.9") and the side-by-side preview strip
// into out/appstore. Set REMOTION_BROWSER to a Chrome / headless-shell path to skip Remotion's
// own browser download.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const SHOTS = [
  ['Store1Create', '01-create'],
  ['Store2Contacts', '02-contacts'],
  ['Store3Sign', '03-sign'],
  ['Store4Pay', '04-pay'],
  ['Store5Paid', '05-paid'],
  ['Store6More', '06-more'],
  ['StoreStrip', 'preview-strip'],
];

mkdirSync('out/appstore', { recursive: true });
const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
for (const [id, file] of SHOTS) {
  execFileSync('npx', ['remotion', 'still', id, `out/appstore/${file}.png`, ...browser], { stdio: 'inherit' });
}
