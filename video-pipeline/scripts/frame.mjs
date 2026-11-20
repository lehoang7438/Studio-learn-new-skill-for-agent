// One frame of the film, for a spot check or a thumbnail.
//   node scripts/frame.mjs chuyen-pha 120
//   node scripts/frame.mjs chuyen-pha 120 --out=out/chuyen-pha/thumb.png
import path from 'node:path';
import { renderStill, selectComposition } from '@remotion/renderer';
import { arg, bundleStudio, cleanup, compositionId, ensure, loadTimeline, root } from './lib.mjs';

const slug = process.argv[2];
const frame = Number(process.argv[3]);
if (!slug || slug.startsWith('--') || !Number.isFinite(frame)) {
  console.error('usage: node scripts/frame.mjs <slug> <frame> [--out=path] [--scale=1]');
  process.exit(1);
}
const tl = loadTimeline(slug);
const id = compositionId(tl);
const out = path.resolve(String(arg('out', path.join(root, 'out', slug, `frame-${frame}.png`))));
ensure(path.dirname(out));

const serveUrl = await bundleStudio();
try {
  const composition = await selectComposition({ serveUrl, id, frame });
  await renderStill({
    composition,
    serveUrl,
    frame,
    scale: Number(arg('scale', 1)),
    output: out,
    timeoutInMilliseconds: 300000,
  });
  console.log(`DONE -> ${out}`);
} finally {
  cleanup(serveUrl);
}
