import React from 'react';
import { FlatHero, FlatLight, flatHandL, flatHandR, flatJoints } from './flat';
import { HandSpec, handSpecFor } from './look';
import { basePose, Look, Pose } from './rig';
import { Mirror, MirrorEyes, WetGlass } from './wide';

export { Mirror };

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
  wipers = 1,
  speed = 0.35,
  dashGlow = 1,
}) => {
  const shake = Math.sin(t * 0.9) * 1.1 * speed;
  const wipe = wipers === 0 ? 0.52 : typeof wipers === 'number' ? (wipers > 0 && wipers <= 1 ? wipers : (Math.sin(t / 22) * 0.5 + 0.5)) : (Math.sin(t / 22) * 0.5 + 0.5);
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
        <circle r={13} fill="none" stroke="#4A6078" strokeWidth={4} />
        <path d="M -7 0 L 7 0" stroke="#4A6078" strokeWidth={3} />
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
    {/* a small plate decal stuck on the dash under the clock */}
    <rect x={-64} y={40} width={128} height={30} rx={4} fill="#DDE4EA" opacity={0.8} />
    <text x={0} y={61} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={17} fill="#0A1119">
      51B-234.56
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
export const MirrorV: React.FC<{ t: number; occupant?: 'none' | 'woman' | 'hung' }> = ({ t, occupant = 'none' }) => (
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
        {/* eyes: black rims, and only one of them carries a red point */}
        <ellipse cx={-8} cy={13} rx={5.2} ry={3.2} fill="#05070A" />
        <ellipse cx={10} cy={12} rx={5.4} ry={3.4} fill="#05070A" />
        <circle cx={10} cy={12} r={1.8} fill="#C0392B" />
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


/** The wheel itself: three concentric strokes, a hub and three spokes. */
export const Wheel: React.FC<{ cx: number; cy: number; rx?: number; ry?: number }> = ({ cx, cy, rx = 300, ry = 136 }) => (
  <g transform={`translate(${cx} ${cy})`}>
    <ellipse rx={rx} ry={ry} fill="none" stroke="#070C14" strokeWidth={46} />
    <ellipse rx={rx} ry={ry} fill="none" stroke="#1B2838" strokeWidth={32} />
    <ellipse rx={rx} ry={ry} fill="none" stroke="#2A3B52" strokeWidth={3} opacity={0.6} />
    <circle r={54} fill="#0B1119" stroke="#2A3B52" strokeWidth={4} />
    {[195, 265, 340].map((deg) => (
      <line
        key={deg}
        x1={Math.cos((deg * Math.PI) / 180) * 50}
        y1={Math.sin((deg * Math.PI) / 180) * 50 * 0.72}
        x2={Math.cos((deg * Math.PI) / 180) * (rx - 30)}
        y2={Math.sin((deg * Math.PI) / 180) * (ry - 26)}
        stroke="#10171F"
        strokeWidth={24}
        strokeLinecap="round"
      />
    ))}
  </g>
);

/** A driver at the wheel, assembled from the things that must never drift apart: the pose gives the
 *  hand anchors, the wheel is placed from those anchors, the lap panel cuts the legs, and the two
 *  hands are drawn on the rim. Use this instead of positioning a hero + wheel + hands by hand. */
export const DriverAtWheel: React.FC<{
  t: number;
  pose: Pose;
  look: Look;
  wheelRx?: number;
  wheelRy?: number;
  torn?: boolean;
  light?: FlatLight;
  lap?: string;
}> = ({ t, pose, look, wheelRx = 300, wheelRy = 136, torn = true, light, lap = '#070C13' }) => {
  const hl = flatHandL(pose, look.armLen ?? 1);
  const hr = flatHandR(pose, look.armLen ?? 1);
  const rimY = (hl.y + hr.y) / 2;
  // the wrist must be as wide as the forearm where they meet, or a step shows at the cuff
  const handS = 0.95;
  const wristW = (16 * (look.armW ?? 1) * pose.scale) / handS;
  // and it must sit on the forearm's own axis: the hand is level, the arm is not
  const j = flatJoints(pose, look.armLen ?? 1);
  const up = (a: { mid: { x: number; y: number }; end: { x: number; y: number } }) => {
    const dx = a.mid.x - a.end.x;
    const dy = a.mid.y - a.end.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  };
  const upL = up(j.armL);
  const upR = up(j.armR);
  return (
    <g>
      <FlatHero pose={pose} look={look} light={light} hands={false} />
      {/* the lap: only between the two hands, so the arms stay visible */}
      <rect x={hl.x + 44} y={rimY - 96} width={Math.max(0, hr.x - hl.x - 88)} height={820} fill={lap} />
      <rect x={420} y={rimY + 26} width={1080} height={900} fill={lap} />
      <Wheel cx={960} cy={rimY + wheelRy} rx={wheelRx} ry={wheelRy} />
      <WheelHand x={hl.x} y={hl.y} s={handS} wristW={wristW} cuff={upL} look={look} />
      <WheelHand x={hr.x} y={hr.y} mirror s={handS} wristW={wristW} cuff={{ x: -upR.x, y: upR.y }} torn={torn} look={look} />
    </g>
  );
};

/** A POV forearm: the driver's own sleeve running from the bottom edge of the frame to the hand on
 *  the wheel. Without it a hand on the rim reads as a hand with no arm. */
export const PovArm: React.FC<{ x: number; y: number; side: 1 | -1; look?: Look; hand?: HandSpec }> = ({ x, y, side, look, hand }) => {
  const H = hand ?? handSpecFor(look);
  const x0 = x + side * 52;
  const y0 = 1580;
  const dx = x - x0;
  const dy = y - 52 - y0;
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  return (
    <g transform={`translate(${x0} ${y0}) rotate(${ang})`}>
      {/* bare forearm: narrower at the wrist, so nothing pokes out past the hand */}
      <path d={`M -23 ${-len} L 23 ${-len} L 45 0 L -45 0 Z`} fill={H.forearm} />
      <path d={`M 6 ${-len + 12} L 20 ${-len + 12} L 36 -6 L 18 -6 Z`} fill={H.forearmShade} opacity={0.16} />
      {/* the sleeve, only at the frame edge */}
      <path d="M -45 -96 L 45 -96 L 45 0 L -45 0 Z" fill={H.sleeve} />
      <rect x={-47} y={-104} width={94} height={16} rx={8} fill={H.sleeveShade} />
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
  /** width of the wrist at the top, before `s` (48 = the rig's default). Pass the forearm's width so
   *  the wrist tapers out of the arm instead of stepping in from it. */
  wristW?: number;
  /** which way the forearm runs from this hand, in local units (default {0,-1} = straight up). The cup
   *  of the wrist is drawn on that axis, so a slanted arm and a level hand meet with no wedge. */
  cuff?: { x: number; y: number };
  /** true = the hand is on the far side of the rim: back of the hand behind the wheel, fingers hooking over it */
  flip?: boolean;
  /** The character this hand belongs to. Colour comes from the Body Lock, never a literal. */
  look?: Look;
  /** Precomputed palette, for callers that assemble several props from one spec. */
  hand?: HandSpec;
}> = ({ x, y, mirror = false, s = 1, rot = 0, torn = false, wristW = 48, cuff, flip = false, look, hand }) => {
  const H = hand ?? handSpecFor(look);
  return (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${mirror ? -s : s} ${flip ? -s : s})`}>
    {flip ? (
      <g>
        {/* the forearm, drawn in the hand's own frame so it can never kink: after the flip, local
            -y is down the screen, i.e. back toward the driver */}
        <path d="M -24 -58 L 24 -58 L 46 -760 L -46 -760 Z" fill={H.forearm} />
        <path d="M 8 -120 L 20 -120 L 38 -720 L 22 -720 Z" fill={H.forearmShade} opacity={0.14} />
        {/* sleeve, only at the bottom edge of the frame */}
        <path d="M -47 -560 L 47 -560 L 47 -760 L -47 -760 Z" fill={H.sleeve} />
        <rect x={-49} y={-574} width={98} height={16} rx={8} fill={H.sleeveShade} />
      </g>
    ) : null}
    {/* wrist: starts well inside the sleeve so there is no seam to see. With a `wristW` it reaches the
        forearm's full width and tapers down into the palm, so no step shows at the cuff */}
    {wristW === 48 ? (
      <path d="M -24 -78 q 24 -8 48 0 l 6 62 q -30 10 -60 0 Z" fill={H.skin} />
    ) : (
      (() => {
        // the cuff continues the forearm: its top edge sits square across the arm's own axis, at the
        // arm's own width, so the two silhouettes meet with no wedge and no step
        const W = wristW / 2;
        const ux = cuff?.x ?? 0;
        const uy = cuff?.y ?? -1;
        const CUFF_H = 74;
        const cx = ux * CUFF_H;
        const cy = uy * CUFF_H;
        const px = -uy;
        const py = ux;
        return (
          <path
            d={`M ${cx - px * W} ${cy - py * W} L ${cx + px * W} ${cy + py * W} L ${W} -24 L ${-W} -24 Z`}
            fill={H.skin}
          />
        );
      })()
    )}
    {/* palm */}
    <path d="M -40 -30 q 40 -18 78 2 q 12 26 0 46 q -38 16 -78 2 q -12 -24 0 -50 Z" fill={H.skin} />
    <path d="M -40 -30 q 40 -18 78 2 q 2 6 0 12 q -38 -16 -78 -2 Z" fill={H.shade} opacity={0.28} />
    {/* four fingers curling over the rim */}
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(${-31 + i * 21} 0) rotate(${(1.5 - i) * 5})`}>
        <rect x={-9.5} y={-4} width={19} height={flip ? 38 : 66} rx={9.5} fill={H.skin} />
        <rect x={-9.5} y={flip ? 16 : 46} width={19} height={16} rx={8} fill={H.shade} opacity={0.5} />
      </g>
    ))}
    {/* thumb: a capsule off the inner edge, angled at the hub */}
    <g transform="rotate(38 42 -14)">
      <rect x={32} y={-40} width={22} height={62} rx={11} fill={H.shade} />
      <path d="M 36 -30 q 14 4 14 16" stroke={H.shade} strokeWidth={2.4} fill="none" opacity={0.5} />
    </g>
    {torn ? <path d="M -26 -18 l 26 6 M -22 -2 l 22 3" stroke="#B3261E" strokeWidth={3.4} strokeLinecap="round" /> : null}
  </g>
  );
};

/** ONE canonical pose for the POV wheel shots. The hands are derived from its anchors, so a change
 *  in the driver's arm length or the wheel geometry moves both hands together — no per-shot x/y. */
export const POV_WHEEL_POSE: Pose = {
  ...basePose,
  x: 960,
  y: 1080,
  scale: 3.5,
  armL: { a: 2, b: -12 },
  armR: { a: 6, b: -20 },
};

/** The two POV hands on the rim, placed from `POV_WHEEL_POSE` and painted from `look`.
 *  Use this instead of writing `<WheelHand x={760} y={1308} .../>` in every shot. */
export const PovWheelHands: React.FC<{ look?: Look; torn?: boolean; rimTilt?: number; t?: number }> = ({ look, torn = true, rimTilt = 14, t = 0 }) => {
  const armLen = look?.armLen ?? 1.35;
  const hl = flatHandL(POV_WHEEL_POSE, armLen);
  const hr = flatHandR(POV_WHEEL_POSE, armLen);
  const tilt = rimTilt + Math.sin(t / 60) * 1.2;
  return (
    <g>
      <WheelHand x={hl.x} y={hl.y} s={1.6} rot={tilt} flip look={look} />
      <WheelHand x={hr.x} y={hr.y} mirror s={1.6} rot={-tilt} flip torn={torn} look={look} />
    </g>
  );
};

/** A hand actually gripping the wheel: palm outside the rim, fingers curling over it,
 *  thumb on the inside. `side` -1 = left hand (screen left of centre). */
export const GripHand: React.FC<{
  x: number;
  y: number;
  side: 1 | -1;
  t: number;
  torn?: boolean;
  s?: number;
  look?: Look;
  hand?: HandSpec;
}> = ({ x, y, side, t, torn = false, s = 1, look, hand }) => {
  const H = hand ?? handSpecFor(look);
  return (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${side * -14 + Math.sin(t / 50) * 1.5})`}>
    {/* wrist */}
    <path d="M -34 26 q 34 14 68 0 l 6 40 q -40 16 -80 0 Z" fill={H.shade} />
    {/* palm, sitting outside the rim */}
    <path d="M -60 -46 q 60 -24 112 4 q 16 38 0 62 q -52 22 -106 0 q -16 -34 -6 -66 Z" fill={H.skin} />
    {/* fingers curling over the rim, tips coming down on the inside */}
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`rotate(${(i - 1.5) * 3} ${-44 + i * 27} -6)`}>
        <rect x={-52 + i * 27} y={-4} width={25} height={58} rx={12.5} fill={H.skin} />
        <rect x={-52 + i * 27} y={38} width={25} height={16} rx={8} fill={H.shade} opacity={0.55} />
      </g>
    ))}
    {/* thumb: on the inside of the wheel, pointing toward its centre */}
    <ellipse cx={side * 44} cy={-18} rx={15} ry={33} fill={H.shade} transform={`rotate(${side * -26} ${side * 44} -18)`} />
    {torn ? (
      <g opacity={0.9}>
        <path d="M -18 -18 l 26 8 M -14 0 l 22 3" stroke="#B3261E" strokeWidth={3.2} strokeLinecap="round" />
      </g>
    ) : null}
  </g>
  );
};

/** A big mirror close-up: the frame, the glass, whoever is inside it. Used when the mirror is the subject. */
export const BigMirror: React.FC<{ t: number; occupant?: 'none' | 'woman' | 'hung'; x?: number; y?: number; w?: number; h?: number }> = ({
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
      {occupant === 'hung' ? <g transform={`translate(${x} ${y})`}><MirrorEyes w={w} h={h} /></g> : null}
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

// ------------------------------------------------------------------ the driver from behind

/** H�ng from behind: the whole back of the skull is cap-hair, so no face draws here at all - only the
 *  nape, the collar and the shoulders. For a camera in the rear seat (POV-W). */
export const BackOfDriver: React.FC<{ x: number; y: number; s?: number; look?: Look }> = ({ x, y, s = 1, look }) => {
  const H = handSpecFor(look);
  return (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* shoulders and jacket: the nearest mass, cut off by the bottom of the frame */}
    <path d="M -330 300 Q -336 150 -196 116 L 196 116 Q 336 150 330 300 L 330 470 L -330 470 Z" fill="#0B0F14" />
    <path d="M -330 300 Q -336 150 -196 116 L 196 116 Q 336 150 330 300" fill="none" stroke="#1B2838" strokeWidth={4} opacity={0.65} />
    {/* collar over the nape */}
    <path d="M -100 92 L 100 92 L 76 148 L -76 148 Z" fill="#14181F" />
    {/* nape: a short neck, darker than the face, disappearing under the hair — same skin as the hands */}
    <path d="M -80 108 L 80 108 L 66 -52 L -66 -52 Z" fill={H.shade} />
    <path d="M -80 108 L 80 108 L 74 40 L -74 40 Z" fill="#8A5A3C" opacity={0.5} />
    {/* the back of the head: one solid mass of cap-hair, flat on top */}
    <path d="M -208 -30 Q -220 -252 0 -266 Q 220 -252 208 -30 Q 168 92 0 102 Q -168 92 -208 -30 Z" fill="#04070B" />
    <path d="M -184 -208 Q 0 -240 184 -208 L 178 -184 Q 0 -214 -178 -184 Z" fill="#0A0F16" opacity={0.85} />
    {/* amber rim from the dash, on the side the dash is lit */}
    <path d="M 156 -176 Q 208 -110 198 48" fill="none" stroke="#F2B33D" strokeWidth={5} opacity={0.2} strokeLinecap="round" />
  </g>
  );
};

// ------------------------------------------------------------------ her head, small

/** Her bowed head at mirror scale: the dome of hair, the pale wedge of face under the fringe, and one
 *  red point. Drawn at the size it will actually be seen at, so the eye still reads. */
export const MirrorHead: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    {/* hair: a dome, falling past the jaw on both sides */}
    <path d="M -27 12 Q -32 -28 0 -32 Q 32 -28 27 12 Q 22 24 13 22 Q 21 8 15 0 Q 7 -12 -1 -14 Q -13 -12 -15 1 Q -20 9 -13 22 Q -22 24 -27 12 Z" fill="#04060A" />
    {/* the face, a pale wedge under the fringe */}
    <path d="M -14 3 Q -10 21 0 23 Q 10 21 14 3 L 9 -5 L -9 -5 Z" fill="#6C7784" />
    {/* one red point, under the fringe */}
    <circle cx={7} cy={5} r={3} fill="#C0392B" />
    {/* blood smeared up into the hair */}
    <path d="M -19 -7 q 8 -4 13 2 q 2 7 -4 9 l -7 -2 Z" fill="#8E1B15" opacity={0.9} />
  </g>
);

// ------------------------------------------------------------------ the taxi from the side

/** The taxi in profile at night, in the rain, the near side window open to us. For the exterior 3P
 *  shots. `driver` puts Hùng at the wheel (his face lit by the dash), `mirror` decides who the
 *  rear-view mirror is showing - and it is always inside the glass, never in a seat. */
export const TaxiSide: React.FC<{
  t: number;
  speed?: number;
  rain?: number;
  driver?: boolean;
  mirror?: 'none' | 'woman';
  x?: number;
  y?: number;
  s?: number;
}> = ({ t, speed = 0.5, rain = 0.8, driver = true, mirror = 'none', x = 960, y = 430, s = 1 }) => {
  const gid = React.useId().replace(/[:]/g, '');
  const bob = Math.sin(t * 1.1) * 2.4 * speed;
  const smear = (t * speed * 780) % 2600;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(-960 -430)`}>
      <g transform={`translate(0 ${bob})`}>
        <defs>
          <linearGradient id={`tsGlass${gid}`} x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#0D1A28" />
            <stop offset="55%" stopColor="#081220" />
            <stop offset="100%" stopColor="#04090F" />
          </linearGradient>
          <clipPath id={`tsClip${gid}`}>
            <path d="M 612 936 L 700 690 L 1246 672 L 1388 936 Z" />
          </clipPath>
        </defs>

        {/* night behind the car, and the lights of the street smearing past */}
        <rect x={420} y={-420} width={1080} height={1500} fill="#04070D" />
        {Array.from({ length: 8 }).map((_, i) => {
          const y = 250 + i * 74 + (i % 2) * 26;
          const x = 420 + ((i * 347 - smear) % 1400);
          return <rect key={i} x={x} y={y} width={190 + (i % 3) * 110} height={5} rx={2.5} fill={TV.amber} opacity={0.09 + (i % 3) * 0.05} />;
        })}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = 300 + i * 120;
          const x = 420 + ((i * 521 - smear * 1.4) % 1500);
          return <rect key={i} x={x} y={y} width={90} height={120} fill={TV.amber} opacity={0.035} />;
        })}

        {/* the road, and the wet reflection of the car */}
        <rect x={420} y={1100} width={1080} height={400} fill="#05090F" />
        <rect x={420} y={1100} width={1080} height={4} fill="#16283A" opacity={0.5} />
        <ellipse cx={950} cy={1170} rx={430} ry={34} fill="#000" opacity={0.55} />

        {/* the body: one silhouette, the wheels drawn over its lower edge */}
        <path
          d="M 452 1110 L 452 950 Q 452 900 520 884 L 578 758 Q 610 692 706 676 L 1180 662 Q 1246 666 1284 706 L 1400 902 Q 1426 934 1434 982 L 1452 994 Q 1466 1014 1454 1044 L 1452 1110 Z"
          fill="#0A1220"
        />
        <path d="M 578 758 Q 610 692 706 676 L 1180 662 Q 1246 666 1284 706" fill="none" stroke="#3A506B" strokeWidth={3} opacity={0.6} />
        {/* the beltline, and a warm streak of streetlight running along the flank */}
        <path d="M 452 1000 L 1452 1000" stroke="#16283A" strokeWidth={4} opacity={0.7} />
        <path d="M 500 1036 L 1380 1036" stroke={TV.amber} strokeWidth={10} opacity={0.05} />

        {/* the glasshouse: one opening, the pillars drawn over it */}
        <path d="M 612 936 L 700 690 L 1246 672 L 1388 936 Z" fill={`url(#tsGlass${gid})`} />

        {/* inside: seat backs first, so whoever sits there is in front of them */}
        <g clipPath={`url(#tsClip${gid})`}>
          <rect x={600} y={900} width={820} height={120} fill="#04080E" />
          <path d="M 640 902 q 60 -44 130 -40 l 20 140 l -150 0 Z" fill="#080D15" />
          <path d="M 1010 906 q 60 -46 132 -42 l 22 136 l -154 0 Z" fill="#080D15" />
          {driver ? (
            <g>
              {/* his near arm reaches forward to the wheel, lit by the dash from below */}
              <path d="M 1064 906 Q 1180 886 1268 940 L 1252 966 Q 1170 924 1078 938 Z" fill="#181C24" />
              <path d="M 1078 938 Q 1170 924 1252 966 L 1244 980 Q 1164 944 1086 954 Z" fill="#C08A63" opacity={0.85} />
              {/* the wheel, seen edge-on through the glass */}
              <g transform="translate(1324 946)">
                <ellipse rx={86} ry={40} fill="none" stroke="#0A1220" strokeWidth={22} />
                <ellipse rx={86} ry={40} fill="none" stroke="#2A3B52" strokeWidth={14} />
                <path d="M -76 0 Q 0 16 76 0" fill="none" stroke="#2A3B52" strokeWidth={9} />
              </g>
              {/* both hands on the rim */}
              <path d="M 1246 910 q 26 -12 46 4 q 6 16 -8 26 q -26 8 -44 -6 q -6 -14 6 -24 Z" fill="#C08A63" />
              <path d="M 1254 918 q 18 -8 34 2" fill="none" stroke="#E9C7A8" strokeWidth={3.2} opacity={0.55} strokeLinecap="round" />
              <path d="M 1398 906 q 24 -10 42 6 q 4 16 -10 24 q -24 6 -40 -8 q -4 -12 8 -22 Z" fill="#C08A63" />
              <path d="M 1404 914 q 16 -6 30 3" fill="none" stroke="#E9C7A8" strokeWidth={3} opacity={0.5} strokeLinecap="round" />
              {/* Hùng: head and shoulders, the dash throwing amber up into his face */}
              <path d="M 1010 1010 q 30 -96 146 -104 q 116 8 146 104 Z" fill="#181C24" />
              <path d="M 1010 1010 q 30 -96 146 -104 l 0 18 q -104 10 -132 92 Z" fill="#0D1117" opacity={0.45} />
              <g transform="translate(1156 838)">
                <ellipse cx={0} cy={0} rx={66} ry={74} fill="#C08A63" />
                <path d="M -66 0 Q -60 60 0 74 Q 60 60 66 0 L 66 6 Q 60 66 0 80 Q -60 66 -66 6 Z" fill="#A67150" opacity={0.22} />
                {/* the cap hair, flat on top, over the forehead */}
                <path d="M -68 -14 Q -62 -78 0 -84 Q 62 -78 68 -14 L 46 -28 Q 20 -42 0 -28 Q -26 -44 -48 -26 Z" fill="#12151C" />
                <path d="M -68 -14 Q -62 -78 0 -84 Q 62 -78 68 -14 L 58 -6 Q 30 -24 0 -10 Q -34 -26 -58 -6 Z" fill="#0A0D12" opacity={0.55} />
                {/* the cut on the forehead, under the hairline */}
                <path d="M -24 -34 l 30 8" stroke="#B3261E" strokeWidth={4.4} strokeLinecap="round" />
                {/* dot eyes, straight brows: the fright is in the brows, not the mouth */}
                <circle cx={-22} cy={6} r={5.8} fill="#05070A" />
                <circle cx={24} cy={6} r={5.8} fill="#05070A" />
                <path d="M -36 -9 L -10 -9" stroke="#05070A" strokeWidth={5} strokeLinecap="round" />
                <path d="M 10 -9 L 36 -9" stroke="#05070A" strokeWidth={5} strokeLinecap="round" />
                <path d="M -10 24 h 20" stroke="#3A2418" strokeWidth={4} strokeLinecap="round" />
                {/* dash light: the right side of his face is warm, the left falls to black */}
                <path d="M 66 0 Q 60 60 0 74 Q -60 60 -66 0 Q -60 -60 0 -74 Q 60 -60 66 0 Z" fill="#F2B33D" opacity={0.14} />
                <path d="M 0 -74 Q 60 -60 66 0 L 20 0 Q 10 -40 0 -74 Z" fill="#F2B33D" opacity={0.12} />
              </g>
            </g>
          ) : null}

          {/* the rear-view mirror, hanging from the roof rail: only the glass is drawn, never a seat */}
          <g transform="translate(1175 700)">
            <rect x={-6} y={-30} width={12} height={30} fill="#05080E" />
            <rect x={-70} y={-6} width={140} height={72} rx={12} fill="#0A121C" stroke="#1A2838" strokeWidth={3} />
            <rect x={-62} y={2} width={124} height={60} rx={8} fill="#071018" />
            {mirror === 'woman' ? (
              <g transform="translate(0 30)"><MirrorHead s={1.15} /></g>
            ) : (
              <g>
                <rect x={-62} y={30} width={124} height={32} fill="#08131F" />
                <rect x={-62} y={30} width={124} height={2} fill="#3A5A78" opacity={0.5} />
              </g>
            )}
          </g>
        </g>

        {/* the pillars and the beltline, over the glass */}
        <path d="M 700 690 L 1246 672 L 1388 936 L 612 936 Z" fill="none" stroke="#04070C" strokeWidth={16} />
        <path d="M 700 690 L 1246 672" stroke="#04070C" strokeWidth={14} />
        <path d="M 612 936 L 1388 936" stroke="#04070C" strokeWidth={18} />
        <rect x={946} y={684} width={40} height={254} fill="#0A1220" />
        <rect x={950} y={688} width={32} height={248} fill="#0E1728" opacity={0.8} />

        {/* rain on the glass, and the sheen of a streetlight crossing it */}
        {Array.from({ length: Math.round(70 * rain) }).map((_, i) => {
          const x = 620 + ((i * 89) % 740);
          const y = 690 + ((i * 137 + t * (150 + (i % 5) * 60)) % 250);
          return <line key={i} x1={x} y1={y} x2={x - 5} y2={y + 16} stroke="#CFE6FF" strokeWidth={1.6} opacity={0.08 + (i % 4) * 0.04} />;
        })}
        <path d="M 640 936 L 900 690 L 980 690 L 720 936 Z" fill="#CFE6FF" opacity={0.035} />

        {/* the wheels */}
        <circle cx={650} cy={1110} r={92} fill="#04070C" />
        <circle cx={650} cy={1110} r={40} fill="#0A1119" stroke="#1D2A3E" strokeWidth={4} />
        <circle cx={1330} cy={1110} r={92} fill="#04070C" />
        <circle cx={1330} cy={1110} r={40} fill="#0A1119" stroke="#1D2A3E" strokeWidth={4} />
      </g>
    </g>
  );
};


// ------------------------------------------------------------------ phone & dashcam screens

/** A phone held in the hand: dark body, bright screen, with `children` drawn inside the screen area
 *  (local 0,0 is screen top-left, w x h). `glow` tints the light spilling off the glass. */
export const PhoneHeld: React.FC<{
  x: number; y: number; w?: number; rot?: number; glow?: string; children?: React.ReactNode;
}> = ({ x, y, w = 360, rot = -8, glow = '#7FE8FF', children }) => {
  const h = w * 2.06;
  const r = w * 0.12;
  const pad = w * 0.045;
  const sw = w - pad * 2;
  const sh = h - pad * 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <ellipse cx={w * 0.5} cy={h * 0.55} rx={w * 0.9} ry={h * 0.6} fill={glow} opacity={0.08} />
      <rect width={w} height={h} rx={r} fill="#0A0E14" stroke="#1A2636" strokeWidth={4} />
      <rect x={pad} y={pad} width={sw} height={sh} rx={r - pad * 0.6} fill="#07111C" />
      <g transform={`translate(${pad} ${pad})`} clipPath={`url(#phc${Math.round(x)}${Math.round(y)})`}>
        <defs>
          <clipPath id={`phc${Math.round(x)}${Math.round(y)}`}>
            <rect width={sw} height={sh} rx={r - pad * 0.6} />
          </clipPath>
        </defs>
        {children}
      </g>
      <rect x={w * 0.38} y={pad + 10} width={w * 0.24} height={w * 0.04} rx={w * 0.02} fill="#02060A" />
    </g>
  );
};

/** Scanlines + compression noise over a video frame, to sell "dashcam playback". */
export const VideoNoise: React.FC<{ w: number; h: number; t: number; o?: number }> = ({ w, h, t, o = 1 }) => (
  <g opacity={o} pointerEvents="none">
    {Array.from({ length: Math.round(h / 10) }).map((_, i) => (
      <rect key={i} x={0} y={i * 10} width={w} height={1} fill="#000" opacity={0.12} />
    ))}
    {Array.from({ length: 30 }).map((_, i) => {
      const x = ((i * 97 + t * 13) % (w + 40)) - 20;
      const y = ((i * 211 + t * 7) % (h + 20)) - 10;
      return <rect key={`n${i}`} x={x} y={y} width={20 + (i % 5) * 18} height={2 + (i % 3)} fill="#CFE6FF" opacity={0.03 + (i % 4) * 0.015} />;
    })}
    <rect width={w} height={h} fill="#081422" opacity={0.12} style={{ mixBlendMode: 'screen' }} />
  </g>
);

/** Dashcam overlay: REC dot, timestamp, and a playback scrub bar. */
export const DashcamHud: React.FC<{ w: number; h: number; t: number; stamp: string; rec?: boolean; progress?: number }> = ({ w, h, t, stamp, rec = true, progress }) => (
  <g>
    {rec ? (
      <g transform={`translate(${w - 86} 26)`}>
        <circle cx={0} cy={8} r={7} fill="#E24B3B" opacity={0.8 + 0.2 * Math.sin(t / 8)} />
        <text x={14} y={14} fontFamily="ui-monospace, Consolas, monospace" fontSize={18} fill="#E24B3B" opacity={0.9}>REC</text>
      </g>
    ) : null}
    <text x={18} y={h - 18} fontFamily="ui-monospace, Consolas, monospace" fontSize={20} letterSpacing={2} fill="#EAF4FF" opacity={0.92}>
      {stamp}
    </text>
    {progress != null ? (
      <g transform={`translate(18 ${h - 44})`}>
        <rect width={w - 36} height={6} rx={3} fill="#1A2A3D" opacity={0.9} />
        <rect width={(w - 36) * Math.max(0, Math.min(1, progress))} height={6} rx={3} fill="#CFE6FF" opacity={0.85} />
        <circle cx={(w - 36) * Math.max(0, Math.min(1, progress))} cy={3} r={7} fill="#EAF4FF" opacity={0.9} />
      </g>
    ) : null}
  </g>
);

/** A dark, empty rear bench as seen from a dashcam mounted on the dashboard looking back. */
export const DashcamRearEmpty: React.FC<{ w: number; h: number; t: number }> = ({ w, h, t }) => (
  <g>
    <rect width={w} height={h} fill="#050A11" />
    <rect x={w * 0.08} y={h * 0.08} width={w * 0.84} height={h * 0.34} rx={10} fill="#071320" stroke="#16283A" strokeWidth={3} />
    <rect x={w * 0.08} y={h * 0.27} width={w * 0.84} height={2} fill="#2E4A66" opacity={0.35} />
    <circle cx={w * 0.78} cy={h * 0.24} r={3} fill={TV.amber} opacity={0.3} />
    <path d={`M ${w * 0.06} ${h * 0.64} q ${w * 0.44} ${-h * 0.05} ${w * 0.88} 0 l 0 ${h * 0.16} l ${-w * 0.88} 0 Z`} fill="#080E17" />
    <path d={`M ${w * 0.1} ${h * 0.64} q ${w * 0.4} ${-h * 0.04} ${w * 0.8} 0`} stroke="#16283A" strokeWidth={2} fill="none" opacity={0.6} />
    {/* headrests, but no one between them */}
    <rect x={w * 0.22} y={h * 0.46} width={w * 0.14} height={h * 0.12} rx={10} fill="#0A121C" />
    <rect x={w * 0.64} y={h * 0.46} width={w * 0.14} height={h * 0.12} rx={10} fill="#0A121C" />
    {/* dash/steering wheel edge at bottom of frame */}
    <path d={`M 0 ${h * 0.82} Q ${w * 0.5} ${h * 0.74} ${w} ${h * 0.82} L ${w} ${h} L 0 ${h} Z`} fill="#070C13" />
    <path d={`M ${w * 0.35} ${h * 0.84} A ${w * 0.15} ${w * 0.08} 0 0 1 ${w * 0.65} ${h * 0.84}`} fill="none" stroke="#1D2A3E" strokeWidth={8} />
    {Array.from({ length: 24 }).map((_, i) => {
      const x = w * 0.1 + ((i * 73) % (w * 0.8));
      const y = h * 0.08 + ((i * 131 + t * 8) % (h * 0.34));
      return <rect key={i} x={x} y={y} width={2} height={8 + (i % 3) * 5} rx={1} fill="#CFE6FF" opacity={0.1} />;
    })}
  </g>
);

// ------------------------------------------------------------------ direct ghost (outside the mirror)

export type WomanPose = 'stand' | 'lookDown';

/** The woman seen directly in the world (T21+ only). Same visual language as WomanInGlass: black hair
 *  mass with side fringe, murky dark presence, one red point in the right eye, blood smeared under hair. */
export const WomanDirect: React.FC<{ t: number; s?: number; pose?: WomanPose; face?: 'front' | 'threeQuarter' }> = ({ t, s = 1, pose = 'stand', face = 'front' }) => {
  const sway = Math.sin(t / 90) * 0.8;
  const look = pose === 'lookDown' ? 10 : 0;
  const fq = face === 'threeQuarter' ? 8 : 0;
  return (
    <g transform={`scale(${s}) rotate(${sway})`}>
      {/* jacket/body: murky pale, hanging straight */}
      <path d="M -62 92 Q -70 220 -54 360 L 54 360 Q 70 220 62 92 Q 30 60 0 56 Q -30 60 -62 92 Z" fill="#8E98A3" />
      <path d="M -62 92 Q -30 60 0 56 Q 30 60 62 92 L 54 150 Q 0 128 -54 150 Z" fill="#A3ADB7" opacity={0.5} />
      {/* arms hanging still */}
      <path d="M -62 108 Q -86 210 -78 300 L -54 296 Q -58 210 -44 140 Z" fill="#7E8894" />
      <path d="M 62 108 Q 86 210 78 300 L 54 296 Q 58 210 44 140 Z" fill="#7E8894" />
      {/* hands */}
      <ellipse cx={-66} cy={308} rx={12} ry={16} fill="#66717E" />
      <ellipse cx={66} cy={308} rx={12} ry={16} fill="#66717E" />
      {/* neck */}
      <rect x={-10 + fq * 0.2} y={22 + look * 0.3} width={20} height={38} rx={8} fill="#5E6976" />
      {/* head: hair mass, long and dark */}
      <g transform={`translate(${fq} ${look})`}>
        <path d="M -44 -40 Q -54 18 -46 78 L 46 78 Q 54 18 44 -40 Q 24 -58 0 -58 Q -24 -58 -44 -40 Z" fill="#04060A" />
        {/* fringe swept to the side */}
        <path d="M -42 -10 Q -22 -44 6 -46 Q 30 -40 40 -18 Q 24 -28 0 -20 Q -24 -18 -42 -10 Z" fill="#06080D" />
        {/* face wedge under fringe */}
        <path d="M -20 0 Q -14 34 0 38 Q 14 34 20 0 L 10 -10 L -10 -10 Z" fill="#5C6672" />
        {/* dark eye rims */}
        <ellipse cx={-9} cy={4} rx={5.5} ry={4.2} fill="#141A20" />
        <ellipse cx={9} cy={4} rx={5.5} ry={4.2} fill="#141A20" />
        {/* one red point: right eye only */}
        <circle cx={9} cy={4} r={1.8} fill="#C0392B" />
        <circle cx={9} cy={4} r={3.6} fill="#C0392B" opacity={0.18} />
        {/* calm mouth */}
        <path d="M -6 20 q 6 2 12 0" stroke="#2A313A" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        {/* blood smeared under hair at left temple */}
        <path d="M -34 -18 q 12 -8 18 4 q 2 10 -8 14 l -10 -4 Z" fill="#8E1B15" opacity={0.9} />
        <path d="M -24 0 q 4 14 0 24" stroke="#7A1410" strokeWidth={2.2} strokeLinecap="round" opacity={0.7} />
      </g>
    </g>
  );
};

/** A bent red bicycle lying on the ground (frame-local). `bent` skews the front wheel. */
export const BikeLying: React.FC<{ s?: number; bent?: boolean }> = ({ s = 1, bent = true }) => (
  <g transform={`scale(${s})`}>
    <circle cx={-48} cy={0} r={34} fill="none" stroke="#B3261E" strokeWidth={7} />
    <circle cx={-48} cy={0} r={5} fill="#3A1A18" />
    {bent ? (
      <ellipse cx={52} cy={6} rx={28} ry={36} fill="none" stroke="#B3261E" strokeWidth={7} transform="rotate(18 52 6)" />
    ) : (
      <circle cx={52} cy={0} r={34} fill="none" stroke="#B3261E" strokeWidth={7} />
    )}
    <circle cx={52} cy={bent ? 6 : 0} r={5} fill="#3A1A18" />
    <path d={`M -48 0 L 0 -30 L 52 ${bent ? 6 : 0} L 6 12 Z`} fill="none" stroke="#A32018" strokeWidth={7} strokeLinejoin="round" />
    <line x1={0} y1={-30} x2={-8} y2={-52} stroke="#A32018" strokeWidth={6} />
    <rect x={-24} y={-58} width={40} height={7} rx={3} fill="#A32018" />
    <line x1={-48} y1={0} x2={-30} y2={36} stroke="#A32018" strokeWidth={5} />
    <rect x={-40} y={34} width={26} height={8} rx={4} fill="#3A1A18" />
    {/* small silver bell on handlebar */}
    <circle cx={-22} cy={-52} r={6} fill="#A8B4BE" stroke="#6E7C88" strokeWidth={2} />
  </g>
);

/** The drain mouth: a dark opening in concrete with a lip. */
export const DrainMouth: React.FC<{ w?: number; h?: number }> = ({ w = 260, h = 90 }) => (
  <g>
    <rect x={-w / 2} y={0} width={w} height={h} rx={6} fill="#020406" />
    <rect x={-w / 2 - 10} y={-14} width={w + 20} height={20} rx={4} fill="#3A4652" />
    <rect x={-w / 2 - 6} y={-10} width={w + 12} height={10} rx={3} fill="#4A5866" opacity={0.7} />
    {Array.from({ length: 5 }).map((_, i) => (
      <rect key={i} x={-w / 2 + 18 + i * ((w - 36) / 4)} y={10} width={6} height={h - 24} rx={3} fill="#0A1118" opacity={0.8} />
    ))}
  </g>
);

/** Dead woman in the drain (upper body on the concrete lip, legs out of sight). For T20/T21 continuity. */
export const DeadInDrain: React.FC<{ t: number; show?: 'hand' | 'eye' | 'face' | 'all' }> = ({ t, show = 'all' }) => (
  <g>
    {/* dark drain interior */}
    <rect x={-400} y={40} width={800} height={260} fill="#010203" />
    {/* mud/water */}
    <ellipse cx={-40} cy={120} rx={220} ry={60} fill="#0A1210" opacity={0.8} />
    {Array.from({ length: 10 }).map((_, i) => (
      <circle key={i} cx={-180 + i * 40} cy={80 + (i % 3) * 18} r={2 + (i % 3)} fill="#2A3A38" opacity={0.2 + (i % 3) * 0.1} />
    ))}

    {show === 'hand' ? (
      <g transform="translate(-60 60) rotate(18)">
        <path d="M -10 40 q 18 -16 44 0 q 10 14 -2 28 q -20 12 -42 -2 q -8 -12 0 -26 Z" fill="#7A8896" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={-2 + i * 12} y={-6} width={10} height={50} rx={5} fill="#8694A2" transform={`rotate(${-12 + i * 6} ${3 + i * 12} 20)`} />
        ))}
        <rect x={-26} y={18} width={12} height={38} rx={6} fill="#7E8C9A" transform="rotate(-30 -26 37)" />
      </g>
    ) : null}

    {show === 'eye' ? (
      <g transform="translate(-10 70)">
        <path d="M -120 -20 Q -40 -40 60 -10 L 40 90 Q -30 110 -120 70 Z" fill="#111820" />
        <ellipse cx={0} cy={20} rx={26} ry={16} fill="#3A4048" />
        <ellipse cx={0} cy={20} rx={16} ry={10} fill="#1A1E24" />
        <circle cx={0} cy={20} r={5} fill="#0A0C10" />
        <ellipse cx={-6} cy={16} rx={4} ry={2.5} fill="#CFE6FF" opacity={0.5} />
      </g>
    ) : null}

    {(show === 'face' || show === 'all') ? (
      <g transform="translate(-20 40)">
        {/* shoulders/torso on the lip */}
        <path d="M -120 70 Q -80 10 0 0 Q 80 10 120 70 L 140 160 L -140 160 Z" fill="#2A3340" />
        {/* neck */}
        <rect x={-18} y={-18} width={36} height={34} rx={12} fill="#6B7784" />
        {/* hair spread wet */}
        <path d="M -70 -20 Q -80 -80 -10 -90 Q 60 -86 72 -20 Q 60 30 0 36 Q -60 30 -70 -20 Z" fill="#06080C" />
        <path d="M -70 -10 Q -90 30 -100 80 L -70 70 Q -60 20 -50 -5 Z" fill="#06080C" opacity={0.9} />
        <path d="M 70 -10 Q 90 30 96 80 L 66 70 Q 58 20 50 -5 Z" fill="#06080C" opacity={0.9} />
        {/* face */}
        <ellipse cx={0} cy={-30} rx={44} ry={52} fill="#74808C" />
        <path d="M -40 -40 Q -10 -60 20 -50 Q 40 -40 42 -20 Q 20 -34 -4 -26 Q -26 -30 -40 -40 Z" fill="#06080C" />
        {/* closed/calm eyes */}
        <path d="M -24 -34 q 10 4 18 0" stroke="#1A2028" strokeWidth={3} fill="none" strokeLinecap="round" />
        <path d="M 6 -34 q 10 4 18 0" stroke="#1A2028" strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* red wound on left temple */}
        <path d="M -38 -48 q 10 -6 16 4 q 0 10 -10 12 l -8 -6 Z" fill="#8E1B15" opacity={0.95} />
        <path d="M -28 -36 q 2 10 -2 18" stroke="#6E1410" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
        {/* mouth calm/flat */}
        <path d="M -10 -8 q 10 1 20 0" stroke="#2A313A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        {/* water/mud on skin */}
        <ellipse cx={-10} cy={-14} rx={6} ry={3} fill="#9FB0BE" opacity={0.18} />
      </g>
    ) : null}

    {/* concrete lip edge */}
    <rect x={-420} y={-18} width={840} height={26} rx={4} fill="#3A4652" />
    <rect x={-420} y={-18} width={840} height={8} rx={3} fill="#4A5866" opacity={0.5} />
  </g>
);
