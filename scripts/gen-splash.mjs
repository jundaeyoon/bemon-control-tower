import { createCanvas, loadImage } from 'canvas';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const BG = '#FAF8F4';
const LOGO_PATH = join(root, 'public', 'splash-logo.png');
const OUT_DIR = join(root, 'public', 'splash');

// [cssWidth, cssHeight, dpr, deviceLabel]
const DEVICES = [
  [320, 568, 2, 'iphone-se1'],
  [375, 667, 2, 'iphone-8'],
  [414, 736, 3, 'iphone-8-plus'],
  [375, 812, 3, 'iphone-x'],
  [414, 896, 2, 'iphone-xr'],
  [414, 896, 3, 'iphone-11-pro-max'],
  [390, 844, 3, 'iphone-12-13-14'],
  [393, 852, 3, 'iphone-14-15-16-pro'],
  [428, 926, 3, 'iphone-12-13-14-pro-max'],
  [430, 932, 3, 'iphone-14-15-16-pro-max'],
  [744, 1133, 2, 'ipad-mini'],
  [768, 1024, 2, 'ipad-9-7'],
  [810, 1080, 2, 'ipad-10-2'],
  [820, 1180, 2, 'ipad-air-10-9'],
  [834, 1194, 2, 'ipad-pro-11'],
  [834, 1112, 2, 'ipad-pro-10-5'],
  [1024, 1366, 2, 'ipad-pro-12-9'],
];

mkdirSync(OUT_DIR, { recursive: true });

const logo = await loadImage(readFileSync(LOGO_PATH));
const links = [];

for (const [cw, ch, dpr, label] of DEVICES) {
  const w = cw * dpr;
  const h = ch * dpr;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  const logoSize = Math.round(Math.min(w, h) * 0.42);
  const x = (w - logoSize) / 2;
  const y = (h - logoSize) / 2;
  ctx.drawImage(logo, x, y, logoSize, logoSize);

  const filename = `apple-splash-${label}-${w}x${h}.png`;
  writeFileSync(join(OUT_DIR, filename), canvas.toBuffer('image/png'));

  links.push(
    `    <link rel="apple-touch-startup-image" href="/splash/${filename}" media="(device-width: ${cw}px) and (device-height: ${ch}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)">`
  );

  console.log(`generated ${filename}`);
}

writeFileSync(join(OUT_DIR, '_links.html'), links.join('\n') + '\n');
console.log(`\n${links.length} splash images generated -> public/splash/`);
console.log('Link tags written to public/splash/_links.html');
