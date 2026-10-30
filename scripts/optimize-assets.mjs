import sharp from 'sharp';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const assets = fileURLToPath(new URL('../public/assets/', import.meta.url));
await mkdir(assets, { recursive: true });
const variants = [
  ['vistacortex-buildfeast-transparent.png', 'brand-wordmark.webp', 560],
  ['dondeal-logo-transparent.png', 'dondeal-logo.webp', 400],
  ['company-express-logo.png', 'company-express-logo.webp', 240],
  ['dharma-setu-logo-transparent.png', 'dharma-setu-logo.webp', 260],
  ['vistacortex-organizer-transparent.png', 'vistacortex-organizer.webp', 280],
  ['ure-productions-transparent.png', 'ure-groups.webp', 160],
  ['student-forge-logo.png', 'student-forge.webp', 180],
];
for (const [source, destination, width] of variants) {
  await sharp(join(assets, source)).resize({ width, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100, effort: 5 }).toFile(join(assets, destination));
  const before = (await stat(join(assets, source))).size;
  const after = (await stat(join(assets, destination))).size;
  console.log(`${destination}: ${before} → ${after} bytes`);
}
// Precompute the official emblem's particle coordinates once, rather than decoding
// the full-resolution logo and reading its pixels on every visitor's main thread.
const logo = join(assets, 'vistacortex-buildfeast-transparent.png');
const meta = await sharp(logo).metadata();
const cropWidth = Math.floor(meta.width * .272);
const { data, info } = await sharp(logo).extract({ left: 0, top: 0, width: cropWidth, height: meta.height }).resize({ width: 190 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const points = [];
let minX = info.width, minY = info.height, maxX = 0, maxY = 0;
for (let y = 0; y < info.height; y += 3) for (let x = 0; x < info.width; x += 3) {
  const offset = (y * info.width + x) * 4;
  if (data[offset + 3] < 150 || data[offset + 1] < 25) continue;
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  points.push([x, y, data[offset + 1] > 115 ? 1 : 0]);
}
if (!points.length) throw new Error('The logo particle map is empty.');
const span = Math.max(maxX - minX, maxY - minY) || 1;
const normalized = points.map(([x, y, color]) => [Math.round((x - (minX + maxX) / 2) / span * 1000), Math.round((y - (minY + maxY) / 2) / span * 1000), color]);
await writeFile(join(assets, 'leaf-particles.json'), JSON.stringify(normalized));
console.log(`Official leaf emblem: ${points.length} precomputed particles`);
