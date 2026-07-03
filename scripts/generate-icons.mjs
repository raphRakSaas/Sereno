/* Génère les PNG PWA / favicons à partir de public/logo.svg.
   Usage : npm run generate:icons */
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const ICONS = join(PUBLIC, 'icons');

const ICON_BACKGROUND = '#ECE9DF';

async function renderMark(svgPath, size) {
  return sharp(svgPath, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function iconOnBackground(mark, size, coverage, background) {
  const box = Math.round(size * coverage);
  const resizedMark = await sharp(mark).resize(box, box, { fit: 'contain' }).toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: resizedMark, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(ICONS, { recursive: true });

  const markLight = await renderMark(join(PUBLIC, 'logo.svg'), 512);
  const markDark = await renderMark(join(PUBLIC, 'logo-dark.svg'), 512);

  await writeFile(join(PUBLIC, 'logo.png'), markLight);

  await writeFile(join(ICONS, 'icon-192.png'), await iconOnBackground(markLight, 192, 0.72, ICON_BACKGROUND));
  await writeFile(join(ICONS, 'icon-512.png'), await iconOnBackground(markLight, 512, 0.72, ICON_BACKGROUND));
  await writeFile(join(ICONS, 'icon-maskable-192.png'), await iconOnBackground(markLight, 192, 0.58, ICON_BACKGROUND));
  await writeFile(join(ICONS, 'icon-maskable-512.png'), await iconOnBackground(markLight, 512, 0.58, ICON_BACKGROUND));
  await writeFile(join(ICONS, 'apple-touch-icon.png'), await iconOnBackground(markLight, 180, 0.72, ICON_BACKGROUND));

  await writeFile(join(ICONS, 'favicon-light.png'), await renderMark(join(PUBLIC, 'logo.svg'), 64));
  await writeFile(join(ICONS, 'favicon-dark.png'), await renderMark(join(PUBLIC, 'logo-dark.svg'), 64));

  const icoSources = await Promise.all(
    [16, 32, 48].map((size) => renderMark(join(PUBLIC, 'logo.svg'), size)),
  );
  await writeFile(join(PUBLIC, 'favicon.ico'), await pngToIco(icoSources));

  console.log('Icônes générées depuis logo.svg');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
