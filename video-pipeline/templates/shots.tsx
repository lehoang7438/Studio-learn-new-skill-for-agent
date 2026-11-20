import React from 'react';
import {
  Cabin,
  ChoiceCard,
  Crowd,
  EyesInDark,
  Hud,
  LightPool,
  NightSea,
  RadioUnit,
  Scanlines,
  ShotProps,
  clamp,
  push,
} from '../../engine';
import project from './project.json';

// The starter storyboard. Every shot is a pure function of t.
// Replace the bodies, keep the shape: one scene per shot, one idea per shot.
// Captions are NOT drawn here — they come from project.json -> captions.json -> CaptionLayer.

const END = project.endCard;

export const S1: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.0, 1.04)}>
    <NightSea id="s1" t={t} rain={0.55} fog={0.45} />
    <Cabin t={t} speed={0.35} wheel={Math.sin(t / 30) * 2.5} />
    <Hud t={t} boot={12} clock="21:40" fuel={38} km={62} seats={5} lights={false} />
    <Scanlines o={0.04} />
  </g>
);

export const S2: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.01, 1.05)}>
    <NightSea id="s2" t={t} rain={0.7} fog={0.55} />
    <LightPool x={960} y={700} r={420} o={0.12} />
    <Crowd t={t} n={6} y={706} spread={560} />
    <Cabin t={t} speed={0.3} wheel={Math.sin(t / 26) * 2} hands={false} />
    <Hud t={t} boot={1} clock="21:41" fuel={38} km={61} seats={5} lights={false} />
    <Scanlines o={0.04} />
  </g>
);

export const S3: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.02, 1.08)}>
    <NightSea id="s3" t={t} rain={0.2} fog={0.3} harbour={false} moon={false} />
    <rect x={420} y={-420} width={1080} height={1920} fill="#03070D" opacity={0.55} />
    <RadioUnit t={t} on freq={88 + clamp(t / 60) * 10.6} static={0.9} />
    <Scanlines o={0.06} />
  </g>
);

export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const open = clamp((t - 10) / 24);
  const pulse = 0.8 + 0.2 * Math.sin(t / 6);
  return (
    <g transform={push(t, len, 1.0, 1.05)}>
      <EyesInDark t={t} n={7} o={open * pulse} />
      <Scanlines o={0.03} />
    </g>
  );
};

export const S5: React.FC<ShotProps> = ({ t }) => (
  <g>
    <NightSea id="s5" t={t} rain={0.2} fog={0.2} harbour={false} moon={false} />
    <EyesInDark t={t} n={7} o={0.18} />
    <ChoiceCard t={t} a={END.a} b={END.b} subA={END.subA} subB={END.subB} prompt={END.prompt} />
  </g>
);
