import React from 'react';
import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5 } from './shots';

// The character-reference example: one spec, five framings, the same face.
export const refNhanVat = defineEpisode('RefNhanVat', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5 },
  bg: '#101317',
});
