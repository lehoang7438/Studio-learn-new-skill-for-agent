// Storyboard stills: one frame per shot at its key frame, plus optional mid-shot frames.
//   node scripts/stills.mjs chuyen-pha
//   node scripts/stills.mjs chuyen-pha --mid
import path from 'node:path';
import { renderStill, selectComposition } from '@remotion/renderer';
import { arg, bundleStudio, cleanup, compositionId, ensure, loadTimeline, root } from './lib.mjs';

const slug = process.argv[2];
if (!slug || slug.startsWith('--')) {
  console.error('usage: node scripts/stills.mjs <slug> [--mid] [--scale=1]');
  process.exit(1);
}
const tl = loadTimeline(slug);
const id = compositionId(tl);
const mid = Boolean(arg('mid', false));
const scale = Number(arg('scale', 1));
const boardDir = ensure(path.join(root, 'out', slug, 'board'));
const motionDir = ensure(path.join(root, 'out', slug, 'review', 'frames'));

const serveUrl = await bundleStudio();
try {
  for (let i = 0; i < tl.shots.length; i++) {
    const shot = tl.shots[i];
    const composition = await selectComposition({ serveUrl, id: `${id}Board`, frame: i });
    await renderStill({
      composition,
      serveUrl,
      frame: i,
      scale,
      output: path.join(boardDir, `${shot.id}.png`),
      timeoutInMilliseconds: 300000,
    });
    console.log(`still ${shot.id} ok (${i + 1}/${tl.shots.length})`);

    if (mid) {
      const midFrame = shot.first + ((shot.key + Math.max(12, Math.floor(shot.len / 3))) % shot.len);
      const compositionMain = await selectComposition({ serveUrl, id, frame: midFrame });
      await renderStill({
        composition: compositionMain,
        serveUrl,
        frame: midFrame,
        scale,
        output: path.join(motionDir, `${shot.id}.png`),
        timeoutInMilliseconds: 300000,
      });
      console.log(`  mid  ${shot.id} ok`);
    }
  }
  console.log(`DONE ${tl.shots.length} stills -> ${boardDir}`);
} finally {
  cleanup(serveUrl);
}
