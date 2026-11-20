import React from 'react';
import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { SHOTS } from './shots';

// Vertical 1080x1920 — the skill's native frame.
export const chuyenXe = defineEpisode('ChuyenXe', {
  timeline: timeline as unknown as Timeline,
  shots: SHOTS,
  bg: '#05080F',
  captions: [],
});
