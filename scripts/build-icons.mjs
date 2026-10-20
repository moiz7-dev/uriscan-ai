import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'assets/icons-source');
const OUT = join(ROOT, 'assets/images');

async function render(svgFile, outFile, size) {
  const svg = readFileSync(join(SRC, svgFile));
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(OUT, outFile));
  console.log(`  ${outFile} (${size}x${size})`);
}

const tasks = [
  ['icon.svg',                'icon.png',                       1024],
  ['android-foreground.svg',  'android-icon-foreground.png',    1024],
  ['android-background.svg',  'android-icon-background.png',    1024],
  ['android-monochrome.svg',  'android-icon-monochrome.png',    1024],
  ['splash-icon.svg',         'splash-icon.png',                1024],
  ['notification-icon.svg',   'notification-icon.png',          96],
  ['icon.svg',                'favicon.png',                    48],
];

console.log('Building icons...');
for (const [src, out, size] of tasks) {
  await render(src, out, size);
}
console.log('Done.');
