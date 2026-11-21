import React from 'react';

// 16:9 stage for "Chuyến xe không có khách".
//
// The studio world is 1920 x 1080; the vertical composition just crops a 1080-wide window out of it.
// This file builds sets that use the whole world: a taxi cabin seen from the driver's eye, a wet
// suburban road, and the glass between them. Nothing here is in canvas pixels — it is world pixels,
// so a shot can be re-framed by moving the stage, not by redrawing the set.

export const W = {
  ink: '#05080F',
  night: '#0A1730',
  night2: '#122A4A',
  horizon: '#1E4670',
  road: '#060B12',
  sheen: '#1B3E63',
  cyan: '#9FD3F5',
  glass: '#0C2036',
  steel: '#101A28',
  steel2: '#1B2A40',
  amber: '#F2B33D',
  amber2: '#FFD24A',
  lcd: '#8FE3B0',
  blood: '#B3261E',
  skin: '#C98E68',
};

/** Deterministic pseudo-random: the same frame always draws the same rain. */
const rnd = (i: number, k = 1) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ------------------------------------------------------------------ outside

/** Wet suburban road at night, seen through the glass. `rain` 0..1, `speed` 0..1. */
export const RoadNight: React.FC<{ t: number; rain?: number; speed?: number; lamps?: number }> = ({ t, rain = 0.6, speed = 0.4, lamps = 3 }) => {
  const drift = (t * speed * 6) % 240;
  return (
    <g>
      <defs>
        <linearGradient id="wxSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={W.ink} />
          <stop offset="55%" stopColor={W.night} />
          <stop offset="100%" stopColor={W.horizon} />
        </linearGradient>
        <linearGradient id="wxRoad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={W.horizon} stopOpacity={0.55} />
          <stop offset="18%" stopColor={W.road} />
          <stop offset="100%" stopColor={W.ink} />
        </linearGradient>
        <radialGradient id="wxPool">
          <stop offset="0%" stopColor={W.amber} stopOpacity={0.5} />
          <stop offset="100%" stopColor={W.amber} stopOpacity={0} />
        </radialGradient>
      </defs>

      <rect x={0} y={0} width={1920} height={600} fill="url(#wxSky)" />
      <rect x={0} y={596} width={1920} height={484} fill="url(#wxRoad)" />

      {/* far treeline, two layers of silhouettes */}
      <path
        d="M0 596 L0 540 q 40 -26 78 -8 q 30 -34 66 -14 q 34 -30 70 -10 q 40 -28 80 -6 q 36 -26 74 -10 q 40 -30 84 -8 q 38 -24 78 -4 q 42 -30 86 -8 q 36 -22 76 -6 q 44 -30 88 -8 q 40 -24 82 -6 q 38 -28 80 -8 q 40 -26 82 -6 q 40 -24 84 -4 q 40 -22 82 -6 q 44 -26 86 -4 q 40 -20 80 -4 q 42 -24 86 -2 L1920 596 Z"
        fill="#03070D"
      />
      <path
        d="M0 596 L0 566 q 60 -18 120 -4 q 54 -16 108 -2 q 60 -18 120 -2 q 58 -14 116 0 q 62 -16 124 -2 q 60 -14 120 0 q 62 -16 122 -2 q 58 -12 118 0 q 62 -14 124 0 q 60 -12 120 0 q 62 -12 122 0 q 60 -10 118 0 q 62 -10 122 0 q 58 -8 118 0 q 60 -8 120 0 L1920 596 Z"
        fill="#050B14"
      />

      {/* streetlights: pole + pool + haze */}
      {Array.from({ length: lamps }).map((_, i) => {
        const x = 250 + i * 620 - (drift % 620);
        const s = 0.7 + (i % 3) * 0.16;
        return (
          <g key={i} opacity={0.9}>
            <rect x={x} y={230} width={5 * s} height={370} fill="#0A121C" />
            <rect x={x - 30 * s} y={228} width={70 * s} height={7} fill="#0A121C" />
            <circle cx={x + 40 * s} cy={236} r={56 * s} fill="url(#wxPool)" />
            <circle cx={x + 40 * s} cy={236} r={11 * s} fill={W.amber} opacity={0.9} />
            <rect x={x + 34 * s} y={600} width={12 * s} height={300} fill={W.amber} opacity={0.06} />
          </g>
        );
      })}

      {/* lane dashes + wet reflections */}
      {Array.from({ length: 9 }).map((_, i) => {
        const p = (i + (t * speed) % 1) / 9;
        const y = 640 + p * p * 460;
        const w = 10 + p * 90;
        return <rect key={i} x={960 - w / 2} y={y} width={w} height={5 + p * 9} fill={W.cyan} opacity={0.12 + p * 0.1} />;
      })}
      <rect x={0} y={600} width={1920} height={120} fill={W.sheen} opacity={0.045} />

      {/* rain */}
      {Array.from({ length: Math.round(90 * rain) }).map((_, i) => {
        const x = rnd(i, 1) * 2060 - 70;
        const y = ((rnd(i, 2) * 700 + t * (520 + rnd(i, 3) * 260)) % 700) - 40;
        const l = 26 + rnd(i, 4) * 46;
        return <line key={i} x1={x} y1={y} x2={x - l * 0.22} y2={y + l} stroke={W.cyan} strokeWidth={1.4} opacity={0.1 + rnd(i, 5) * 0.16} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ glass

/** Beads and runs on the windshield. Drawn above the road, below the cabin frame. */
export const WetGlass: React.FC<{ t: number; amount?: number; icy?: boolean }> = ({ t, amount = 1, icy = false }) => (
  <g>
    {Array.from({ length: Math.round(46 * amount) }).map((_, i) => {
      const x = 120 + rnd(i, 11) * 1680;
      const base = rnd(i, 12) * 900;
      const y = ((base + t * (6 + rnd(i, 13) * 22)) % 900) - 40;
      const r = 1.6 + rnd(i, 14) * 3.4;
      return (
        <g key={i} opacity={0.1 + rnd(i, 15) * 0.18}>
          <circle cx={x} cy={y} r={r} fill={icy ? '#DCEBFF' : W.cyan} />
          {r > 3.4 ? <rect x={x - 0.7} y={y} width={1.4} height={10 + rnd(i, 16) * 26} fill={W.cyan} opacity={0.6} /> : null}
        </g>
      );
    })}
    {[0.018, 0.012].map((o, i) => (
      <path key={i} d={i === 0 ? 'M 300 1080 L 760 -80 L 830 -80 L 430 1080 Z' : 'M 1420 1080 L 1660 -60 L 1700 -60 L 1490 1080 Z'} fill="#BBD8FF" opacity={o} />
    ))}
  </g>
);

// ------------------------------------------------------------------ mirror

const WomanMirror: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* bowed head, wet hair as one solid shape, white jacket */}
    <path d="M -34 26 q 0 -30 34 -30 q 34 0 34 30 q -10 10 -34 10 q -24 0 -34 -10 Z" fill="#0A0E15" />
    <path d="M -26 20 q -8 40 -2 74 l 14 0 q -4 -34 0 -66 Z" fill="#0A0E15" />
    <path d="M 26 20 q 10 42 4 78 l -16 0 q 6 -36 2 -70 Z" fill="#0A0E15" />
    <path d="M -27 4 q 6 -22 27 -22 q 21 0 27 22 q -12 9 -27 9 q -15 0 -27 -9 Z" fill="#D9DEE6" opacity={0.9} />
    <path d="M -22 46 q 22 12 44 0 l 6 40 q -28 14 -56 0 Z" fill="#E9EDF2" opacity={0.92} />
  </g>
);

/** The driver's own eyes, reflected back at him: a dark band of face, straight brows lifted clear of the
 *  eyes, the cut on the forehead. For when the camera sits behind him (POV-W) and the mirror gives his
 *  fear back to us instead of hers. Drawn inside a w x h box, in local units. */
export const MirrorEyes: React.FC<{ w: number; h: number; cut?: boolean }> = ({ w, h, cut = true }) => {
  const gid = React.useId().replace(/[:]/g, '');
  const cx = w / 2;
  const ey = h * 0.64;
  const dx = w * 0.17;
  const er = Math.min(w * 0.082, h * 0.3);
  return (
    <g>
      <rect width={w} height={h} fill="#04080E" />
      <defs>
        <linearGradient id={`meFace${gid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#7A5A38" />
          <stop offset="42%" stopColor="#2A1D12" />
          <stop offset="100%" stopColor="#05080D" />
        </linearGradient>
      </defs>
      {/* his head: lit from the dash below, so the light dies out under the cap */}
      <ellipse cx={cx} cy={h * 0.74} rx={w * 0.29} ry={h * 0.62} fill={`url(#meFace${gid})`} />
      {/* the cap, flat on top, over the forehead */}
      <rect x={cx - w * 0.29} y={h * 0.06} width={w * 0.58} height={h * 0.26} rx={w * 0.11} fill="#04070B" />
      {cut ? <path d={`M ${cx - w * 0.09} ${h * 0.37} l ${w * 0.09} ${h * 0.02}`} stroke="#B3261E" strokeWidth={Math.max(2, h * 0.024)} strokeLinecap="round" /> : null}
      {/* brows: straight, and lifted clear of the eyes — the whole read is fright */}
      <path d={`M ${cx - dx - er * 1.3} ${ey - er * 1.5} L ${cx - dx + er * 1.3} ${ey - er * 1.62}`} stroke="#04070B" strokeWidth={Math.max(2.4, h * 0.045)} strokeLinecap="round" />
      <path d={`M ${cx + dx - er * 1.3} ${ey - er * 1.62} L ${cx + dx + er * 1.3} ${ey - er * 1.5}`} stroke="#04070B" strokeWidth={Math.max(2.4, h * 0.045)} strokeLinecap="round" />
      {/* eyes, wide open */}
      <ellipse cx={cx - dx} cy={ey} rx={er} ry={er * 0.86} fill="#C6D2DC" />
      <ellipse cx={cx + dx} cy={ey} rx={er} ry={er * 0.86} fill="#C6D2DC" />
      <circle cx={cx - dx} cy={ey + er * 0.08} r={er * 0.34} fill="#070B11" />
      <circle cx={cx + dx} cy={ey + er * 0.08} r={er * 0.34} fill="#070B11" />
      <circle cx={cx - dx - er * 0.3} cy={ey - er * 0.3} r={er * 0.12} fill="#fff" opacity={0.5} />
      <circle cx={cx + dx - er * 0.3} cy={ey - er * 0.3} r={er * 0.12} fill="#fff" opacity={0.5} />
      {/* the nose bridge, so the two eyes sit in one face and not on a mask */}
      <path d={`M ${cx} ${ey + er * 0.4} l 0 ${er * 1.3}`} stroke="#1A222C" strokeWidth={Math.max(2, h * 0.03)} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

/** Rear-view mirror on its stalk. `occupant` is drawn inside the glass only - never in the seat. */
export const Mirror: React.FC<{ t: number; occupant?: 'none' | 'woman' | 'hung'; x?: number; y?: number; w?: number; h?: number }> = ({
  t,
  occupant = 'none',
  x = 860,
  y = 26,
  w = 200,
  h = 108,
}) => (
  <g>
    <rect x={x + w / 2 - 7} y={0} width={14} height={y + 6} fill="#060A10" />
    <rect x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={14} fill="#0A121C" stroke="#1A2838" strokeWidth={3} />
    <rect x={x} y={y} width={w} height={h} rx={8} fill="#071018" />
    <g clipPath={`url(#mirClip${x})`}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#0B2033" />
      <rect x={x} y={y} width={w} height={h} rx={8} fill="#123" opacity={0.5} />
      {occupant === 'woman' ? <WomanMirror x={x + w / 2} y={y + 32} s={1.05} /> : (
        occupant === 'hung' ? (
          <g transform={`translate(${x} ${y})`}>
            <MirrorEyes w={w} h={h} />
          </g>
        ) : (
        <g>
          {/* empty road behind: a faint horizon and one far lamp, never a person */}
          <rect x={x} y={y + h * 0.42} width={w} height={h * 0.58} fill="#08131F" />
          <rect x={x} y={y + h * 0.42} width={w} height={2} fill="#3A5A78" opacity={0.5} />
          <rect x={x + w * 0.62} y={y + h * 0.55} width={26} height={3} fill={W.amber} opacity={0.35} />
          <rect x={x} y={y + h * 0.55} width={w} height={h * 0.45} fill="#050C14" opacity={0.75} />
        </g>
        )
      )}
      <rect x={x} y={y} width={w} height={h} rx={8} fill="url(#mirSheen)" opacity={0.25} />
    </g>
    <clipPath id={`mirClip${x}`}>
      <rect x={x} y={y} width={w} height={h} rx={8} />
    </clipPath>
    <defs>
      <linearGradient id="mirSheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#CFE6FF" stopOpacity={0.5} />
        <stop offset="45%" stopColor="#CFE6FF" stopOpacity={0} />
      </linearGradient>
    </defs>
  </g>
);

// ------------------------------------------------------------------ cabin

/** The taxi interior from the driver's eye: 1920 wide, dash across the bottom, mirror at the top centre. */
export const CabinWide: React.FC<{
  t: number;
  wipers?: number;
  clock?: string;
  speed?: number;
  wheel?: number;
  hands?: boolean;
  mirror?: 'none' | 'woman';
}> = ({ t, wipers = 0, clock = '23:34', speed = 0.4, wheel = 0, hands = true, mirror = 'none' }) => {
  const shake = Math.sin(t * 0.9) * 1.1 * speed;
  return (
    <g transform={`translate(0 ${shake})`}>
      {/* glass tint + reflections over the road */}
      <rect x={0} y={0} width={1920} height={820} fill={W.glass} opacity={0.22} />
      <WetGlass t={t} />

      {/* roof + A-pillars */}
      <path d="M 0 0 L 1920 0 L 1920 58 L 0 58 Z" fill={W.ink} />
      <rect x={0} y={52} width={1920} height={8} fill="#0B1524" />
      <path d="M 0 58 L 96 58 L 250 820 L 0 820 Z" fill={W.ink} />
      <path d="M 1920 58 L 1824 58 L 1670 820 L 1920 820 Z" fill={W.ink} />
      <path d="M 96 58 L 128 58 L 286 820 L 250 820 Z" fill="#0A1424" opacity={0.9} />
      <path d="M 1824 58 L 1792 58 L 1634 820 L 1670 820 Z" fill="#0A1424" opacity={0.9} />

      {/* wipers, parked low, one sweep per second */}
      <g transform={`translate(700 1050) rotate(${-10 + wipers * 46})`} opacity={0.9}>
        <rect x={-5} y={-430} width={10} height={430} rx={5} fill="#05090F" />
        <rect x={-7} y={-450} width={14} height={36} rx={6} fill="#05090F" />
      </g>
      <g transform={`translate(1180 1060) rotate(${8 - wipers * 40})`} opacity={0.9}>
        <rect x={-5} y={-400} width={10} height={400} rx={5} fill="#05090F" />
        <rect x={-7} y={-420} width={14} height={34} rx={6} fill="#05090F" />
      </g>

      {/* dashboard */}
      <path d="M 0 812 Q 960 770 1920 812 L 1920 1080 L 0 1080 Z" fill="#080E17" />
      <path d="M 0 812 Q 960 770 1920 812 L 1920 858 Q 960 816 0 858 Z" fill="#111C2C" />
      <rect x={0} y={816} width={1920} height={3} fill="#2C3C54" opacity={0.45} />

      {/* instrument binnacle */}
      <g transform="translate(960 902)">
        <rect x={-290} y={-52} width={580} height={150} rx={26} fill="#060B13" stroke="#1A2940" strokeWidth={3} />
        {[-150, 150].map((dx, i) => {
          const p = 0.35 + 0.25 * Math.sin(t / (30 + i * 8) + i);
          return (
            <g key={dx} transform={`translate(${dx} 16)`}>
              <circle r={46} fill="#0A1524" stroke="#2A3D58" strokeWidth={3} />
              <line x1={0} y1={0} x2={Math.cos(-2.2 + p * 4.4) * 30} y2={Math.sin(-2.2 + p * 4.4) * 30} stroke={W.amber} strokeWidth={4} strokeLinecap="round" />
              <circle r={4} fill={W.amber} />
            </g>
          );
        })}
      </g>

      {/* the clock: a small green LCD, the only number on screen */}
      <g transform="translate(1520 878)">
        <rect x={-78} y={-24} width={156} height={50} rx={8} fill="#050D0A" stroke="#1B3A2E" strokeWidth={2} />
        <text x={0} y={9} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={30} letterSpacing={2} fill={W.lcd} opacity={0.92}>
          {clock}
        </text>
      </g>

      {/* wheel: only the top third is in frame, hands at ten and two */}
      <g transform={`translate(960 1152) rotate(${wheel})`}>
        <ellipse rx={384} ry={190} fill="none" stroke="#070C14" strokeWidth={58} />
        <ellipse rx={384} ry={190} fill="none" stroke="#1D2A3E" strokeWidth={42} />
        <ellipse rx={384} ry={190} fill="none" stroke="#2C3D56" strokeWidth={5} opacity={0.65} />
        <path d="M -340 0 Q 0 58 340 0" fill="none" stroke="#1D2A3E" strokeWidth={26} />
        <path d="M -20 40 L -14 160 M 20 40 L 14 160" stroke="#1D2A3E" strokeWidth={26} strokeLinecap="round" />
        <rect x={-64} y={-14} width={128} height={52} rx={16} fill="#131F30" stroke="#31445F" strokeWidth={3} />
        <text y={22} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={17} fill="#5B6E86">
          51B-234.56
        </text>
        {hands ? (
          <>
            <HandWide x={-262} y={-118} side={-1} t={t} />
            <HandWide x={262} y={-118} side={1} t={t} />
          </>
        ) : null}
      </g>

      {/* steering column + dash lip */}
      <path d="M 890 1050 L 1030 1050 L 1010 1080 L 910 1080 Z" fill="#0B1420" />
      <rect x={0} y={806} width={1920} height={6} fill="#22344A" opacity={0.35} />

      {/* mirror last: it sits in front of the glass */}
      <Mirror t={t} occupant={mirror} />
    </g>
  );
};

/** A chunky stickman hand on the wheel. Torn skin lines in red on the right hand. */
const HandWide: React.FC<{ x: number; y: number; side: 1 | -1; t: number }> = ({ x, y, side, t }) => (
  <g transform={`translate(${x} ${y}) scale(${side} 1) rotate(${side * (3 + Math.sin(t / 40) * 2)})`}>
    <path d="M -46 -10 q 46 -26 92 0 q 12 26 0 54 q -46 20 -92 0 q -12 -28 0 -54 Z" fill={W.skin} />
    <path d="M -34 34 q 34 12 68 0 l 6 22 q -40 14 -80 0 Z" fill="#B47A55" />
    <path d="M 6 8 l 22 6 M 10 22 l 20 2" stroke={W.blood} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
  </g>
);
