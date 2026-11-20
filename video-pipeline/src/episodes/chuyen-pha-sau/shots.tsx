import React from 'react';
import {
  basePose,
  Cabin,
  CHARACTERS,
  ChoiceCard,
  FlatHero,
  FONT,
  Hud,
  LightPool,
  NightSea,
  Pose,
  push,
  Scanlines,
  ShotProps,
} from '../../engine';
import project from './project.json';

// CHUYẾN PHÀ — GHẾ THỨ BẢY.
// The epilogue that ties the reference episode to chuyen-pha: same ferry, same HUD, same seven seats,
// and the character whose spec was locked in ref-nhan-vat. Nothing here re-invents the face: every
// shot imports NAM.look, so a viewer who saw the sheet sees the same person on the deck.

const END = project.endCard;
const NAM = CHARACTERS.nam;
const LOOK = NAM.look;

const blinkAt = (t: number, every = 104) => (t % every > every - 5 ? 1 : 0);

const namPose = (over: Partial<Pose> = {}): Pose => ({
  ...basePose,
  x: 960,
  y: 816,
  scale: 2,
  facing: 1,
  yaw: 0.24,
  tilt: 0,
  headTilt: 0,
  expr: 'neutral',
  blink: 0,
  look: 0.1,
  armL: { a: 13, b: -7 },
  armR: { a: 15, b: -7 },
  legL: { a: -4, b: 0 },
  legR: { a: 4, b: 0 },
  ...over,
});

/** The deck: a wet floor, a rail, and the dark water past it. */
const Deck: React.FC<{ y?: number }> = ({ y = 1160 }) => (
  <g>
    <rect x={420} y={y} width={1080} height={1500 - y} fill="#04070D" />
    <path d={`M 420 ${y} L 1500 ${y - 30}`} stroke="#1B2B40" strokeWidth={10} />
    {Array.from({ length: 10 }).map((_, i) => (
      <g key={i}>
        <rect x={440 + i * 116} y={y - 168} width={7} height={180} fill="#16243A" />
        <rect x={440 + i * 116} y={y - 168} width={7} height={7} fill="#2A405C" />
      </g>
    ))}
  </g>
);

/** The top rail, drawn over the figure, so he stands behind it. */
const Rail: React.FC<{ y?: number }> = ({ y = 1160 }) => (
  <g>
    <path d={`M 430 ${y - 158} L 1490 ${y - 186}`} stroke="#22344C" strokeWidth={7} />
    <path d={`M 430 ${y - 92} L 1490 ${y - 120}`} stroke="#1B2B40" strokeWidth={5} opacity={0.8} />
  </g>
);

// S1 — the deck. One passenger who is not on the manifest.
export const S1: React.FC<ShotProps> = ({ t, len }) => {
  const pose = namPose({
    y: 816 + Math.sin(t / 30) * 2,
    headTilt: Math.sin(t / 44) * 1.6,
    expr: 'neutral',
    blink: blinkAt(t),
    sway: Math.sin(t / 24) * 2,
  });
  return (
    <g transform={push(t, len, 1.0, 1.05)}>
      <NightSea id="p1" t={t} rain={0.9} fog={0.65} harbour={false} />
      <LightPool x={960} y={700} r={680} color="#FFD7A0" o={0.12} />
      <Deck y={1160} />
      <FlatHero pose={pose} look={LOOK} light={{ x: 0.65, y: -0.55, rim: 0.55, shade: 0.45, warm: '#DCE8FF' }} />
      <Rail y={1160} />
      <rect x={420} y={-420} width={1080} height={1920} fill="#050B12" opacity={0.12} />
      <Scanlines o={0.05} />
    </g>
  );
};

// S2 — the cabin POV from chuyen-pha, now with him outside the glass.
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const pose = namPose({
    x: 1080,
    y: 900,
    scale: 1.5,
    yaw: 0.1,
    expr: 'neutral',
    blink: blinkAt(t, 118),
    look: -0.05,
    armL: { a: 10, b: -6 },
    armR: { a: 12, b: -6 },
  });
  return (
    <g transform={push(t, len, 1.01, 1.05)}>
      <NightSea id="p2" t={t} rain={0.75} fog={0.55} moon={false} />
      <Deck y={1180} />
      <FlatHero pose={pose} look={LOOK} shadow={0.6} light={{ x: 0.8, y: -0.45, rim: 0.7, shade: 0.5, warm: '#BFD9FF' }} />
      <Rail y={1180} />
      {/* the glass: a wet sheet between him and the driver */}
      <rect x={420} y={-420} width={1080} height={1920} fill="#0A1730" opacity={0.22} />
      <Cabin t={t} speed={0.45} wheel={Math.sin(t / 24) * 3} hands />
      <Hud t={t} clock="21:47" route="BẾN 7 · ĐẢO XA" fuel={36} km={59} seats={6} lights={false} />
      <Scanlines o={0.06} />
    </g>
  );
};

// S3 — the close-up: the same face as the character sheet, seen through rain.
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const pose = namPose({
    x: 960,
    y: 1330,
    scale: 5.2,
    yaw: 0.05,
    headTilt: 1 + Math.sin(t / 36) * 1.2,
    expr: 'neutral',
    blink: blinkAt(t, 124),
    look: -0.08,
    glint: 0.12,
    glintColor: '#FFD24A',
  });
  return (
    <g transform={push(t, len, 1.0, 1.03)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#0A1620" />
      <LightPool x={700} y={420} r={780} color="#8FBEB4" o={0.14} />
      <FlatHero pose={pose} look={LOOK} light={{ x: -0.7, y: -0.4, rim: 0.7, shade: 0.5, warm: '#CFE3D8' }} />
      {/* rain running down the glass, over the face */}
      {Array.from({ length: 26 }).map((_, i) => (
        <line
          key={i}
          x1={430 + i * 42}
          y1={-120 + ((i * 173 + t * 9) % 1640)}
          x2={424 + i * 42}
          y2={-60 + ((i * 173 + t * 9) % 1640)}
          stroke="#BFD9FF"
          strokeWidth={2}
          opacity={0.16}
        />
      ))}
      <rect x={420} y={-420} width={1080} height={1920} fill="#081214" opacity={0.18} />
      <Scanlines o={0.06} />
    </g>
  );
};

// S4 — the choice card.
export const S4: React.FC<ShotProps> = ({ t }) => (
  <g>
    <NightSea id="p4" t={t} rain={0.2} fog={0.2} harbour={false} moon={false} />
    <ChoiceCard t={t} a={END.a} b={END.b} subA={END.subA} subB={END.subB} prompt={END.prompt} />
  </g>
);
