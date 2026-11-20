import React from 'react';
import { Mirror, WetGlass } from './wide';

// Vertical (1080x1920) set pieces for "Chuyến xe không có khách".
//
// The world is still 1920x1080 and the vertical stage shows the window x 420..1500, y -420..1500
// (see STAGES.vertical). So everything here is drawn in world coordinates, but composed *inside that
// portrait window*: the sky fills the top, the road recedes to the centre, the dash sits at the bottom.
//
// The skill's <Cabin> already draws a correct night-vehicle cabin for this window (roof, pillars,
// wipers, binnacle, wheel, hands) — this file only adds the road outside it and the taxi-specific bits.

export const TV = {
  ink: '#05080F',
  night: '#0A1730',
  night2: '#122A4A',
  horizon: '#1E4670',
  road: '#060B12',
  sheen: '#1B3E63',
  glass: '#0C2036',
  cyan: '#9FD3F5',
  amber: '#F2B33D',
  lcd: '#8FE3B0',
  blood: '#B3261E',
};

/** Viewport of the vertical stage, in world coordinates. */
export const VIEW = { x0: 420, x1: 1500, y0: -420, y1: 1500 };

const rnd = (i: number, k = 1) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ------------------------------------------------------------------ road

/** A wet suburban road seen down its own throat. The vanishing point stays at world (960, 560). */
export const RoadV: React.FC<{ t: number; rain?: number; speed?: number; lamps?: number }> = ({ t, rain = 0.7, speed = 0.4, lamps = 3 }) => {
  const VX = 960;
  const VY = 320;
  const drift = (t * speed * 10) % 200;
  return (
    <g>
      <defs>
        <linearGradient id="tvSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#02050A" />
          <stop offset="55%" stopColor={TV.night} />
          <stop offset="100%" stopColor={TV.horizon} />
        </linearGradient>
        <linearGradient id="tvRoad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B1A2C" />
          <stop offset="30%" stopColor={TV.road} />
          <stop offset="100%" stopColor="#03060B" />
        </linearGradient>
        <radialGradient id="tvPool">
          <stop offset="0%" stopColor={TV.amber} stopOpacity={0.55} />
          <stop offset="100%" stopColor={TV.amber} stopOpacity={0} />
        </radialGradient>
      </defs>

      <rect x={VIEW.x0} y={VIEW.y0} width={1080} height={740} fill="url(#tvSky)" />
      <rect x={VIEW.x0} y={VY} width={1080} height={VIEW.y1 - VY} fill="url(#tvRoad)" />

      {/* far treeline: a low band that meets the road at the vanishing point */}
      <path d={`M ${VIEW.x0} ${VY + 4} L ${VIEW.x0} ${VY - 46} q 50 -22 100 -4 q 46 -20 96 -2 q 52 -22 104 -2 q 48 -18 98 0 q 54 -20 108 -2 q 50 -18 102 0 q 54 -18 108 -2 q 50 -16 104 0 L ${VIEW.x1} ${VY - 50} L ${VIEW.x1} ${VY + 4} Z`} fill="#03070D" />

      {/* streetlights down the left and right verge, shrinking with distance */}
      {Array.from({ length: lamps }).map((_, i) => {
        const k = (i + 1) / (lamps + 1);
        const y = VY + 70 + k * k * 880;
        const scale = 0.25 + k * 1.15;
        const x = VX - 300 - k * 260 + ((drift * (0.2 + k)) % 40);
        return (
          <g key={i} opacity={0.85}>
            <rect x={x} y={y - 300 * scale} width={4 * scale} height={300 * scale} fill="#070D15" />
            <rect x={x - 26 * scale} y={y - 300 * scale} width={56 * scale} height={5 * scale} fill="#070D15" />
            <circle cx={x + 28 * scale} cy={y - 296 * scale} r={40 * scale} fill="url(#tvPool)" />
            <circle cx={x + 28 * scale} cy={y - 296 * scale} r={7 * scale} fill={TV.amber} opacity={0.9} />
            <rect x={x + 24 * scale} y={y} width={8 * scale} height={220 * scale} fill={TV.amber} opacity={0.05} />
          </g>
        );
      })}

      {/* centre line, receding */}
      {Array.from({ length: 8 }).map((_, i) => {
        const p = (i + (t * speed) % 1) / 8;
        const y = VY + 80 + p * p * 900;
        const w = 8 + p * 54;
        return <rect key={i} x={VX - w / 2} y={y} width={w} height={3 + p * 8} fill={TV.cyan} opacity={0.1 + p * 0.14} />;
      })}

      {/* wet sheen at the horizon */}
      <rect x={VIEW.x0} y={VY} width={1080} height={90} fill={TV.sheen} opacity={0.05} />

      {/* rain */}
      {Array.from({ length: Math.round(150 * rain) }).map((_, i) => {
        const x = VIEW.x0 - 60 + rnd(i, 1) * 1200;
        const y = VIEW.y0 + ((rnd(i, 2) * 1920 + t * (760 + rnd(i, 3) * 380)) % 1920);
        const l = 30 + rnd(i, 4) * 54;
        return <line key={i} x1={x} y1={y} x2={x - l * 0.2} y2={y + l} stroke={TV.cyan} strokeWidth={1.6} opacity={0.07 + rnd(i, 5) * 0.14} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ cabin (vertical)

/** The taxi interior for the 1080x1920 window, built for this film rather than cropped from the
 *  studio's vertical Cabin: a real headliner across the top, the mirror hanging from it, thin A-pillars,
 *  and glass that runs the full width. Coordinates are world (x 420..1500 is the visible window). */
export const CabinV: React.FC<{ t: number; wheel?: number; wipers?: number; speed?: number; dashGlow?: number }> = ({
  t,
  wheel = 0,
  wipers = 0,
  speed = 0.35,
  dashGlow = 1,
}) => {
  const shake = Math.sin(t * 0.9) * 1.1 * speed;
  const wipe = Math.sin(t / 22) * 0.5 + 0.5;
  return (
    <g transform={`translate(0 ${shake})`}>
      {/* glass, and the rain on it */}
      <rect x={420} y={-250} width={1080} height={1370} fill={TV.glass} opacity={0.1} />
      <WetGlass t={t} amount={0.8} />

      {/* headliner: a band with a soft sag, not a straight strip */}
      <path d="M 420 -420 L 1500 -420 L 1500 -252 Q 960 -218 420 -252 Z" fill="#060A11" />
      <path d="M 420 -258 Q 960 -224 1500 -258 L 1500 -244 Q 960 -210 420 -244 Z" fill="#141D29" opacity={0.9} />
      <path d="M 430 -262 Q 960 -228 1490 -262" stroke="#24344A" strokeWidth={2} fill="none" opacity={0.5} />

      {/* mirror stalk, from the headliner down */}
      <rect x={952} y={-256} width={16} height={64} fill="#05080E" />
      <rect x={944} y={-200} width={32} height={10} rx={4} fill="#0A111A" />

      {/* A-pillars: thin and angled, so the glass stays wide */}
      <path d="M 420 -256 L 470 -256 L 540 1210 L 420 1210 Z" fill="#060A11" />
      <path d="M 1500 -256 L 1450 -256 L 1380 1210 L 1500 1210 Z" fill="#060A11" />
      <path d="M 470 -256 L 486 -256 L 558 1210 L 540 1210 Z" fill="#0B1420" opacity={0.9} />
      <path d="M 1450 -256 L 1434 -256 L 1362 1210 L 1380 1210 Z" fill="#0B1420" opacity={0.9} />

      {/* wipers: parked along the bottom of the glass, one slow sweep */}
      <g transform={`translate(700 1086) rotate(${-6 + wipe * 8})`}>
        <rect x={0} y={-8} width={470} height={9} rx={4.5} fill="#05090F" opacity={0.9} />
        <rect x={0} y={-12} width={16} height={16} rx={6} fill="#05090F" opacity={0.9} />
      </g>
      <g transform={`translate(1120 1100) rotate(${4 - wipe * 6})`}>
        <rect x={-420} y={-8} width={420} height={9} rx={4.5} fill="#05090F" opacity={0.85} />
      </g>

      {/* dashboard, curved, filling the bottom fifth */}
      <path d="M 420 1128 Q 960 1074 1500 1128 L 1500 1500 L 420 1500 Z" fill="#070D16" />
      <path d="M 420 1128 Q 960 1074 1500 1128 L 1500 1168 Q 960 1116 420 1168 Z" fill="#101A29" />
      <rect x={420} y={1132} width={1080} height={3} fill="#2C3C54" opacity={0.4} />

      {/* instrument binnacle */}
      <g transform="translate(960 1210)">
        <rect x={-250} y={-46} width={500} height={132} rx={24} fill="#050A12" stroke="#1A2940" strokeWidth={3} />
        {[-120, 120].map((dx, i) => {
          const p = 0.35 + 0.25 * Math.sin(t / (30 + i * 8) + i);
          return (
            <g key={dx} transform={`translate(${dx} 14)`}>
              <circle r={40} fill="#0A1524" stroke="#2A3D58" strokeWidth={3} />
              <line x1={0} y1={0} x2={Math.cos(-2.2 + p * 4.4) * 26} y2={Math.sin(-2.2 + p * 4.4) * 26} stroke={TV.amber} strokeWidth={4} strokeLinecap="round" />
              <circle r={3.5} fill={TV.amber} />
            </g>
          );
        })}
      </g>

      {/* wheel: only the top third is in frame */}
      <g transform={`translate(960 1430) rotate(${wheel})`}>
        <ellipse rx={340} ry={150} fill="none" stroke="#070C14" strokeWidth={56} />
        <ellipse rx={340} ry={150} fill="none" stroke="#1D2A3E" strokeWidth={40} />
        <ellipse rx={340} ry={150} fill="none" stroke="#2C3D56" strokeWidth={5} opacity={0.65} />
        <path d="M -300 0 Q 0 54 300 0" fill="none" stroke="#1D2A3E" strokeWidth={24} />
        <path d="M -18 40 L -12 150 M 18 40 L 12 150" stroke="#1D2A3E" strokeWidth={24} strokeLinecap="round" />
        <rect x={-62} y={-14} width={124} height={50} rx={15} fill="#131F30" stroke="#31445F" strokeWidth={3} />
        <text y={22} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={16} fill="#5B6E86">
          51B-234.56
        </text>
      </g>

      {/* light from the instruments on the dash */}
      <ellipse cx={960} cy={1160} rx={380} ry={90} fill={TV.amber} opacity={0.035 * dashGlow} />
    </g>
  );
};

/** The taxi's own clock: a small green LCD to the right of the binnacle. `x/y` are world coordinates. */
export const Clock: React.FC<{ text: string; x?: number; y?: number; glow?: number }> = ({ text, x = 1258, y = 1150, glow = 0.9 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-84} y={-26} width={168} height={52} rx={9} fill="#040B08" stroke="#16362A" strokeWidth={2} />
    <text x={0} y={9} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={30} letterSpacing={2} fill={TV.lcd} opacity={glow}>
      {text}
    </text>
  </g>
);

/** One blood drop, falling through the windscreen in front of the driver. */
export const BloodDrop: React.FC<{ t: number; x?: number }> = ({ t, x = 700 }) => {
  const p = Math.min(1, (t % 96) / 78);
  const y = -380 + p * 1000;
  return (
    <g opacity={p > 0.94 ? 0 : 1}>
      <ellipse cx={x} cy={y} rx={6} ry={10} fill={TV.blood} />
      <rect x={x - 1.5} y={y - 56} width={3} height={42} fill={TV.blood} opacity={0.4} />
      <ellipse cx={x} cy={y - 50} rx={2.5} ry={4.5} fill={TV.blood} opacity={0.5} />
    </g>
  );
};

/** Rear-view mirror, parked under the roof edge of the vertical window. */
export const MirrorV: React.FC<{ t: number; occupant?: 'none' | 'woman' }> = ({ t, occupant = 'none' }) => (
  <Mirror t={t} occupant={occupant} x={872} y={-198} w={176} h={104} />
);

// ------------------------------------------------------------------ the woman in the glass

/** Her, seen only inside a mirror or a reflection.
 *  One solid mass of long hair with a side-swept fringe (not a cap, not separate strands), two slim
 *  locks falling in front of the shoulders. Red points for eyes, mouth open, blood from the left temple
 *  down the cheek to the collar. */
export const WomanInGlass: React.FC<{ t: number; s?: number; drop?: boolean; face?: boolean }> = ({ t, s = 1, drop = false, face = false }) => {
  const p = (t % 90) / 90;
  return (
    <g transform={`scale(${s})`}>
      {/* the mass behind: long hair past the shoulders */}
      <path d="M -38 -34 Q -46 46 -40 104 L 40 104 Q 46 46 38 -34 Q 22 -50 0 -50 Q -22 -50 -38 -34 Z" fill="#04060A" />
      {/* jacket body */}
      <path d="M -74 108 q 4 -60 74 -66 q 70 6 74 66 l -14 16 q -60 -24 -120 0 Z" fill="#8F9AA5" />
      {/* neck, straight down from the jaw into the collar */}
      <path d="M -9 24 q 9 -6 18 0 l 5 48 q -14 6 -28 0 Z" fill="#66717D" />
      <path d="M -9 24 q 9 -6 18 0 l 2 22 q -11 4 -22 0 Z" fill="#7C8794" opacity={0.5} />
      <path d="M 7 30 l 3 36" stroke="#4E5863" strokeWidth={3} opacity={0.35} />
      {/* collar, drawn over the neck so the join is hidden */}
      <path d="M -22 50 l 22 36 l 22 -36 l 10 6 l -32 46 l -32 -46 Z" fill="#A9B3BD" />
      {/* head, bowing forward */}
      <g transform="rotate(12)">
        <ellipse cx={0} cy={2} rx={27} ry={33} fill="#6C7784" />
        <path d="M -23 -4 q 23 12 46 0 l 0 28 q -23 9 -46 0 Z" fill="#5C6774" opacity={0.85} />
        {/* blood first, so the fringe covers its top edge and it reads as soaked in */}
        <path d="M -28 0 q 11 -7 19 1 q 8 7 3 14 q -7 9 -16 9 q -11 0 -14 -8 q -3 -7 8 -16 Z" fill="#8E1B15" opacity={0.92} />
        <path d="M -25 10 q 8 6 11 15 q -2 7 -9 4 q -6 -7 -8 -13 Z" fill="#7A1712" opacity={0.9} />
        <path d="M -23 14 l -2 24" stroke="#7A1712" strokeWidth={4.2} strokeLinecap="round" />
        <path d="M -14 19 l -1 16" stroke="#7A1712" strokeWidth={3.2} strokeLinecap="round" />
        <circle cx={-25} cy={42} r={2.6} fill="#7A1712" />
        <circle cx={-15} cy={38} r={2} fill="#7A1712" />
        {/* the fringe sits over the top of the blood */}
        <path d="M -32 -22 Q -36 -50 0 -52 Q 36 -50 32 -22 L 30 4 Q 24 18 18 4 Q 10 18 2 4 Q -6 18 -14 4 Q -22 18 -28 4 Z" fill="#05070A" />
        {/* eyes: black rim, one red point */}
        <ellipse cx={-8} cy={13} rx={5.2} ry={3.2} fill="#05070A" />
        <ellipse cx={10} cy={12} rx={5.4} ry={3.4} fill="#05070A" />
        <circle cx={-8} cy={13} r={1.7} fill="#C0392B" />
        <circle cx={10} cy={12} r={1.8} fill="#C0392B" />
        <circle cx={-8} cy={13} r={9} fill="#E8402F" opacity={0.16} />
        <circle cx={10} cy={12} r={9.4} fill="#E8402F" opacity={0.16} />
        {/* mouth, open a little wider */}
        <ellipse cx={2} cy={27} rx={6.2} ry={3.4} fill="#1E181C" />
      </g>
      {/* shade across the jacket */}
      <path d="M -74 108 q 4 -60 74 -66 l 0 12 q -60 8 -66 60 Z" fill="#0A1018" opacity={0.22} />
      <path d="M 74 108 q -4 -60 -74 -66 l 0 12 q 60 8 66 60 Z" fill="#E4EAF0" opacity={0.12} />
      {/* blood soaked into the collar */}
      <path d="M -16 52 q 12 6 8 18 l -12 0 q -5 -12 4 -18 Z" fill="#6E1512" opacity={0.45} />
      {/* two slim tapered locks in front of the shoulders */}
      <path d="M -36 -12 q -10 44 -6 86 l 9 -2 q -2 -42 5 -80 Z" fill="#05070A" />
      <path d="M 36 -12 q 10 42 6 84 l -9 -2 q 2 -40 -5 -78 Z" fill="#05070A" />
      {/* light: warm dash on one cheek, cold glass on the other */}
      <g transform="rotate(12)" opacity={0.5}>
        <path d="M 12 2 q 10 12 8 26 q -6 8 -12 6 q 2 -18 -4 -30 Z" fill="#F2B33D" opacity={0.18} />
        <path d="M -20 4 q -8 14 -6 26 q 4 6 9 4 q -2 -16 2 -28 Z" fill="#9FD3F5" opacity={0.16} />
      </g>
      {drop ? <circle cx={24} cy={64 + p * 22} r={3.2} fill="#DCEBFF" opacity={0.7} /> : null}
    </g>
  );
};


/** A five-fingered hand on the wheel rim. Built around the anchor the rig gives for the end of the
 *  forearm, so the wrist always overlaps the sleeve: skin cuff -> palm -> four fingers over the rim ->
 *  thumb inside. No rotation by default; pass `rot` to follow a sloping rim. */
export const WheelHand: React.FC<{
  x: number;
  y: number;
  mirror?: boolean;
  s?: number;
  rot?: number;
  torn?: boolean;
}> = ({ x, y, mirror = false, s = 1, rot = 0, torn = false }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${mirror ? -s : s} ${s})`}>
    {/* wrist: starts well inside the sleeve so there is no seam to see */}
    <path d="M -24 -78 q 24 -8 48 0 l 6 62 q -30 10 -60 0 Z" fill="#C08A63" />
    {/* palm */}
    <path d="M -40 -30 q 40 -18 78 2 q 12 26 0 46 q -38 16 -78 2 q -12 -24 0 -50 Z" fill="#C08A63" />
    <path d="M -40 -30 q 40 -18 78 2 q 2 6 0 12 q -38 -16 -78 -2 Z" fill="#B47A55" opacity={0.28} />
    {/* four fingers curling over the rim */}
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(${-31 + i * 21} 0) rotate(${(1.5 - i) * 5})`}>
        <rect x={-9.5} y={-4} width={19} height={54} rx={9.5} fill="#C08A63" />
        <rect x={-9.5} y={34} width={19} height={16} rx={8} fill="#A67150" opacity={0.5} />
      </g>
    ))}
    {/* thumb: a capsule off the inner edge, angled at the hub */}
    <g transform="rotate(38 42 -14)">
      <rect x={32} y={-38} width={22} height={54} rx={11} fill="#B47A55" />
      <path d="M 36 -30 q 14 4 14 16" stroke="#A66A46" strokeWidth={2.4} fill="none" opacity={0.5} />
    </g>
    {torn ? <path d="M -26 -18 l 26 6 M -22 -2 l 22 3" stroke="#B3261E" strokeWidth={3.4} strokeLinecap="round" /> : null}
  </g>
);

/** A hand actually gripping the wheel: palm outside the rim, fingers curling over it,
 *  thumb on the inside. `side` -1 = left hand (screen left of centre). */
export const GripHand: React.FC<{ x: number; y: number; side: 1 | -1; t: number; torn?: boolean; s?: number }> = ({ x, y, side, t, torn = false, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${side * -14 + Math.sin(t / 50) * 1.5})`}>
    {/* wrist */}
    <path d="M -34 26 q 34 14 68 0 l 6 40 q -40 16 -80 0 Z" fill="#B47A55" />
    {/* palm, sitting outside the rim */}
    <path d="M -60 -46 q 60 -24 112 4 q 16 38 0 62 q -52 22 -106 0 q -16 -34 -6 -66 Z" fill="#C98E68" />
    {/* fingers curling over the rim, tips coming down on the inside */}
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`rotate(${(i - 1.5) * 3} ${-44 + i * 27} -6)`}>
        <rect x={-52 + i * 27} y={-4} width={25} height={58} rx={12.5} fill="#C98E68" />
        <rect x={-52 + i * 27} y={38} width={25} height={16} rx={8} fill="#B47A55" opacity={0.55} />
      </g>
    ))}
    {/* thumb: on the inside of the wheel, pointing toward its centre */}
    <ellipse cx={side * 44} cy={-18} rx={15} ry={33} fill="#B47A55" transform={`rotate(${side * -26} ${side * 44} -18)`} />
    {torn ? (
      <g opacity={0.9}>
        <path d="M -18 -18 l 26 8 M -14 0 l 22 3" stroke="#B3261E" strokeWidth={3.2} strokeLinecap="round" />
      </g>
    ) : null}
  </g>
);

/** A big mirror close-up: the frame, the glass, her inside it. Used when the mirror is the subject. */
export const BigMirror: React.FC<{ t: number; occupant?: 'none' | 'woman'; x?: number; y?: number; w?: number; h?: number }> = ({
  t,
  occupant = 'woman',
  x = 640,
  y = -186,
  w = 640,
  h = 340,
}) => (
  <g>
    <rect x={x + w / 2 - 10} y={-256} width={20} height={y + 266} fill="#060A10" />
    <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={18} fill="#0A121C" stroke="#1A2838" strokeWidth={4} />
    <rect x={x} y={y} width={w} height={h} rx={10} fill="#071018" />
    <clipPath id="bmClip">
      <rect x={x} y={y} width={w} height={h} rx={10} />
    </clipPath>
    <g clipPath="url(#bmClip)">
      <rect x={x} y={y} width={w} height={h} fill="#0A1B2B" />
      {/* what the mirror actually reflects: the road behind, out of focus */}
      <rect x={x} y={y + h * 0.66} width={w} height={h * 0.54} fill="#071320" />
      <rect x={x} y={y + h * 0.66} width={w} height={2} fill="#3A5A78" opacity={0.35} />
      <circle cx={x + w * 0.79} cy={y + h * 0.74} r={26} fill={TV.amber} opacity={0.18} />
      <circle cx={x + w * 0.79} cy={y + h * 0.74} r={5} fill={TV.amber} opacity={0.5} />
      <rect x={x} y={y + h * 0.66} width={w} height={h * 0.5} fill="#050C14" opacity={0.45} />
      {occupant === 'woman' ? (
        <g transform={`translate(${x + w / 2} ${y + h * 0.4})`}>
          <WomanInGlass t={t} s={1.85} drop face />
        </g>
      ) : null}
      <rect x={x} y={y} width={w} height={h} fill="url(#bmSheen)" opacity={0.14} />
      {/* the glass is murky: a dark veil and a vignette, so she is hard to read */}
      <rect x={x} y={y} width={w} height={h} fill="#02060B" opacity={0.26} />
      <rect x={x} y={y} width={w} height={h} fill="url(#bmVig)" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#2A3D52" strokeWidth={2} opacity={0.35} />
    </g>
    <defs>
      <radialGradient id="bmVig" cx="50%" cy="45%" r="62%">
        <stop offset="45%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.72} />
      </radialGradient>
      <linearGradient id="bmSheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#CFE6FF" stopOpacity={0.45} />
        <stop offset="40%" stopColor="#CFE6FF" stopOpacity={0} />
      </linearGradient>
    </defs>
  </g>
);

// ------------------------------------------------------------------ insert: radio

/** The radio, off. All the light in the shot comes from its thin amber strip. */
export const RadioPanel: React.FC<{ t: number; on?: number }> = ({ t, on = 0.2 }) => {
  const flick = on * (0.85 + 0.15 * Math.sin(t / 7));
  return (
    <g>
      <rect x={420} y={-420} width={1080} height={1920} fill="#060A11" />
      <rect x={470} y={560} width={980} height={720} rx={26} fill="#0A111B" stroke="#1A2A3D" strokeWidth={3} />
      <rect x={500} y={590} width={920} height={190} rx={12} fill="#050A11" stroke="#152435" strokeWidth={2} />
      <text x={960} y={700} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={64} letterSpacing={6} fill="#7A5A22" opacity={flick}>
        FM 103.5
      </text>
      <rect x={520} y={820} width={880} height={16} rx={8} fill="#050A11" stroke="#152435" strokeWidth={2} />
      <rect x={560} y={856} width={800} height={10} rx={5} fill="#0B1420" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${610 + i * 150} 960)`}>
          <circle r={34} fill="#0A1524" stroke="#23354E" strokeWidth={3} />
          <circle r={26} fill="#08111C" />
          <line x1={0} y1={-16} x2={0} y2={16} stroke="#3C5A78" strokeWidth={4} strokeLinecap="round" />
        </g>
      ))}
      <circle cx={1290} cy={960} r={52} fill="#0A1524" stroke="#23354E" strokeWidth={3} />
      <circle cx={1290} cy={960} r={40} fill="#08111C" />
      <path d="M 1290 928 L 1290 992" stroke="#C98E68" strokeWidth={7} strokeLinecap="round" />
      <rect x={560} y={1050} width={360} height={26} rx={13} fill="#050A11" stroke="#1A2A3D" strokeWidth={2} />
      <text x={740} y={1068} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={16} fill="#33495F">
        TAXI · 51B-234.56
      </text>
    </g>
  );
};
