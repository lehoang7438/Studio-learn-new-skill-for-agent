// Shared helpers for the three Node entry points (stills / render / frame).
// They all bundle the same Remotion entry once and read the same timeline.json.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bundle } from '@remotion/bundler';

export const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const arg = (name, fallback = undefined) => {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};

export const pascal = (slug) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');

export const loadTimeline = (slug) => {
  const p = path.join(root, 'src', 'episodes', slug, 'timeline.json');
  if (!fs.existsSync(p)) {
    throw new Error(`no timeline at ${p}\nrun: python video.py timeline ${slug}`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
};

export const compositionId = (tl) => tl.composition || pascal(tl.slug);

export const bundleStudio = () =>
  bundle({ entryPoint: path.join(root, 'src', 'index.ts') });

export const cleanup = (serveUrl) => {
  // a bundle is several hundred MB in the temp folder; drop it or repeated runs fill the disk
  try {
    fs.rmSync(serveUrl, { recursive: true, force: true });
  } catch {
    /* Windows may still hold a file; harmless */
  }
};

export const ensure = (p) => {
  fs.mkdirSync(p, { recursive: true });
  return p;
};
