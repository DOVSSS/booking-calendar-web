import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const sizes = [192, 512];

for (const size of sizes) {
  const svg = readFileSync(join(publicDir, 'icon.svg'));
  const png = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(join(publicDir, `pwa-${size}x${size}.png`), png);
}

const maskableSvg = readFileSync(join(publicDir, 'icon-maskable.svg'));
const maskablePng = await sharp(maskableSvg).resize(512, 512).png().toBuffer();
writeFileSync(join(publicDir, 'pwa-maskable-512x512.png'), maskablePng);

console.log('PWA icons generated successfully.');
