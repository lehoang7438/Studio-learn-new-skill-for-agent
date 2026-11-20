import React from 'react';
import {
  Cabin,
  ChoiceCard,
  Crowd,
  EyesInDark,
  Hero,
  Hud,
  LightPool,
  LightSwitch,
  LOOKS,
  Look,
  NightSea,
  RadioUnit,
  Scanlines,
  ShotProps,
  basePose,
  clamp,
  push,
} from '../../engine';
import project from './project.json';

// STORYBOARD MẪU — a visual test, not an episode.
// It exists to show the four things a shot list must prove before a full build:
//   1. the background can carry a frame on its own (S1)
//   2. the character reads full-body, head to feet (S2)
//   3. the face reads in extreme close-up (S3)
//   4. the original video's grammar still works: HUD, wheel, radio, crowd, switch, eyes, A/B (S4–S9)
// Captions come from project.json -> captions.json -> CaptionLayer, never from a shot.

const END = project.endCard;

// The captain: the chalk-outline cast look, re-dressed for the ferry (navy jacket, amber badge).
const CAPTAIN: Look = { ...LOOKS.minh, jacket: '#16263C', jacketShade: '#101C2C', accent: '#FFC46B' };

/** A simple deck and rail, drawn in world coordinates, so a standing figure has a floor. */
const Deck: React.FC<{ y?: number }> = ({ y = 1120 }) => (
  <g>
    <rect x={420} y={y} width={1080} height={1500 - y} fill="#04070D" />
    <path d={`M 420 ${y} L 1500 ${y - 28}`} stroke="#1B2B40" strokeWidth={10} />
    {Array.from({ length: 10 }).map((_, i) => (
      <g key={i}>
        <rect x={440 + i * 116} y={y - 152} width={7} height={164} fill="#16243A" />
        <rect x={440 + i * 116} y={y - 152} width={7} height={7} fill="#2A405C" />
      </g>
    ))}
    <path d={`M 430 ${y - 142} L 1490 ${y - 170}`} stroke="#22344C" strokeWidth={6} />
  </g>
);

const blinkAt = (t: number, every = 96) => (t % every > every - 5 ? 1 : 0);

// S1 — the background alone. Rain, dock lamps, a few people waiting.
export const S1: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.0, 1.05)}>
    <NightSea id="b1" t={t} rain={0.8} fog={0.6} />
    <LightPool x={660} y={620} r={460} o={0.16} />
    <LightPool x={1300} y={560} r={380} o={0.12} />
    <Deck y={1040} />
    <Crowd t={t} n={5} y={960} spread={720} eyes={0.2} />
    <Scanlines o={0.05} />
  </g>
);

// S2 — full body, three-quarter. Feet on the deck, head under the roof line.
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const pose = {
    ...basePose,
    x: 960,
    y: 1030,
    scale: 2.2,
    facing: 1 as const,
    yaw: 0.22,
    tilt: -2 + Math.sin(t / 24) * 1.2,
    headTilt: 2 + Math.sin(t / 30) * 1.5,
    expr: 'worried' as const,
    blink: blinkAt(t),
    look: -0.15,
    armL: { a: 18, b: -6 },
    armR: { a: 12, b: -4 },
    legL: { a: 20, b: 0 },
    legR: { a: -20, b: 0 },
    sway: Math.sin(t / 18) * 4,
  };
  return (
    <g transform={push(t, len, 1.0, 1.035)}>
      <NightSea id="b2" t={t} rain={0.7} fog={0.55} moon={false} />
      <LightPool x={960} y={700} r={620} o={0.14} />
      <Deck y={1160} />
      <Hero pose={pose} look={CAPTAIN} rimId="rimBlue" />
      <Hud t={t} boot={1} clock="21:41" fuel={38} km={61} seats={7} lights={false} />
      <Scanlines o={0.05} />
    </g>
  );
};

// S3 — extreme close-up. The face fills the vertical frame; the background is only weather.
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const pose = {
    ...basePose,
    x: 960,
    y: 1455,
    scale: 5.2,
    facing: 1 as const,
    yaw: 0.08,
    tilt: -1,
    headTilt: 1 + Math.sin(t / 34) * 1.2,
    expr: 'worried' as const,
    blink: blinkAt(t, 110),
    look: -0.12,
    glint: 0.22,
    glintColor: '#FFD24A',
    sway: 0,
  };
  return (
    <g transform={push(t, len, 1.0, 1.03)}>
      <NightSea id="b3" t={t} rain={0.9} fog={0.75} moon={false} harbour={false} />
      <LightPool x={960} y={520} r={580} o={0.18} />
      <rect x={420} y={-420} width={1080} height={1920} fill="#03060B" opacity={0.18} />
      <Hero pose={pose} look={CAPTAIN} rimId="rimBlue" />
      <Scanlines o={0.07} />
    </g>
  );
};

// S4 — the original POV: hands on the wheel, HUD on the glass.
export const S4: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.01, 1.05)}>
    <NightSea id="b4" t={t} rain={0.6} fog={0.45} moon={false} />
    <Cabin t={t} speed={0.4} wheel={Math.sin(t / 26) * 3} hands />
    <Hud t={t} boot={1} clock="21:42" fuel={38} km={61} seats={7} lights={false} />
    <Scanlines o={0.05} />
  </g>
);

// S5 — radio insert. The hand finds the knob; the band slides into static.
export const S5: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.02, 1.08)}>
    <NightSea id="b5" t={t} rain={0.2} fog={0.3} harbour={false} moon={false} />
    <rect x={420} y={-420} width={1080} height={1920} fill="#03070D" opacity={0.55} />
    <RadioUnit t={t} on freq={88 + clamp(t / 55) * 10.6} static={0.9} />
    <Scanlines o={0.06} />
  </g>
);

// S6 — seven silhouettes through the windshield. The crowd is the scare.
export const S6: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.02, 1.07)}>
    <NightSea id="b6" t={t} rain={0.85} fog={0.65} moon={false} />
    <LightPool x={960} y={900} r={620} o={0.11} />
    <Deck y={1120} />
    <Crowd t={t} n={7} y={1040} spread={780} eyes={0.9} />
    <Cabin t={t} speed={0.45} wheel={Math.sin(t / 18) * 3} hands={false} />
    <Hud t={t} boot={1} clock="21:44" fuel={37} km={60} seats={7} lights={false} />
    <Scanlines o={0.05} />
  </g>
);

// S7 — the switch insert. One finger, one decision.
export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const press = clamp((t - 62) / 18);
  return (
    <g transform={push(t, len, 1.0, 1.06)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#04070D" />
      <LightPool x={960} y={620} r={520} color="#FFB45E" o={0.07} />
      <LightSwitch t={t} on={false} press={press * 0.7} hand />
      <Hud t={t} boot={1} clock="21:45" fuel={37} km={60} seats={7} lights={false} />
      <Scanlines o={0.06} />
    </g>
  );
};

// S8 — lights out. Seven pairs of eyes.
export const S8: React.FC<ShotProps> = ({ t, len }) => {
  const open = clamp((t - 8) / 22);
  const pulse = 0.8 + 0.2 * Math.sin(t / 6);
  return (
    <g transform={push(t, len, 1.0, 1.05)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#010308" />
      <LightPool x={960} y={650} r={760} color="#6FA8FF" o={0.07} />
      <EyesInDark t={t} n={7} o={open * pulse} bg={false} spread={190} rowGap={210} cy={650} size={1.5} />
      <Scanlines o={0.03} />
    </g>
  );
};

// S9 — the choice card.
export const S9: React.FC<ShotProps> = ({ t }) => (
  <g>
    <NightSea id="b9" t={t} rain={0.2} fog={0.2} harbour={false} moon={false} />
    <ChoiceCard t={t} a={END.a} b={END.b} subA={END.subA} subB={END.subB} prompt={END.prompt} />
  </g>
);
