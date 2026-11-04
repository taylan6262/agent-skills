// Erzeugt alle App-Icons aus der Bildmarke (drei Grundformen auf Papier).
// Aufruf: npm run icons   (nutzt den Chromium von Playwright)
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');

const PAPER = '#F4EEE1';
const INK = '#1B1A17';

/** Bildmarke; `scale` bestimmt, wie viel der Fläche sie einnimmt (Maskable braucht Rand). */
function svg(scale) {
  const offset = (64 - 64 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  <rect width="64" height="64" fill="${PAPER}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <rect x="4" y="22" width="26" height="38" fill="#1E4FA3" stroke="${INK}" stroke-width="3"/>
    <circle cx="44" cy="20" r="16" fill="#B8331D" stroke="${INK}" stroke-width="3"/>
    <polygon points="30,60 46,32 62,60" fill="#F2B807" stroke="${INK}" stroke-width="3" stroke-linejoin="miter"/>
  </g>
</svg>`;
}

const targets = [
  ...[48, 72, 96, 128, 144, 152, 192, 256, 384, 512].map((size) => ({ file: `icon-${size}.png`, size, scale: 0.84 })),
  { file: 'maskable-192.png', size: 192, scale: 0.62 },
  { file: 'maskable-512.png', size: 512, scale: 0.62 },
  { file: 'apple-touch-icon.png', size: 180, scale: 0.78 },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const target of targets) {
  await page.setViewportSize({ width: target.size, height: target.size });
  await page.setContent(
    `<html><body style="margin:0;background:${PAPER}">${svg(target.scale)}</body></html>`,
  );
  await page.screenshot({ path: join(outDir, target.file), omitBackground: false });
  console.log('✓', target.file);
}
await browser.close();
