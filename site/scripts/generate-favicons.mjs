#!/usr/bin/env node
/**
 * Generate square favicon assets for Next.js app/ metadata files.
 * Run from site/: node scripts/generate-favicons.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = join(__dirname, "..", "app");

const markPath =
  "m150.88 110.82v8.33l-60.34-23.66-6.88 23.66h-3.12l-5.25-27.17q-2.34-1.3-4.55-2.82-2.2-1.53-4.25-3.26-2.05-1.74-3.91-3.67-1.87-1.92-3.54-4.03-1.7-2.2-3.08-4.63-1.38-2.43-2.39-5.02-1.02-2.6-1.65-5.32-0.64-2.72-0.88-5.5c-1.4-14.23-13.91-15.36-13.91-15.36v-2.38c0 0 22.46-19.75 37.24-1.21q1.19 1.53 2.43 3.02 1.24 1.5 2.52 2.95 1.29 1.46 2.61 2.88 1.32 1.42 2.69 2.8c0 0 37.1 33.87 43.42 40z";

function iconSvg(size, radius, markWidth, markHeight) {
  const x = (size - markWidth) / 2;
  const y = (size - markHeight) / 2;
  const scale = Math.min(markWidth / 186, markHeight / 153);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#111111"/>
  <g transform="translate(${x} ${y}) scale(${scale})">
    <path fill="#ffffff" d="${markPath}"/>
  </g>
</svg>`;
}

async function writePng(fileName, size, radius, markWidth, markHeight) {
  const svg = iconSvg(size, radius, markWidth, markHeight);
  const out = join(appDir, fileName);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`wrote ${out}`);
}

async function writeIco(fileName, size, radius, markWidth, markHeight) {
  const svg = iconSvg(size, radius, markWidth, markHeight);
  const png = await sharp(Buffer.from(svg)).resize(32, 32).png().toBuffer();
  const out = join(appDir, fileName);

  // Minimal ICO container with one 32x32 PNG image.
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = 32;
  entry[1] = 32;
  entry[2] = 0;
  entry[3] = 0;
  entry[4] = 1;
  entry[5] = 0;
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);

  writeFileSync(out, Buffer.concat([header, entry, png]));
  console.log(`wrote ${out}`);
}

await writePng("icon.png", 32, 8, 22, 18);
await writePng("apple-icon.png", 180, 36, 126, 104);
await writeIco("favicon.ico", 32, 8, 22, 18);
