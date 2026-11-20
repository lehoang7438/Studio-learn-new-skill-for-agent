import React from 'react';
import { clamp, easeOut, kf, lerp, rnd } from './anim';
import { FONT } from './fonts';

// ---------------------------------------------------------------------------------------------
// STYLE PACK: "first-person HUD thriller"
// The visual language of the reference short: a night POV from inside a vehicle, a thin HUD
// reading out the state of the world, flat 2D shapes lit by one cold source, bold condensed
// captions that land word by word, and a two-option choice card at the end.
//
// Everything here is a pure function of t, so any shot can be scrubbed, held or reversed.
// The world is 1920x1080; the vertical canvas shows x 420..1500, y -420..1500.
// ---------------------------------------------------------------------------------------------

export const FP = {
  ink: '#05080F',
  night: '#0A1730',
  night2: '#122A4A',
  horizon: '#1E4670',
  sea: '#071426',
  sea2: '#0B2038',
  steel: '#1B2A40',
  steel2: '#2A3B55',
  cream: '#F4EEE2',
  muted: '#8FA3BC',
  amber: '#F2B33D',
  amber2: '#FFD24A',
  red: '#E8402F',
  green: '#5BE08A',
  skin: '#D99A6C',
  skinShade: '#B8764B',
  sleeve: '#243247',
  glass: '#7FB4E8',
};

const R = (seed: number, i: number) => rnd(seed, i);

// ---------------------------------------------------------------- sky, sea, harbour

export const NightSea: React.FC<{
  id: string;
  t: number;
  rain?: number;
  fog?: number;
  moon?: boolean;
  harbour?: boolean;
}> = ({ id, t, rain = 0.5, fog = 0.4, moon = true, harbour = true }) => {
  const drift = Math.sin(t / 90) * 8;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="-420" x2="0" y2="800" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#050B18" />
          <stop offset="55%" stopColor={FP.night} />
          <stop offset="100%" stopColor={FP.horizon} />
        </linearGradient>
        <linearGradient id={`${id}-sea`} x1="0" y1="760" x2="0" y2="1500" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={FP.sea2} />
          <stop offset="100%" stopColor="#03080F" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor="#BFD9FF" stopOpacity="0.7" />
          <stop offset="35%" stopColor="#6E9AD6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#6E9AD6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x={-420} y={-420} width={2760} height={1220} fill={`url(#${id}-sky)`} />
      <rect x={-420} y={760} width={2760} height={740} fill={`url(#${id}-sea)`} />

      {/* stars, thinning toward the horizon */}
      {Array.from({ length: 46 }).map((_, i) => {
        const y = -380 + R(7, i) * 900;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t / (26 + R(8, i) * 40) + i));
        return <circle key={i} cx={380 + R(9, i) * 1160} cy={y} r={0.8 + R(10, i) * 1.5} fill="#DCE9FF" opacity={tw * (1 - clamp((y + 380) / 1000)) * 0.8} />;
      })}

      {moon ? (
        <g transform={`translate(${1268 + drift} 96)`}>
          <circle r={190} fill={`url(#${id}-glow)`} opacity={0.55} />
          <circle r={46} fill="#E9F1FF" />
          <path d="M 10 -46 A 46 46 0 0 1 10 46 A 38 46 0 0 0 10 -46 Z" fill="#C4D3EC" opacity={0.55} />
        </g>
      ) : null}

      {/* harbour silhouettes: cranes, containers, the ferry ramp */}
      {harbour ? (
        <g fill="#040A14">
          <path d="M 420 762 L 420 690 L 470 690 L 470 762 Z M 500 762 L 500 650 L 540 650 L 540 762 Z M 560 762 L 560 700 L 640 700 L 640 762 Z" />
          <path d="M 700 762 L 700 604 L 716 604 L 716 762 Z M 660 604 L 760 604 L 760 618 L 660 618 Z M 700 618 L 700 700 L 760 700 L 760 618 Z" opacity={0.9} />
          <path d="M 820 762 L 820 660 L 900 660 L 900 762 Z M 910 762 L 910 690 L 980 690 L 980 762 Z" />
          <path d="M 1090 762 L 1090 620 L 1106 620 L 1106 762 Z M 1050 620 L 1150 620 L 1150 634 L 1050 634 Z" opacity={0.9} />
          <path d="M 1200 762 L 1200 672 L 1280 672 L 1280 762 Z M 1290 762 L 1290 706 L 1370 706 L 1370 762 Z" />
          <path d="M 1400 762 L 1400 640 L 1414 640 L 1414 762 Z M 1360 640 L 1460 640 L 1460 654 L 1360 654 Z" opacity={0.8} />
          {/* the dock itself */}
          <rect x={420} y={742} width={1080} height={24} fill="#060C16" />
          <rect x={420} y={766} width={1080} height={8} fill="#0B1A2C" opacity={0.7} />
        </g>
      ) : null}

      {/* dock lamps and their reflections */}
      {[600, 760, 1140, 1330].map((x, i) => {
        const on = 0.6 + 0.4 * Math.sin(t / (30 + i * 9) + i * 2);
        return (
          <g key={x}>
            <rect x={x - 2} y={660} width={4} height={86} fill="#0A1220" />
            <circle cx={x} cy={656} r={38} fill="#FFC46B" opacity={0.1 * on} />
            <circle cx={x} cy={656} r={7} fill="#FFD9A0" opacity={0.9} />
            <rect x={x - 5} y={790} width={10} height={120 + (i % 3) * 40} fill="#FFC46B" opacity={0.05 * on} />
          </g>
        );
      })}

      {/* water: slow horizontal bands + broken reflections */}
      {Array.from({ length: 26 }).map((_, i) => {
        const y = 780 + i * 28;
        const w = 160 + R(21, i) * 620;
        const x = 420 + R(22, i) * (1080 - w);
        return <rect key={i} x={x + Math.sin(t / 40 + i) * 10} y={y} width={w} height={2.2} fill="#9FC6F0" opacity={0.03 + R(23, i) * 0.05} />;
      })}
      {[600, 760, 1140, 1330].map((x, i) => (
        <g key={x} opacity={0.1}>
          {Array.from({ length: 9 }).map((_, k) => (
            <rect key={k} x={x - 10 + Math.sin(t / 26 + k) * 14} y={800 + k * 34} width={20} height={3} fill="#FFC46B" opacity={0.5 - k * 0.04} />
          ))}
        </g>
      ))}

      {/* fog */}
      <g opacity={fog}>
        <ellipse cx={960} cy={790} rx={720} ry={90} fill="#9FB8D8" opacity={0.05} />
        <ellipse cx={960 + Math.sin(t / 60) * 60} cy={840} rx={620} ry={60} fill="#C8D8EE" opacity={0.035} />
      </g>

      {/* rain */}
      <g opacity={rain}>
        {Array.from({ length: 90 }).map((_, i) => {
          const x = 420 + ((R(31, i) * 1080 + t * (5 + R(32, i) * 6)) % 1080);
          const y = -420 + ((R(33, i) * 1920 + t * (20 + R(34, i) * 16)) % 1920);
          return <line key={i} x1={x} y1={y} x2={x - 5} y2={y + 34 + R(35, i) * 26} stroke="#BBD4F2" strokeWidth={1 + R(36, i) * 1.2} opacity={0.1 + R(37, i) * 0.22} />;
        })}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- cabin

export const Cabin: React.FC<{
  t: number;
  wheel?: number;
  dash?: number;
  speed?: number;
  hands?: boolean;
  wipers?: number;
}> = ({ t, wheel = 0, dash = 0.7, speed = 0.4, hands = true, wipers = 0 }) => {
  const shakeY = Math.sin(t * 0.7) * 1.2 * speed;
  const glow = 0.55 + 0.45 * Math.sin(t / 40);
  return (
    <g transform={`translate(0 ${shakeY})`}>
      {/* windshield glass tint */}
      <rect x={420} y={-420} width={1080} height={1460} fill="#0C2036" opacity={0.1} />
      {/* reflections on the glass */}
      <path d="M 520 1040 L 900 -300 L 980 -300 L 600 1040 Z" fill="#BBD8FF" opacity={0.018} />
      <path d="M 1180 1040 L 1420 -120 L 1470 -120 L 1260 1040 Z" fill="#BBD8FF" opacity={0.012} />
      {/* rain beads on the glass */}
      {Array.from({ length: 26 }).map((_, i) => (
        <circle key={i} cx={450 + R(51, i) * 1020} cy={-260 + R(52, i) * 1180} r={1.5 + R(53, i) * 3.2} fill="#DCEBFF" opacity={0.07 + R(54, i) * 0.1} />
      ))}

      {/* A-pillars */}
      <path d="M 360 -420 L 500 -420 L 596 1080 L 360 1080 Z" fill={FP.ink} />
      <path d="M 1540 -420 L 1420 -420 L 1330 1080 L 1540 1080 Z" fill={FP.ink} />
      <path d="M 500 -420 L 540 -420 L 628 1080 L 596 1080 Z" fill="#0A1424" opacity={0.9} />
      <path d="M 1420 -420 L 1388 -420 L 1300 1080 L 1330 1080 Z" fill="#0A1424" opacity={0.9} />

      {/* roof line */}
      <rect x={420} y={-420} width={1080} height={86} fill={FP.ink} />
      <rect x={420} y={-334} width={1080} height={10} fill="#0B1524" />

      {/* wipers, parked low */}
      <g transform={`translate(960 1030) rotate(${-8 + wipers * 44})`} opacity={0.85}>
        <rect x={-4} y={-560} width={8} height={560} rx={4} fill="#05090F" />
        <rect x={-6} y={-580} width={12} height={44} rx={5} fill="#05090F" />
      </g>
      <g transform={`translate(1230 1050) rotate(${6 - wipers * 40})`} opacity={0.85}>
        <rect x={-4} y={-520} width={8} height={520} rx={4} fill="#05090F" />
        <rect x={-6} y={-540} width={12} height={40} rx={5} fill="#05090F" />
      </g>

      {/* dashboard */}
      <path d="M 420 1064 L 1500 1064 L 1500 1500 L 420 1500 Z" fill="#0A111D" />
      <path d="M 420 1064 Q 960 1006 1500 1064 L 1500 1120 Q 960 1062 420 1120 Z" fill="#111C2C" />
      <rect x={420} y={1072} width={1080} height={4} fill="#2C3C54" opacity={0.5} />

      {/* instrument binnacle, seen over the wheel */}
      <g transform="translate(960 1170)">
        <rect x={-250} y={-58} width={500} height={168} rx={30} fill="#060B13" stroke="#1A2940" strokeWidth={3} />
        {[-120, 120].map((dx, i) => {
          const p = 0.35 + 0.25 * Math.sin(t / (30 + i * 8) + i);
          return (
            <g key={dx} transform={`translate(${dx} 12)`}>
              <circle r={52} fill="#0A1524" stroke="#2A3D58" strokeWidth={3} />
              <circle r={44} fill="none" stroke="#7FA0C8" strokeWidth={1.5} opacity={0.35} />
              <line x1={0} y1={0} x2={Math.cos(-2.2 + p * 4.4) * 34} y2={Math.sin(-2.2 + p * 4.4) * 34} stroke={FP.amber} strokeWidth={4} strokeLinecap="round" />
              <circle r={4} fill={FP.amber} />
            </g>
          );
        })}
        <rect x={-56} y={80} width={112} height={26} rx={5} fill="#07101C" stroke="#23354E" strokeWidth={2} />
        <text y={100} textAnchor="middle" fontFamily={FONT.ui} fontSize={17} fill={FP.green} opacity={0.85}>
          {Math.round(38 - (t / 900) * 4)} km
        </text>
      </g>

      {/* wheel + hands */}
      <g transform={`translate(960 1400) rotate(${wheel})`}>
        <ellipse rx={330} ry={150} fill="none" stroke="#070C14" strokeWidth={54} />
        <ellipse rx={330} ry={150} fill="none" stroke="#1D2A3E" strokeWidth={40} />
        <ellipse rx={330} ry={150} fill="none" stroke="#2C3D56" strokeWidth={5} opacity={0.7} />
        <path d="M -300 0 Q 0 60 300 0" fill="none" stroke="#1D2A3E" strokeWidth={26} />
        <path d="M -18 40 L -12 150 M 18 40 L 12 150" stroke="#1D2A3E" strokeWidth={26} strokeLinecap="round" />
        <rect x={-60} y={-12} width={120} height={54} rx={16} fill="#131F30" stroke="#31445F" strokeWidth={3} />
        <text y={26} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={FP.muted} opacity={0.8}>FERRY 7</text>
        {hands ? (
          <>
            <Hand x={-268} y={-52} rot={-16} side={-1} scale={1.02} pose="grip" t={t} />
            <Hand x={268} y={-52} rot={16} side={1} scale={1.02} pose="grip" t={t} />
          </>
        ) : null}
      </g>

      {/* dashboard glow from the instruments */}
      <ellipse cx={960} cy={1170} rx={300} ry={110} fill="#FFC46B" opacity={0.05 * glow * dash} />
    </g>
  );
};

// ---------------------------------------------------------------- first-person hand

export type HandPose = 'grip' | 'reach' | 'press' | 'point';

export const Hand: React.FC<{
  x: number;
  y: number;
  t?: number;
  rot?: number;
  scale?: number;
  side?: 1 | -1;
  pose?: HandPose;
  skin?: string;
  shade?: string;
  sleeve?: string;
  opacity?: number;
}> = ({ x, y, t = 0, rot = 0, scale = 1, side = 1, pose = 'reach', skin = FP.skin, shade = FP.skinShade, sleeve = FP.sleeve, opacity = 1 }) => {
  const breathe = Math.sin(t / 22) * 2.5;
  const curl = pose === 'grip' ? 1 : pose === 'press' ? 0.55 : 0.15;
  return (
    <g transform={`translate(${x} ${y + breathe}) rotate(${rot}) scale(${scale * side} ${scale})`} opacity={opacity}>
      {/* forearm, running out of the bottom of frame */}
      <path d="M -74 420 L 74 420 L 58 74 Q 0 30 -58 74 Z" fill={sleeve} />
      <path d="M -58 74 Q 0 30 58 74 L 52 120 Q 0 82 -52 120 Z" fill={shade} opacity={0.55} />
      {/* palm */}
      <ellipse cx={0} cy={0} rx={62} ry={68} fill={skin} />
      <ellipse cx={-16} cy={10} rx={34} ry={40} fill={shade} opacity={0.25} />
      {/* fingers, curling over whatever is held */}
      {[-42, -14, 14, 42].map((fx, i) => {
        const len = 58 - Math.abs(i - 1.5) * 6;
        const a = -78 + curl * 54 + i * 2;
        return (
          <g key={fx} transform={`translate(${fx} -46) rotate(${a})`}>
            <rect x={-11} y={-len} width={22} height={len + 16} rx={11} fill={skin} />
            <rect x={-11} y={-len} width={22} height={len + 16} rx={11} fill="none" stroke={shade} strokeWidth={1.6} opacity={0.5} />
            <rect x={-9} y={-len + 4} width={7} height={len - 4} rx={4} fill="#FFFFFF" opacity={0.06} />
          </g>
        );
      })}
      {/* thumb */}
      <g transform={`translate(${side > 0 ? -54 : 54} 18) rotate(${side > 0 ? 26 : -26})`}>
        <rect x={-15} y={-52} width={30} height={78} rx={15} fill={skin} />
        <rect x={-15} y={-52} width={30} height={78} rx={15} fill="none" stroke={shade} strokeWidth={1.6} opacity={0.5} />
      </g>
      {/* knuckle creases */}
      <path d="M -46 26 Q 0 44 46 26" fill="none" stroke={shade} strokeWidth={2} opacity={0.35} />
      {pose === 'point' ? <rect x={-8} y={-150} width={18} height={110} rx={9} fill={skin} stroke={shade} strokeWidth={1.5} /> : null}
    </g>
  );
};

// ---------------------------------------------------------------- HUD

export const Hud: React.FC<{
  t: number;
  clock?: string;
  route?: string;
  fuel?: number;
  km?: number;
  seats?: number;
  lights?: boolean;
  boot?: number;
}> = ({ t, clock = '21:40', route = 'BẾN 7 · ĐẢO XA', fuel = 38, km = 62, seats = 5, lights = false, boot = 10 }) => {
  const on = clamp(t / boot);
  const y = -34 + (1 - easeOut(on)) * -26;
  const tick = Math.floor(t / 30) % 2;
  return (
    <g opacity={on} transform={`translate(0 ${y})`}>
      <rect x={432} y={-322} width={1056} height={124} rx={26} fill="#050A12" opacity={0.72} />
      <rect x={432} y={-322} width={1056} height={124} rx={26} fill="none" stroke="#3A4E6A" strokeWidth={2} opacity={0.35} />

      {/* clock */}
      <g transform="translate(478 -258)">
        <text fontFamily={FONT.ui} fontWeight={700} fontSize={54} fill={FP.cream} letterSpacing={1}>
          {clock}
        </text>
        <text y={30} fontFamily={FONT.ui} fontSize={18} fill={FP.muted} letterSpacing={3}>
          PHÀ 06:00
        </text>
      </g>

      <line x1={700} y1={-306} x2={700} y2={-214} stroke="#3A4E6A" strokeWidth={2} opacity={0.5} />

      {/* route */}
      <g transform="translate(730 -272)">
        <text fontFamily={FONT.ui} fontSize={18} fill={FP.muted} letterSpacing={3}>TUYẾN</text>
        <text y={34} fontFamily={FONT.body} fontWeight={600} fontSize={26} fill={FP.cream} letterSpacing={1}>{route}</text>
      </g>

      {/* right readouts */}
      <g transform="translate(1030 -286)">
        <Gauge x={0} y={0} label="NHIÊN LIỆU" p={fuel / 100} text={`${fuel}%`} />
        <Gauge x={0} y={56} label="CÒN CÁCH" p={km / 100} text={`${km} km`} />
      </g>

      {/* seats */}
      <g transform="translate(1252 -268)">
        <SeatIcon x={0} y={0} />
        <text x={34} y={8} fontFamily={FONT.ui} fontSize={26} fill={FP.cream}>{seats}/7</text>
        <text x={0} y={38} fontFamily={FONT.ui} fontSize={16} fill={FP.muted} letterSpacing={2}>CHỖ</text>
      </g>

      {/* lights chip */}
      <g transform="translate(1348 -268)">
        <rect x={-8} y={-30} width={108} height={64} rx={14} fill={lights ? '#3A2A08' : '#0A1220'} stroke={lights ? FP.amber : '#3A4E6A'} strokeWidth={2} />
        <circle cx={14} cy={2} r={8} fill={lights ? FP.amber2 : '#3A4E6A'} opacity={lights ? 1 : 0.7 + tick * 0.2} />
        <text x={32} y={9} fontFamily={FONT.ui} fontSize={17} fill={lights ? FP.amber2 : FP.muted} letterSpacing={1}>
          {lights ? 'ON' : 'OFF'}
        </text>
      </g>
    </g>
  );
};

const Gauge: React.FC<{ x: number; y: number; label: string; p: number; text: string }> = ({ x, y, label, p, text }) => (
  <g transform={`translate(${x} ${y})`}>
    <text fontFamily={FONT.ui} fontSize={14} fill={FP.muted} letterSpacing={2}>{label}</text>
    <rect x={0} y={8} width={108} height={10} rx={5} fill="#FFFFFF" opacity={0.1} />
    <rect x={0} y={8} width={108 * clamp(p)} height={10} rx={5} fill={p < 0.2 ? FP.red : FP.amber} />
    <text x={118} y={18} fontFamily={FONT.ui} fontSize={17} fill={FP.cream}>{text}</text>
  </g>
);

const SeatIcon: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} fill="none" stroke={FP.cream} strokeWidth={2.4} strokeLinecap="round">
    <path d="M -8 -12 L -8 10 Q -8 14 -4 14 L 8 14" />
    <path d="M -4 -12 Q 4 -18 10 -12" />
  </g>
);

// ---------------------------------------------------------------- captions

/** Estimated advance width of a caption line in em, for auto-fitting without a DOM measure. */
export const captionEm = (text: string) => {
  const narrow = "IJLTÌÍỈĨỊ!.,:;'’|";
  const wide = 'MWMĐÔƠƯQ@%';
  let em = 0;
  for (const ch of text) {
    if (ch === ' ') em += 0.26;
    else if (narrow.includes(ch)) em += 0.34;
    else if (wide.includes(ch)) em += 0.84;
    else em += 0.58;
  }
  return em;
};

/** The reference's caption: one static phrase, all caps, thick outline, drop shadow,
 *  optionally one accent word in yellow/red and a matching underline. */
export const Caption: React.FC<{
  t: number;
  text: string;
  accent?: string;
  start?: number;
  per?: number;
  y?: number;
  size?: number;
  align?: 'center' | 'left';
  x?: number;
  color?: string;
  accentColor?: string;
  fitWidth?: number;
  underline?: boolean;
  shadow?: boolean;
  stroke?: number;
}> = ({
  t,
  text,
  accent,
  start = 0,
  per = 0,
  y = 900,
  size = 100,
  align = 'center',
  x = 960,
  color = '#FFFFFF',
  accentColor = FP.amber2,
  fitWidth = 900,
  underline = false,
  shadow = true,
  stroke = 0.14,
}) => {
  const rawLines = text.split('\n');
  // fit the longest line into fitWidth, never growing past `size`
  const em = Math.max(...rawLines.map((l) => captionEm(l)), 0.01);
  const fitted = Math.min(size, fitWidth / em);
  const space = captionEm(' ') * fitted;
  // an accent can be a phrase ("VÔ LĂNG", "CÔNG TẮC"), so match any of its words
  const accentSet = new Set(
    (accent ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()),
  );
  const isAccentWord = (w: string) => accentSet.has(w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase());

  /** Each word is its own text node, so an accent phrase can carry one continuous underline. */
  const lineWords = (line: string) => {
    const words = line.split(/\s+/).filter(Boolean);
    const widths = words.map((w) => captionEm(w) * fitted);
    const total = widths.reduce((a, b) => a + b, 0) + space * Math.max(0, words.length - 1);
    let cursor = align === 'center' ? x - total / 2 : x;
    return words.map((w, k) => {
      const wx = cursor;
      cursor += widths[k] + space;
      return { w, wx, ww: widths[k] };
    });
  };

  const renderLine = (line: string, li: number, ghost: boolean) => {
    const lineY = y + li * (fitted * 1.04);
    const offset = rawLines.slice(0, li).reduce((n, l) => n + l.split(/\s+/).filter(Boolean).length, 0);
    const words = lineWords(line);
    const flags = words.map(({ w }) => isAccentWord(w));
    const runs: [number, number][] = [];
    for (let k = 0; k < words.length; k++) {
      if (!flags[k]) continue;
      let e = k;
      while (e + 1 < words.length && flags[e + 1]) e++;
      runs.push([k, e]);
      k = e;
    }
    return (
      <g key={`${ghost ? 'g' : 'w'}${li}`}>
        {!ghost && underline
          ? runs.map(([a, b]) => {
              const x0 = words[a].wx;
              const x1 = words[b].wx + words[b].ww;
              return (
                <rect
                  key={`u${a}`}
                  x={x0}
                  y={lineY + fitted * 0.14}
                  width={x1 - x0}
                  height={Math.max(4, fitted * 0.052)}
                  fill={accentColor}
                  opacity={0.95}
                />
              );
            })
          : null}
        {words.map(({ w, wx }, k) => {
          const idx = offset + k;
          const on = per > 0 ? clamp((t - start - idx * per) / 4) : 1;
          const acc = !ghost && flags[k];
          return (
            <text
              key={k}
              x={wx}
              y={lineY}
              opacity={on}
              textAnchor="start"
              fontFamily={FONT.title}
              fontWeight={400}
              fontSize={fitted}
              fill={ghost ? '#000' : acc ? accentColor : color}
              stroke={ghost ? '#000' : '#05080F'}
              strokeWidth={fitted * stroke}
              paintOrder="stroke"
              letterSpacing={0.5}
            >
              {w.toUpperCase()}
            </text>
          );
        })}
      </g>
    );
  };

  return (
    <g>
      {shadow ? (
        <g transform="translate(5 7)" opacity={0.55}>
          {rawLines.map((line, li) => (
            <g key={`sh${li}`}>{renderLine(line, li, true)}</g>
          ))}
        </g>
      ) : null}
      {rawLines.map((line, li) => (
        <g key={`ln${li}`}>{renderLine(line, li, false)}</g>
      ))}
    </g>
  );
};

export type CaptionCue = {
  a: number; // first global frame
  b: number; // first frame after
  text: string;
  accent?: string;
  color?: string;
  y?: number;
  size?: number;
  underline?: boolean;
};

/** The generated caption track, drawn over whatever shot is on screen.
 *  Static phrase in, static phrase out — the cut does the animating. */
export const CaptionLayer: React.FC<{
  f: number;
  cues?: CaptionCue[];
  y?: number;
  size?: number;
  fitWidth?: number;
  /** Storyboards show the caption at full strength even on the cue's first/last frame. */
  instant?: boolean;
}> = ({ f, cues = [], y = 900, size = 100, fitWidth = 900, instant = false }) => {
  const cue = cues.find((c) => f >= c.a && f < c.b);
  if (!cue) return null;
  const local = f - cue.a;
  const remain = cue.b - f;
  const opacity = instant ? 1 : Math.min(clamp(local / 3), clamp(remain / 4));
  const pop = 1 + 0.025 * (1 - clamp(local / 5));
  const cy = cue.y ?? y;
  return (
    // cues are written in world coordinates (the same 1920x1080 space as the shots)
    <g transform="translate(-420 420)">
      <g opacity={opacity} transform={`translate(960 ${cy}) scale(${pop}) translate(-960 ${-cy})`}>
        <Caption
          t={local}
          text={cue.text}
          accent={cue.accent}
          start={0}
          per={0}
          y={cy}
          size={cue.size ?? size}
          color="#FFFFFF"
          accentColor={cue.color ?? FP.amber2}
          fitWidth={fitWidth}
          underline={cue.underline ?? Boolean(cue.accent)}
        />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- radio + light switch

export const RadioUnit: React.FC<{
  t: number;
  msg?: string;
  freq?: number;
  static?: number;
  hand?: boolean;
  on?: boolean;
}> = ({ t, msg = 'ĐỪNG MỞ ĐÈN', freq = 98.6, static: noise = 0.5, hand = true, on = true }) => {
  const glow = on ? 0.8 + 0.2 * Math.sin(t / 6) : 0;
  const scan = Math.sin(t / 18) * 0.4;
  return (
    <g transform="translate(960 620) rotate(-2)">
      {/* panel */}
      <rect x={-430} y={-390} width={860} height={700} rx={38} fill="#0B1320" stroke="#26384F" strokeWidth={5} />
      <rect x={-400} y={-360} width={800} height={250} rx={18} fill="#050B14" stroke="#1B2B40" strokeWidth={3} />
      {/* display */}
      <g opacity={on ? 1 : 0.2}>
        <text x={-370} y={-300} fontFamily={FONT.ui} fontSize={22} fill={FP.muted} letterSpacing={4}>FM · BĂNG TẦN PHÀ</text>
        <text x={0} y={-170} textAnchor="middle" fontFamily={FONT.ui} fontWeight={700} fontSize={92} fill={FP.amber2} opacity={glow} letterSpacing={3}>
          {freq.toFixed(1)}
        </text>
        <text x={0} y={-118} textAnchor="middle" fontFamily={FONT.ui} fontSize={26} fill={FP.amber} opacity={0.8}>
          MHz
        </text>
        {/* message line */}
        <text x={0} y={-16} textAnchor="middle" fontFamily={FONT.body} fontWeight={800} fontSize={54} fill={FP.cream} opacity={clamp((t - 20) / 8)} letterSpacing={2}>
          {msg}
        </text>
      </g>
      {/* tuner scale */}
      <g transform="translate(0 60)">
        {Array.from({ length: 17 }).map((_, i) => (
          <rect key={i} x={-360 + i * 45} y={0} width={2} height={i % 4 === 0 ? 24 : 12} fill={FP.muted} opacity={0.6} />
        ))}
        <rect x={-360 + (freq - 88) * 22 + scan} y={-8} width={4} height={44} fill={FP.red} />
        <text x={-360} y={58} fontFamily={FONT.ui} fontSize={16} fill={FP.muted}>88</text>
        <text x={330} y={58} fontFamily={FONT.ui} fontSize={16} fill={FP.muted}>108</text>
      </g>
      {/* speaker grille */}
      <g opacity={0.7}>
        {Array.from({ length: 7 }).map((_, r) => (
          <rect key={r} x={-380} y={140 + r * 20} width={330} height={7} rx={3.5} fill="#1B2A3E" />
        ))}
      </g>
      {/* knobs */}
      {[{ x: 250, y: 220, r: 76 }, { x: 250, y: 380, r: 54 }].map((k, i) => (
        <g key={i} transform={`translate(${k.x} ${k.y}) rotate(${i ? -40 : 20 + Math.sin(t / 8) * 8})`}>
          <circle r={k.r} fill="#0A1422" stroke="#31445F" strokeWidth={4} />
          <circle r={k.r * 0.72} fill="#15243A" />
          <rect x={-4} y={-k.r * 0.62} width={8} height={k.r * 0.42} rx={4} fill={FP.cream} opacity={0.75} />
        </g>
      ))}
      {/* noise bars */}
      <g transform="translate(-230 250)" opacity={noise}>
        {Array.from({ length: 22 }).map((_, i) => {
          const h = 8 + R(71, i) * 58 * (0.4 + 0.6 * Math.abs(Math.sin(t / 4 + i)));
          return <rect key={i} x={i * 15} y={-h} width={7} height={h} rx={3} fill={FP.green} opacity={0.45} />;
        })}
      </g>
      {hand ? <Hand x={-60} y={330} rot={-24} scale={1.25} pose="reach" t={t} /> : null}
    </g>
  );
};

export const LightSwitch: React.FC<{ t: number; on?: boolean; press?: number; hand?: boolean }> = ({ t, on = false, press = 0, hand = true }) => (
  <g transform="translate(960 660)">
    <rect x={-360} y={-330} width={720} height={620} rx={40} fill="#0B1320" stroke="#26384F" strokeWidth={5} />
    <text x={0} y={-250} textAnchor="middle" fontFamily={FONT.ui} fontSize={24} fill={FP.muted} letterSpacing={6}>ĐÈN PHA</text>
    <rect x={-120} y={-120} width={240} height={320} rx={22} fill="#050B14" stroke="#1B2B40" strokeWidth={3} />
    <g transform={`translate(0 ${-40 + press * 46})`}>
      <rect x={-86} y={-86} width={172} height={172} rx={18} fill={on ? '#2A2108' : '#16202E'} stroke={on ? FP.amber : '#31445F'} strokeWidth={4} />
      <circle cx={0} cy={0} r={16} fill={on ? FP.amber2 : '#31445F'} />
      <text y={52} textAnchor="middle" fontFamily={FONT.ui} fontSize={20} fill={on ? FP.amber2 : FP.muted}>{on ? 'ON' : 'OFF'}</text>
    </g>
    <text x={-300} y={250} fontFamily={FONT.ui} fontSize={18} fill={FP.muted} letterSpacing={3}>BẬT</text>
    <text x={260} y={250} fontFamily={FONT.ui} fontSize={18} fill={FP.muted} letterSpacing={3}>TẮT</text>
    <g opacity={0.5}>
      {Array.from({ length: 5 }).map((_, i) => (
        <rect key={i} x={-340} y={-40 + i * 30} width={40} height={10} rx={5} fill="#1B2A3E" />
      ))}
    </g>
    {hand ? <Hand x={40} y={240} rot={-18} scale={1.35} pose="press" t={t} /> : null}
  </g>
);

// ---------------------------------------------------------------- crowd, eyes, choice

export const Crowd: React.FC<{ t: number; n?: number; y?: number; spread?: number; eyes?: number }> = ({ t, n = 6, y = 690, spread = 520, eyes = 0 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const x = 960 - spread / 2 + (i / Math.max(1, n - 1)) * spread;
      const s = 0.78 + R(81, i) * 0.26;
      const sway = Math.sin(t / 44 + i * 1.7) * 4;
      const h = 150 * s;
      return (
        <g key={i} transform={`translate(${x + sway} ${y}) scale(${s})`} fill="#03070D">
          <ellipse cx={0} cy={-h} rx={26} ry={30} />
          <path d={`M -34 ${-h + 26} Q 0 ${-h + 8} 34 ${-h + 26} L 40 0 L -40 0 Z`} />
          <path d={`M -26 -10 L -30 80 M 26 -10 L 30 80`} stroke="#03070D" strokeWidth={14} strokeLinecap="round" />
          {/* umbrella for every other figure */}
          {i % 2 === 0 ? (
            <g transform={`translate(0 ${-h - 6})`}>
              <path d="M -58 -6 Q 0 -60 58 -6 Q 30 -18 0 -12 Q -30 -18 -58 -6 Z" fill="#050B14" />
              <rect x={-1.5} y={-12} width={3} height={44} fill="#050B14" />
            </g>
          ) : null}
          {eyes > 0 ? (
            <g opacity={eyes}>
              <circle cx={-9} cy={-h - 4} r={3.2} fill="#FFE9B0" />
              <circle cx={9} cy={-h - 4} r={3.2} fill="#FFE9B0" />
            </g>
          ) : null}
        </g>
      );
    })}
  </g>
);

export const EyesInDark: React.FC<{
  t: number;
  n?: number;
  o?: number;
  bg?: boolean;
  /** horizontal distance between pairs, world units */
  spread?: number;
  /** vertical distance between rows, world units */
  rowGap?: number;
  /** centre of the whole block, world units */
  cx?: number;
  cy?: number;
  /** eye size multiplier */
  size?: number;
}> = ({ t, n = 7, o = 1, bg = true, spread = 240, rowGap = 250, cx = 960, cy = 700, size = 1 }) => {
  const perRow = Math.min(4, n);
  const rows = Math.ceil(n / perRow);
  return (
    <g>
      {bg ? <rect x={420} y={-420} width={1080} height={1920} fill="#010308" /> : null}
      {Array.from({ length: n }).map((_, i) => {
        const r = Math.floor(i / perRow);
        const c = i % perRow;
        const inRow = Math.min(perRow, n - r * perRow);
        // each row is centred on cx, so a short last row sits under the middle of the one above
        const x = cx + (c - (inRow - 1) / 2) * spread + (R(91, i) - 0.5) * 50;
        const y = cy + (r - (rows - 1) / 2) * rowGap + (R(92, i) - 0.5) * 60;
        const blink = Math.sin(t / 26 + i * 2.1) > 0.96 ? 0.08 : 1;
        const drift = Math.sin(t / 60 + i) * 3;
        return (
          <g key={i} transform={`translate(${x + drift} ${y}) scale(${size})`} opacity={o}>
            <ellipse cx={-18} cy={0} rx={13} ry={9 * blink} fill="#FFE9B0" />
            <ellipse cx={18} cy={0} rx={13} ry={9 * blink} fill="#FFE9B0" />
            <circle cx={-18} cy={0} r={4.2} fill="#1A0E04" />
            <circle cx={18} cy={0} r={4.2} fill="#1A0E04" />
            <ellipse cx={0} cy={26} rx={34} ry={10} fill="#FFE9B0" opacity={0.03} />
          </g>
        );
      })}
    </g>
  );
};

export const ChoiceCard: React.FC<{ t: number; a: string; b: string; subA?: string; subB?: string; prompt?: string }> = ({
  t,
  a,
  b,
  subA = '6 giây sáng. 7 người nhìn.',
  subB = '9 km mù. Không ai kiểm tra.',
  prompt = 'BÌNH LUẬN  A  HOẶC  B',
}) => {
  const pop = (d: number) => easeOut(clamp((t - d) / 8));
  return (
    <g>
      <rect x={420} y={-420} width={1080} height={1920} fill="#02050A" opacity={0.78} />
      {/* one vertical stack, centred in the 1080x1920 frame (world y 470 is the frame's middle) */}
      <g transform="translate(960 470)">
        <g opacity={pop(2)} transform={`translate(0 ${-360 - (1 - pop(2)) * 20})`}>
          <text textAnchor="middle" fontFamily={FONT.ui} fontSize={24} fill={FP.muted} letterSpacing={8}>LỰA CHỌN</text>
          <text y={118} textAnchor="middle" fontFamily={FONT.title} fontSize={84} fill={FP.cream}>BẠN SẼ LÀM GÌ?</text>
        </g>

        {[
          { y: -80, key: 'A', label: a, sub: subA, color: FP.amber2, d: 8 },
          { y: 180, key: 'B', label: b, sub: subB, color: '#8FC4FF', d: 14 },
        ].map((o) => (
          <g key={o.key} opacity={pop(o.d)} transform={`translate(0 ${o.y + (1 - pop(o.d)) * 30})`}>
            <rect x={-440} y={-92} width={880} height={184} rx={22} fill="#07101C" stroke={o.color} strokeWidth={4} />
            <rect x={-440} y={-92} width={12} height={184} rx={6} fill={o.color} />
            <rect x={-404} y={-44} width={88} height={88} rx={16} fill={o.color} />
            <text x={-360} y={20} textAnchor="middle" fontFamily={FONT.title} fontSize={58} fill="#07101C">{o.key}</text>
            <text x={-286} y={-6} fontFamily={FONT.title} fontSize={58} fill={FP.cream}>{o.label}</text>
            <text x={-286} y={44} fontFamily={FONT.body} fontSize={26} fill={FP.muted}>{o.sub}</text>
          </g>
        ))}

        {/* countdown */}
        <g opacity={pop(20)} transform="translate(0 350)">
          <rect x={-300} y={-8} width={600} height={12} rx={6} fill="#FFFFFF" opacity={0.12} />
          <rect x={-300} y={-8} width={600 * (1 - clamp((t - 20) / 150))} height={12} rx={6} fill={FP.red} />
        </g>

        <g opacity={pop(26)} transform="translate(0 470)">
          <rect x={-330} y={-42} width={660} height={84} rx={42} fill={FP.cream} />
          <text y={12} textAnchor="middle" fontFamily={FONT.ui} fontWeight={700} fontSize={30} fill="#07101C" letterSpacing={3}>{prompt}</text>
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- small helpers

/** A slow push-in that never breaks the frame: use as the outer transform of a shot. */
export const push = (t: number, len: number, from = 1, to = 1.06) => {
  const k = clamp(t / Math.max(1, len));
  return `translate(960 540) scale(${lerp(from, to, k)}) translate(-960 -540)`;
};

/** A radio/VHS flicker for a reveal frame. */
export const flicker = (t: number, at: number, len = 12) => {
  if (t < at || t > at + len) return 1;
  return 0.55 + 0.45 * Math.abs(Math.sin((t - at) * 2.7));
};

/** Deterministic scanline overlay, cheap enough for every frame. */
export const Scanlines: React.FC<{ o?: number }> = ({ o = 0.06 }) => (
  <g opacity={o}>
    {Array.from({ length: 54 }).map((_, i) => (
      <rect key={i} x={420} y={-420 + i * 36} width={1080} height={2} fill="#000" />
    ))}
  </g>
);

/** A soft warm light pool, for a lamp or a screen spill. A radial gradient, so no visible rim. */
export const LightPool: React.FC<{ x: number; y: number; r: number; color?: string; o?: number }> = ({ x, y, r, color = '#FFC46B', o = 0.18 }) => {
  // deterministic id: identical pools share a gradient, which is harmless
  const id = `lp-${Math.round(x)}-${Math.round(y)}-${Math.round(r)}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={color} stopOpacity={o} />
          <stop offset="45%" stopColor={color} stopOpacity={o * 0.55} />
          <stop offset="78%" stopColor={color} stopOpacity={o * 0.16} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </g>
  );
};

/** kf alias re-exported for shot files that only import this pack. */
export { kf };
