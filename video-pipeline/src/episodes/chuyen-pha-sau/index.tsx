import React from 'react';
import { defineEpisode, Timeline } from '../../engine';
import timeline from './timeline.json';
import { S1, S2, S3, S4 } from './shots';

// Epilogue to chuyen-pha, starring the character from the reference sheet.
export const chuyenPhaSau = defineEpisode('ChuyenPhaSau', {
  timeline: timeline as Timeline,
  shots: { S1, S2, S3, S4 },
  bg: '#03060B',
});
