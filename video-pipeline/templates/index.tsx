import React from 'react';
import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4, S5 } from './shots';

export const __CAMEL__ = defineEpisode('__COMP__', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4, S5 },
  bg: '#03060B',
});
