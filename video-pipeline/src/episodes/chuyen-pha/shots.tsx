import React from 'react';
import {
  Cabin,
  ChoiceCard,
  Crowd,
  EyesInDark,
  Hud,
  LightPool,
  LightSwitch,
  NightSea,
  RadioUnit,
  Scanlines,
  flicker,
  push,
  ShotProps,
  clamp,
} from '../../engine';
import project from './project.json';

// "CHUYẾN PHÀ 21:40" — the demo episode for the style pack.
// Nine shots, one continuous POV, one choice. Every shot is a pure function of t.
// Captions are NOT drawn here: project.json -> captions.json -> CaptionLayer draws them,
// so a caption can be re-timed without touching a shot.

const END = project.endCard;

// S1 — the cabin boots up. Rain, engine, hands on the wheel.
export const S1: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.0, 1.035)}>
    <NightSea id="s1" t={t} rain={0.55} fog={0.45} />
    <Cabin t={t} speed={0.35} wheel={Math.sin(t / 30) * 2.5} />
    <Hud t={t} boot={12} clock="21:40" fuel={38} km={62} seats={5} lights={false} />
    <Scanlines o={0.04} />
  </g>
);

// S2 — through the windshield: six people waiting under the dock lamps.
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

// S3 — the rear-view mirror. Seven shapes. One has no umbrella.
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const glass = 0.2 + 0.08 * Math.sin(t / 18);
  return (
    <g transform={push(t, len, 1.0, 1.04)}>
      <NightSea id="s3" t={t} rain={0.5} fog={0.4} moon={false} />
      <Cabin t={t} speed={0.3} wheel={0} hands={false} />
      {/* mirror */}
      <g transform="translate(960 470)">
        <rect x={-392} y={-278} width={784} height={556} rx={26} fill="#050B14" stroke="#22344C" strokeWidth={10} />
        <rect x={-368} y={-254} width={736} height={508} rx={16} fill="#071321" />
        <g clipPath="url(#s3mirror)">
          <rect x={-368} y={-254} width={736} height={508} fill="#08182A" />
          {/* reflected harbour glow: the only light behind the figures, so their silhouettes read */}
          <rect x={-368} y={-254} width={736} height={360} fill="#0E2A45" />
          <ellipse cx={0} cy={30} rx={440} ry={190} fill="#2A5C8A" opacity={0.5} />
          {/* Crowd is built around world x=960, so shift it into the mirror's local space */}
          <g transform="translate(-960 0)">
            <Crowd t={t} n={6} y={120} spread={460} eyes={0.25} />
          </g>
          {/* the seventh reflection: no umbrella, a little too tall */}
          <g transform="translate(300 120) scale(1.1)" fill="#02060C">
            <ellipse cx={0} cy={-152} rx={26} ry={30} />
            <path d="M -34 -126 Q 0 -144 34 -126 L 40 0 L -40 0 Z" />
            <path d="M -26 -10 L -30 80 M 26 -10 L 30 80" stroke="#02060C" strokeWidth={14} strokeLinecap="round" />
          </g>
          <path d="M -368 -254 L 368 254" stroke="#CFE2FF" strokeWidth={90} opacity={glass * 0.25} />
          <path d="M -300 -254 L 180 254" stroke="#CFE2FF" strokeWidth={26} opacity={glass * 0.18} />
        </g>
        <defs>
          <clipPath id="s3mirror">
            <rect x={-368} y={-254} width={736} height={508} rx={16} />
          </clipPath>
        </defs>
        <text x={-350} y={-224} fontFamily="JetBrains Mono" fontSize={18} fill="#8FA3BC" letterSpacing={4}>GƯƠNG CHIẾU HẬU</text>
        <circle cx={330} cy={-226} r={7} fill="#E8402F" opacity={0.6 + 0.4 * Math.sin(t / 8)} />
        {/* the seventh reflection: no umbrella, a little too tall */}
        <g opacity={0.9}>
          <ellipse cx={210} cy={-140} rx={30} ry={34} fill="#02060C" />
          <path d="M 176 -112 Q 210 -128 244 -112 L 250 20 L 170 20 Z" fill="#02060C" />
        </g>
      </g>
      <Hud t={t} boot={1} clock="21:42" fuel={38} km={61} seats={6} lights={false} />
      <Scanlines o={0.05} />
    </g>
  );
};

// S4 — the radio. A hand finds the knob; the band slides into static.
export const S4: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.02, 1.08)}>
    <NightSea id="s4" t={t} rain={0.2} fog={0.3} harbour={false} moon={false} />
    <rect x={420} y={-420} width={1080} height={1920} fill="#03070D" opacity={0.55} />
    <RadioUnit t={t} on freq={88 + clamp(t / 60) * 10.6} static={0.9} msg="" />
    <Scanlines o={0.06} />
  </g>
);

// S5 — the display resolves into a sentence that should not be there.
export const S5: React.FC<ShotProps> = ({ t, len }) => {
  const f = flicker(t, 26, 16);
  return (
    <g transform={`${push(t, len, 1.15, 1.2)}`}>
      <NightSea id="s5" t={t} rain={0.15} fog={0.2} harbour={false} moon={false} />
      <rect x={420} y={-420} width={1080} height={1920} fill="#02050A" opacity={0.7} />
      <g opacity={f}>
        <RadioUnit t={t} on freq={98.6} static={0.25} hand={false} msg="ĐỪNG MỞ ĐÈN" />
      </g>
      <rect x={420} y={-420} width={1080} height={1920} fill="#FFE9B0" opacity={0.04 * f} />
      <Scanlines o={0.08} />
    </g>
  );
};

// S6 — they are on the deck now, pressed to the glass.
export const S6: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.02, 1.07)}>
    <NightSea id="s6" t={t} rain={0.85} fog={0.65} moon={false} />
    <LightPool x={960} y={860} r={520} o={0.1} />
    <Crowd t={t} n={7} y={1010} spread={760} eyes={0.8} />
    <Cabin t={t} speed={0.45} wheel={Math.sin(t / 18) * 3} hands />
    <Hud t={t} boot={1} clock="21:45" fuel={37} km={60} seats={7} lights={false} />
    <Scanlines o={0.05} />
  </g>
);

// S7 — the hand on the switch. The whole film waits on one finger.
export const S7: React.FC<ShotProps> = ({ t, len }) => {
  const press = clamp((t - 62) / 18);
  return (
    <g transform={push(t, len, 1.0, 1.06)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#04070D" />
      <LightPool x={960} y={620} r={520} color="#FFB45E" o={0.07} />
      <LightSwitch t={t} on={false} press={press * 0.7} hand />
      <Hud t={t} boot={1} clock="21:46" fuel={37} km={60} seats={7} lights={false} />
      <Scanlines o={0.06} />
    </g>
  );
};

// S8 — lights out. Seven pairs of eyes.
export const S8: React.FC<ShotProps> = ({ t, len }) => {
  const open = clamp((t - 10) / 24);
  const pulse = 0.8 + 0.2 * Math.sin(t / 6);
  return (
    <g transform={push(t, len, 1.0, 1.05)}>
      <LightPool x={960} y={650} r={760} color="#6FA8FF" o={0.07} />
      <EyesInDark t={t} n={7} o={open * pulse} spread={190} rowGap={210} cy={650} size={1.5} />
      <Scanlines o={0.03} />
    </g>
  );
};

// S9 — the choice. The only thing the viewer can do is answer.
export const S9: React.FC<ShotProps> = ({ t }) => (
  <g>
    <NightSea id="s9" t={t} rain={0.2} fog={0.2} harbour={false} moon={false} />
    <ChoiceCard t={t} a={END.a} b={END.b} subA={END.subA} subB={END.subB} prompt={END.prompt} />
  </g>
);
