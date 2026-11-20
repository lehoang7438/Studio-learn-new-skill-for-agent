import React from 'react';
import { rnd } from '../anim';
import { makeRoom, Box, Pt } from '../room';
import { Glow, LightVeil, Dust } from '../light';
import { RoomShell, FloorShadow, stand } from '../furnish';
import { LoaBox } from '../props';

// The night-shift security room, chalkboard style: everything is a dark fill with a chalk-white sketch line,
// on the near-black board. A wall of CCTV monitors (their little red recording dots are the room's life), a
// long metal desk, a bolted door on the left wall with the red corridor light beyond it (the turn), a filing
// cabinet and boxes on the right, a wall clock, and the PA speaker (the loa) hanging from the ceiling.
export const SECURITY = makeRoom({ x: 940, y: 470 }, { x0: 500, x1: 1400, y0: 340, y1: 730 }, 3.4);

const BOARD = { wall: '#141416', side: '#101012', floor: '#1D1D20', ceiling: '#0C0C0E', lines: '#212124' };
const CHALK = '#EDEAE2';
const SKETCH = '#B8B5AC';
const FAINT = '#4A4A50';
const INKFILL = '#0F0F12';

/** Where the loa hangs: its box centre (the stem runs up to the ceiling from there). */
export const LOA: Pt = (() => {
  const p = SECURITY.P(0.52, 0.02, 0.36);
  return { x: p.x, y: p.y + 142 };
})();
/** The centre of the monitor wall, for glows, rims and screen-light pulls. */
export const MON: Pt = (() => {
  const p = SECURITY.P(0.28, 0.3, 0.02);
  return { x: p.x, y: p.y };
})();
/** The bolted door on the left wall, and the red corridor light above it (the turn). */
export const DOOR: Pt = (() => {
  const p = SECURITY.P(0, 0.62, 0.66);
  return { x: p.x, y: p.y };
})();
export const REDPT: Pt = (() => {
  const p = SECURITY.P(0, 0.24, 0.7);
  return { x: p.x, y: p.y };
})();
/** A character standing on the floor. */
export const secStand = (u: number, w: number, k = 0.62) => stand(SECURITY, u, w, k);

// The monitor wall: a grid of screens, chalk frames round dark glass, a scatter of faint white static and —
// the room's life — little red recording dots. `dead` blanks a screen fully.
const Screen: React.FC<{ x: number; y: number; w: number; h: number; a: number; seed: number; t: number; dead?: boolean }> = ({
  x, y, w, h, a, seed, t, dead,
}) => {
  const fl = 0.55 + 0.45 * Math.sin(t / 7 + seed * 2.7) * Math.sin(t / 3.1 + seed);
  const base = dead ? 0.06 : 0.25 + 0.4 * a * fl;
  return (
    <g>
      <rect x={x - w / 2 - 5} y={y - h / 2 - 5} width={w + 10} height={h + 10} rx={5} fill={INKFILL} stroke={FAINT} strokeWidth={3} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill="#17171B" opacity={0.3 + 0.7 * base} />
      {!dead
        ? Array.from({ length: 5 }).map((_, i) => (
            <rect key={i} x={x - w / 2 + 4} y={y - h / 2 + 4 + i * (h / 5)} width={w - 8} height={h / 5 - 3} fill={SKETCH} opacity={0.08 * a * fl * (0.4 + 0.6 * rnd(seed + 3, i))} />
          ))
        : null}
      {!dead
        ? Array.from({ length: 6 }).map((_, i) => (
            <circle key={`b${i}`} cx={x - w / 2 + 10 + rnd(seed, i) * (w - 20)} cy={y - h / 2 + 10 + rnd(seed + 7, i) * (h - 20)} r={2.4} fill={i % 5 === 2 ? '#FF3B30' : SKETCH} opacity={i % 5 === 2 ? 0.5 + 0.3 * fl : 0.16 + 0.2 * a * fl} />
          ))
        : null}
    </g>
  );
};

/** The security room at night. `red` (0..1) brings up the red corridor light at the turn; `blink` flickers the
 *  monitor wall; `loaSpeak`/`loaMouth`/`loaLed` drive the PA speaker (drawn here, hanging from the ceiling). */
export const SecurityRoom: React.FC<{
  t: number;
  id?: string;
  veil?: number;
  red?: number;
  blink?: boolean;
  loaSpeak?: number;
  loaMouth?: number;
  loaLed?: number;
}> = ({ t, id = 'sec', veil = 0.46, red = 0, blink = false, loaSpeak = 0, loaMouth = 0, loaLed = 0 }) => {
  const r = SECURITY;
  const { P, Q } = r;
  const { x: lx, y: ly } = LOA;
  return (
    <g>
      <RoomShell r={r} id={id} wall={BOARD.wall} side={BOARD.side} floorC={BOARD.floor} ceiling={BOARD.ceiling} lines={BOARD.lines} />

      {/* the monitor wall on the back wall: 3 by 2 screens */}
      {(() => {
        const u0 = 0.06;
        const v0 = 0.1;
        return (
          <g>
            <rect x={P(u0, v0, 0.01).x - 22} y={P(u0, v0, 0.01).y - 16} width={560} height={330} rx={10} fill={INKFILL} stroke={FAINT} strokeWidth={4} />
            {[0, 1].map((row) =>
              [0, 1, 2].map((col) => {
                const p = P(u0 + 0.03 + col * 0.155, v0 + 0.09 + row * 0.2, 0.01);
                const a = row === 1 && col === 1 ? 1 : 0.55 + 0.45 * rnd(2, row * 3 + col);
                return <Screen key={`sc${row}${col}`} x={p.x} y={p.y} w={130} h={88} a={a} seed={row * 3 + col} t={t + col * 5 + row * 3} dead={blink && row === 1 && col === 1 && Math.sin(t / 4) > 0.4} />;
              }),
            )}
          </g>
        );
      })()}

      {/* the wall clock between the screens and the right wall: 03:15, chalk face */}
      {(() => {
        const p = P(0.7, 0.16, 0.02);
        return (
          <g>
            <circle cx={p.x} cy={p.y} r={34} fill={INKFILL} stroke={SKETCH} strokeWidth={4} />
            {[[0, -26], [26, 0], [0, 26], [-26, 0]].map(([dx, dy], i) => (
              <circle key={i} cx={p.x + dx} cy={p.y + dy} r={2} fill={SKETCH} />
            ))}
            {/* 03:15: the hour hand just past three, the minute hand on the quarter */}
            <path d={`M ${p.x} ${p.y} L ${p.x + 16} ${p.y + 4.5}`} stroke={CHALK} strokeWidth={5} strokeLinecap="round" />
            <path d={`M ${p.x} ${p.y} L ${p.x + 24} ${p.y}`} stroke={CHALK} strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={p.x} cy={p.y} r={3} fill="#FF3B30" />
          </g>
        );
      })()}

      {/* a notice board with the pinned rules paper by the door */}
      {(() => {
        const p = P(0.82, 0.2, 0.02);
        return (
          <g>
            <rect x={p.x - 4} y={p.y - 8} width={78} height={104} rx={4} fill="#111114" stroke={FAINT} strokeWidth={3} />
            <rect x={p.x + 2} y={p.y - 2} width={66} height={90} fill="#E9E2D2" stroke="#9A978F" strokeWidth={2} />
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M ${p.x + 10} ${p.y + 12 + i * 20} L ${p.x + 60} ${p.y + 12 + i * 20}`} stroke="#8A8578" strokeWidth={2.5} />
            ))}
            <circle cx={p.x + 35} cy={p.y + 58} r={9} fill="none" stroke="#FF3B30" strokeWidth={3} />
          </g>
        );
      })()}

      {/* the bolted metal door on the left wall; the red light of the turn beyond it */}
      {(() => {
        const d = P(0, 0.2, 0.55);
        const b = P(0, 0.2, 0.79);
        const t0 = P(0, 1, 0.55);
        const b0 = P(0, 1, 0.79);
        const riv = [0.12, 0.3, 0.5, 0.7, 0.88];
        return (
          <g>
            <polygon points={`${d.x},${d.y} ${b.x},${b.y} ${b0.x},${b0.y} ${t0.x},${t0.y}`} fill="#131316" stroke={SKETCH} strokeWidth={4} />
            {riv.map((v, i) => (
              <circle key={i} cx={P(0, v, 0.57).x} cy={P(0, v, 0.57).y} r={5} fill="#1A1A1E" stroke={SKETCH} strokeWidth={2} />
            ))}
            {riv.map((v, i) => (
              <circle key={`r2${i}`} cx={P(0, v, 0.77).x} cy={P(0, v, 0.77).y} r={5} fill="#1A1A1E" stroke={SKETCH} strokeWidth={2} />
            ))}
            {/* the barred hatch and a push bar */}
            {(() => {
              const h0 = P(0, 0.32, 0.6);
              const h1 = P(0, 0.32, 0.74);
              const h2 = P(0, 0.48, 0.74);
              const h3 = P(0, 0.48, 0.6);
              return (
                <g>
                  <polygon points={`${h0.x},${h0.y} ${h1.x},${h1.y} ${h2.x},${h2.y} ${h3.x},${h3.y}`} fill="#0A0A0C" stroke={FAINT} strokeWidth={4} />
                  {[0.36, 0.42].map((v) => (
                    <path key={v} d={`M ${P(0, v, 0.6).x} ${P(0, v, 0.6).y} L ${P(0, v, 0.74).x} ${P(0, v, 0.74).y}`} stroke={SKETCH} strokeWidth={5} />
                  ))}
                  {(() => {
                    const ba = P(0, 0.62, 0.58);
                    const bb = P(0, 0.62, 0.76);
                    return <path d={`M ${ba.x} ${ba.y} L ${bb.x} ${bb.y}`} stroke={SKETCH} strokeWidth={9} strokeLinecap="round" />;
                  })()}
                </g>
              );
            })()}
            {/* the red lamp over the door */}
            {(() => {
              const lp = P(0, 0.17, 0.68);
              return (
                <g>
                  <rect x={lp.x - 16} y={lp.y - 10} width={32} height={16} rx={6} fill="#0E0E10" stroke={FAINT} strokeWidth={3} />
                  <circle cx={lp.x} cy={lp.y - 2} r={5} fill={red > 0.4 ? '#FF3B30' : '#4A2220'} />
                  {red > 0 ? <circle cx={lp.x} cy={lp.y - 2} r={26} fill="url(#g3red)" opacity={0.5 * red} /> : null}
                </g>
              );
            })()}
          </g>
        );
      })()}

      {/* the filing cabinet and the boxes on the right wall */}
      <FloorShadow r={r} u={[0.9, 1]} w={[0.1, 0.3]} o={0.4} />
      <Box r={r} u={[0.91, 1]} v={[0.52, 1]} w={[0.12, 0.28]} front="#131316" top="#1A1A1E" side="#0E0E10" />
      <polygon points={Q([[0.91, 0.52, 0.12], [1, 0.52, 0.12], [1, 1, 0.12], [0.91, 1, 0.12]])} fill="none" stroke={FAINT} strokeWidth={3} />
      {[0.62, 0.76, 0.9].map((v, i) => (
        <g key={`fw${i}`}>
          <polygon points={Q([[0.915, v - 0.07, 0.13], [0.995, v - 0.07, 0.13], [0.995, v + 0.03, 0.13], [0.915, v + 0.03, 0.13]])} fill="none" stroke={FAINT} strokeWidth={3} />
          <circle cx={P(0.955, v - 0.02, 0.13).x} cy={P(0.955, v - 0.02, 0.13).y} r={4} fill={SKETCH} />
        </g>
      ))}
      {(() => {
        const b = P(0.9, 1, 0.36);
        const s = r.s(0.36);
        return (
          <g>
            <ellipse cx={b.x} cy={b.y + 3} rx={70 * s} ry={10 * s} fill="#000" opacity={0.35} />
            <rect x={b.x - 58 * s} y={b.y - 64 * s} width={110 * s} height={62 * s} rx={5 * s} fill="#151518" stroke={SKETCH} strokeWidth={3.5} />
            <rect x={b.x - 50 * s} y={b.y - 122 * s} width={96 * s} height={56 * s} rx={5 * s} fill="#17171A" stroke={SKETCH} strokeWidth={3.5} />
            <path d={`M ${b.x - 40 * s} ${b.y - 96 * s} L ${b.x + 30 * s} ${b.y - 96 * s}`} stroke={FAINT} strokeWidth={3} />
          </g>
        );
      })()}

      {/* the long desk in front of the monitors: a keyboard, a mug, a scatter of paper */}
      <FloorShadow r={r} u={[0.06, 0.56]} w={[0.02, 0.2]} />
      <Box r={r} u={[0.07, 0.56]} v={[0.56, 0.72]} w={[0.03, 0.19]} front="#121215" top="#1A1A1E" side="#0D0D10" />
      <polygon points={Q([[0.07, 0.56, 0.03], [0.56, 0.56, 0.03], [0.56, 0.56, 0.19], [0.07, 0.56, 0.19]])} fill="none" stroke={FAINT} strokeWidth={3} />
      {(() => {
        const kb = P(0.3, 0.56, 0.11);
        const kbs = r.s(0.11);
        const mug = P(0.47, 0.56, 0.09);
        const pp = P(0.16, 0.56, 0.07);
        return (
          <g>
            <rect x={kb.x - 46 * kbs} y={kb.y - 14 * kbs} width={92 * kbs} height={26 * kbs} rx={6 * kbs} fill="#0E0E10" stroke={FAINT} strokeWidth={3} />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M ${kb.x - 36 * kbs + i * 26 * kbs} ${kb.y - 8 * kbs} L ${kb.x - 18 * kbs + i * 26 * kbs} ${kb.y - 8 * kbs}`} stroke={SKETCH} strokeWidth={3} />
            ))}
            <rect x={mug.x - 12} y={mug.y - 30} width={24} height={30} rx={6} fill="#131316" stroke={SKETCH} strokeWidth={3} />
            <path d={`M ${mug.x + 12} ${mug.y - 24} q 14 4 10 16`} stroke={SKETCH} strokeWidth={6} fill="none" />
            <rect x={pp.x - 30} y={pp.y - 6} width={64} height={44} rx={2} fill="#E9E2D2" transform={`rotate(-8 ${pp.x} ${pp.y})`} />
            <path d={`M ${pp.x - 16} ${pp.y + 4} L ${pp.x + 20} ${pp.y + 2} M ${pp.x - 14} ${pp.y + 14} L ${pp.x + 12} ${pp.y + 12}`} stroke="#8A8578" strokeWidth={2} />
          </g>
        );
      })()}

      {/* two office chairs: round bases on posts */}
      {[0.26, 0.44].map((u, i) => {
        const p = P(u, 1, 0.24);
        const s = r.s(0.24);
        return (
          <g key={`ch${i}`}>
            <ellipse cx={p.x} cy={p.y} rx={40 * s} ry={9 * s} fill="#000" opacity={0.3} />
            <ellipse cx={p.x} cy={p.y - 8 * s} rx={36 * s} ry={8 * s} fill="#101013" stroke={FAINT} strokeWidth={3} />
            <path d={`M ${p.x} ${p.y - 10 * s} L ${p.x} ${p.y - 56 * s}`} stroke="#101013" strokeWidth={7 * s} />
            <path d={`M ${p.x - 30 * s} ${p.y - 100 * s} Q ${p.x} ${p.y - 116 * s} ${p.x + 30 * s} ${p.y - 100 * s} L ${p.x + 22 * s} ${p.y - 56 * s} L ${p.x - 22 * s} ${p.y - 56 * s} Z`} fill="#131316" stroke={SKETCH} strokeWidth={3.5} />
          </g>
        );
      })}

      {/* the loa on its stem */}
      <LoaBox x={lx} y={ly} f={t} speak={loaSpeak} mouth={loaMouth} led={loaLed} />

      {/* the contrast pass, then the lights again on top */}
      <LightVeil
        id={`${id}veil`}
        lights={[
          [MON.x, MON.y + 40, 460 * (blink ? 0.75 : 1)],
          [DOOR.x, DOOR.y, 240],
          [lx, ly + 30, 220],
          [REDPT.x, REDPT.y, 200 + 180 * red],
          [1180, 900, 340],
        ]}
        o={veil}
      />
      <Glow x={MON.x} y={MON.y + 30} r={380} kind="cool" o={0.28} />
      <Glow x={lx} y={ly + 10} r={140} kind="cool" o={0.18} />
      {red > 0 ? <Glow x={REDPT.x} y={REDPT.y} r={220} kind="red" o={0.65 * red} /> : null}
      {red > 0 ? <Glow x={DOOR.x} y={DOOR.y} r={140} kind="red" o={0.4 * red} /> : null}
      {red > 0 ? <Glow x={lx} y={ly} r={330} kind="red" o={0.5 * red} /> : null}
      <Dust t={t} seed={9} x0={MON.x - 260} y0={MON.y - 40} w={520} h={320} n={16} o={0.35} />
      <Dust t={t} seed={21} x0={lx - 200} y0={ly - 60} w={400} h={260} n={12} o={0.25} />
      {Array.from({ length: 6 }).map((_, i) => (
        <circle key={`gl${i}`} cx={540 + rnd(11, i) * 860} cy={700 + rnd(12, i) * 220} r={1.5} fill={SKETCH} opacity={0.18} />
      ))}
    </g>
  );
};
