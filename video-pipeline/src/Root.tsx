import React from 'react';
import { Composition } from 'remotion';
import './engine/fonts';
import { STUDIO } from './studio.config';
import { HungSheet, EPISODES } from './episodes';

// Every episode gets two compositions:
//   <Id>       the film
//   <Id>Board  one frame per shot, at its key frame, for the storyboard / review
//   npx remotion studio src/index.ts --port 3430
export const Root: React.FC = () => {
  return (
    <>
      {EPISODES.map((e) => (
        <React.Fragment key={e.id}>
          <Composition
            id={e.id}
            component={e.Main}
            durationInFrames={Math.max(1, e.total)}
            width={e.width}
            height={e.height}
            fps={STUDIO.fps}
          />
          <Composition
            id={`${e.id}Board`}
            component={e.Board}
            durationInFrames={Math.max(1, e.shotCount)}
            width={e.width}
            height={e.height}
            fps={STUDIO.fps}
          />
        </React.Fragment>
      ))}
      <Composition id="HungSheet" component={HungSheet} durationInFrames={1} width={1080} height={1920} fps={30} />
    </>
  );
};
