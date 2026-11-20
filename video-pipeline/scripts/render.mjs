// Render the episode to MP4. Vertical 1080x1920, H.264 + AAC, 30 fps.
//   node scripts/render.mjs chuyen-pha                 full quality
//   node scripts/render.mjs chuyen-pha --preview       half size, fast, for review
//   node scripts/render.mjs chuyen-pha --frames=0-300  a slice
import path from 'node:path';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { arg, bundleStudio, cleanup, compositionId, ensure, loadTimeline, root } from './lib.mjs';

const slug = process.argv[2];
if (!slug || slug.startsWith('--')) {
  console.error('usage: node scripts/render.mjs <slug> [--preview] [--scale=1] [--crf=18] [--frames=a-b]');
  process.exit(1);
}
const tl = loadTimeline(slug);
const id = compositionId(tl);
const preview = Boolean(arg('preview', false));
const scale = Number(arg('scale', preview ? 0.5 : 1));
const crf = Number(arg('crf', preview ? 26 : 18));
const out = path.resolve(String(arg('out', path.join(root, 'out', slug, preview ? `${slug}-preview.mp4` : `${slug}.mp4`))));
ensure(path.dirname(out));

let frameRange = null;
const frames = arg('frames', null);
if (frames && typeof frames === 'string') {
  const [a, b] = frames.split('-').map((v) => Number(v));
  if (Number.isFinite(a)) frameRange = [a, Number.isFinite(b) ? b : a];
}

const serveUrl = await bundleStudio();
try {
  const composition = await selectComposition({ serveUrl, id, frame: 0 });
  console.log(`render ${id}: ${composition.width}x${composition.height} @ ${composition.fps}fps, ${composition.durationInFrames} frames, scale ${scale}`);
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    audioCodec: 'aac',
    outputLocation: out,
    scale,
    crf,
    frameRange,
    concurrency: Number(arg('concurrency', 4)),
    timeoutInMilliseconds: 600000,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      if (pct % 10 === 0) process.stdout.write(`\r  ${pct}%`);
    },
  });
  process.stdout.write('\r');
  console.log(`DONE -> ${out}`);
} finally {
  cleanup(serveUrl);
}
