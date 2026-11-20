import React from 'react';
import { rnd, kf, clamp, lerp, easeOut } from '../anim';
import { Look } from '../rig';
import { makeRoom, Box, Pt } from '../room';
import { Glow, LightVeil, Dust } from '../light';
import { RoomShell, FloorShadow, stand } from '../furnish';

// The night supermarket, dark-cinematic. A big, near-empty store at 02:00. The main aisle runs in true one-point
// perspective: shelf rows on both walls from the far dark end right up to the camera, price rails catching the
// tubes, hanging aisle signs (LỐI 01 / LỐI 02) stepping down the ceiling line, a row of ceiling tubes receding
// into the black mouth of the far end, and cold light streaks on the polished floor under every lamp — all of it
// converging on the vanishing point so the store reads DEEP. The checkout lane (right-front) is a real lane:
// conveyor belt, scanner well, bagging shelf with a bag holder, POS monitor on a pole, card terminal, kick plate.
// The metal back door sits high on the LEFT wall at eleven o'clock under a red EXIT lamp — hinges, closer arm,
// push bar with end housings, kick plate, wired glass, KHẨN CẤP plate, and the thumb-turn latch (the chốt of
// rule 1). The door corner is kept clear of shelves. Two tube banks overhead: one steady, one that flickers (rule 2).

// ---------- the night-market cast: the dark-cinematic looks with real skin faces for the close-ups,
// dark clothes, and the cap / ponytail / grey-hair extras. Every market episode dresses the rig with these. ----------
export const MK: Record<'minh' | 'lan' | 'bao', Look> = {
  minh: {
    skin: '#D9AE8A', skinShade: '#C29570', hand: '#D9AE8A', jacket: '#232A38', jacketShade: '#1A202C',
    accent: '#FF3B30', limb: '#2A3140', line: '#10131A', shoe: '#14171E', face: '#1D2033', hair: '#17181C', extra: 'cap',
  },
  lan: {
    skin: '#E8C39A', skinShade: '#D0A97F', hand: '#E8C39A', jacket: '#37474F', jacketShade: '#2A363C',
    accent: '#E9C46A', limb: '#232B31', line: '#10131A', shoe: '#1A1E24', face: '#1D2033', hair: '#241A14', extra: 'pony',
  },
  bao: {
    skin: '#D3A67F', skinShade: '#BC8F69', hand: '#D3A67F', jacket: '#3E3A34', jacketShade: '#302C26',
    accent: '#C9B458', limb: '#33302A', line: '#0F0F14', shoe: '#18161A', face: '#1D2033', hair: '#8A8A90', extra: 'suit', beard: true,
  },
};

export const MINH = MK.minh;
export const LAN = MK.lan;
export const BAO = MK.bao;

export const MARKET = makeRoom({ x: 960, y: 400 }, { x0: 440, x1: 1480, y0: 300, y1: 740 }, 4.0);

const NIGHT = {
  wall: '#171A21',
  side: '#12151B',
  floor: '#1B2029',
  ceiling: '#0C0E13',
  lines: '#20242C',
  metal: '#3E4552',
  metalDark: '#2A2F3A',
  shelf: '#232830',
  shelfDark: '#181C23',
  rail: '#3A414C',
  goodsDim: ['#2E3D50', '#3A4A3C', '#4A3C3C', '#333A4E', '#3E4A5E', '#423C50', '#4E3A34', '#4A4632', '#2F4644', '#503E4E'],
};

/** The back door on the left wall at eleven o'clock: its centre, for glances and pushes. */
export const BDOOR: Pt = (() => {
  const p = MARKET.P(0, 0.5, 0.28);
  return { x: p.x, y: p.y };
})();
/** The thumb-latch on the door's free edge (the chốt of rule 1). */
export const LATCH: Pt = (() => {
  const p = MARKET.P(0, 0.56, 0.36);
  return { x: p.x, y: p.y };
})();
/** The red EXIT lamp above the door. */
export const EXIT: Pt = (() => {
  const p = MARKET.P(0, 0.2, 0.28);
  return { x: p.x, y: p.y };
})();
/** The flickering tube bank, centre of its housing. */
export const TUBES: Pt = (() => {
  const p = MARKET.P(0.5, 0.06, 0.38);
  return { x: p.x, y: p.y + 36 };
})();
/** The checkout counter, for staging Minh at the till. */
export const COUNT: Pt = (() => {
  const p = MARKET.P(0.86, 0.9, 0.22);
  return { x: p.x, y: p.y };
})();
/** The bright seam of the back door's crack — where the grey hand comes through, at push-bar height. */
export const SEAM: Pt = (() => {
  const p = MARKET.P(0, 0.62, 0.415);
  return { x: p.x, y: p.y };
})();
/** A character standing on the market floor. */
export const marketStand = (u: number, w: number, k = 0.6) => stand(MARKET, u, w, k);

// ---------- shelf rows: full-length banks on the walls, from the far dark end to the camera ----------
const SHELF_V = [0.36, 0.54, 0.72];
/** Depth falloff: a unit at depth w (0 = the far dark end, 0.55+ = the camera end) is swallowed by the dark. */
const depthFade = (w: number) => 0.07 + 0.93 * Math.pow(clamp((w - 0.03) / 0.52), 1.35);
const ShelfRow: React.FC<{ side: 0 | 1; seed: number; w0: number; w1: number; n?: number }> = ({ side, seed, w0, w1, n = 7 }) => {
  const r = MARKET;
  const units: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    // units pack tighter toward the far end so the rhythm steps down into the depth
    const a = lerp(w0, w1, Math.pow(i / n, 1.3));
    const b = lerp(w0, w1, Math.pow((i + 1) / n, 1.3));
    const bb = Math.min(b, w1);
    if (a >= bb - 0.004) break;
    const uB = side === 0 ? [0, 0.024] as [number, number] : [0.976, 1] as [number, number];
    // everything of this unit collects into one group so the depth fade applies to the whole bank section
    const unit: React.ReactNode[] = [];
    // the uprights at both ends of the unit
    for (const e of [a, bb - 0.007]) {
      unit.push(<Box key={`up${i}${e}`} r={r} u={uB} v={[0.27, 0.94]} w={[e, e + 0.005]} front={NIGHT.shelfDark} top={NIGHT.shelf} side={NIGHT.shelfDark} />);
    }
    // three shelves with goods and a price rail on each front edge
    for (let s2 = 0; s2 < 3; s2++) {
      const v0 = SHELF_V[s2];
      unit.push(<Box key={`b${i}${s2}`} r={r} u={uB} v={[v0, v0 + 0.032]} w={[a, bb]} front={NIGHT.shelf} top={NIGHT.shelfDark} side="#2C333D" />);
      const gCount = 5;
      for (let g = 0; g < gCount; g++) {
        if (rnd(seed, i * 31 + s2 * 7 + g) > 0.85) continue;
        const w = a + ((g + 0.5) / gCount) * (bb - a);
        const p = r.P(side === 0 ? 0.012 : 0.988, v0 - 0.004, w);
        const sc = r.s(w) / 2.4;
        const c = NIGHT.goodsDim[Math.floor(rnd(seed + 3, i * 31 + s2 * 7 + g) * NIGHT.goodsDim.length)];
        const gw = (13 + rnd(seed + 5, i * 31 + s2 * 7 + g) * 10) * sc;
        const gh = (16 + rnd(seed + 7, i * 31 + s2 * 7 + g) * 14) * sc;
        unit.push(<rect key={`g${i}${s2}${g}`} x={p.x - gw / 2} y={p.y - gh} width={gw} height={gh} rx={2 * sc} fill={c} stroke={NIGHT.lines} strokeWidth={1.2} opacity={0.92} />);
      }
      const e0 = r.P(side === 0 ? 0.024 : 0.976, v0 + 0.03, a);
      const e1 = r.P(side === 0 ? 0.024 : 0.976, v0 + 0.03, bb);
      unit.push(<path key={`p${i}${s2}`} d={`M ${e0.x} ${e0.y} L ${e1.x} ${e1.y}`} stroke={NIGHT.rail} strokeWidth={1.8 * r.s((a + bb) / 2)} opacity={0.5} />);
    }
    // the top cap board
    unit.push(<Box key={`t${i}`} r={r} u={uB} v={[0.27, 0.3]} w={[a, bb]} front={NIGHT.shelfDark} top={NIGHT.shelf} side={NIGHT.shelfDark} />);
    units.push(<g key={i} opacity={depthFade(a)}>{unit}</g>);
  }
  return <g>{units}</g>;
};

// ---------- a center gondola: the double-sided mid-store shelf run that turns one aisle into three ----------
const Gondola: React.FC<{ uc: number; gw: number; w0?: number; w1?: number; seed: number }> = ({ uc, gw, w0 = 0.03, w1 = 0.88, seed }) => {
  const r = MARKET;
  const parts: React.ReactNode[] = [];
  // the plinth and the top cap of the run
  parts.push(<Box key="base" r={r} u={[uc - gw, uc + gw]} v={[0.24, 0.3]} w={[w0, w1]} front={NIGHT.shelfDark} top={NIGHT.shelf} side={NIGHT.shelfDark} />);
  parts.push(<Box key="cap" r={r} u={[uc - gw, uc + gw]} v={[0.88, 0.94]} w={[w0, w1]} front={NIGHT.shelfDark} top={NIGHT.shelfDark} side={NIGHT.shelfDark} />);
  for (const side of [-1, 1]) {
    const uf = side < 0 ? uc - gw : uc + gw; // the face toward the aisle
    // three shelf boards running the depth of the run
    for (const v0 of SHELF_V) {
      parts.push(
        <Box key={`b${side}${v0}`} r={r} u={[uf, uf + 0.004]} v={[v0 - 0.004, v0 + 0.02]} w={[w0, w1]} front={NIGHT.shelf} top={NIGHT.shelfDark} side={NIGHT.shelf} />
      );
    }
    // uprights along the face
    for (const wx of [w0 + 0.02, (w0 + w1) / 2, w1 - 0.03]) {
      parts.push(<Box key={`u${side}${wx}`} r={r} u={[uf - 0.001, uf + 0.001]} v={[0.3, 0.88]} w={[wx, wx + 0.006]} front={NIGHT.shelfDark} top={NIGHT.shelfDark} side="#1D232B" />);
    }
    // goods on each board, and a price rail under every row
    for (let s2 = 0; s2 < 3; s2++) {
      const v0 = SHELF_V[s2];
      for (let g = 0; g < 8; g++) {
        if (rnd(seed + side, s2 * 13 + g) > 0.88) continue;
        const w = w0 + 0.03 + (g / 8) * (w1 - w0 - 0.06);
        const p = r.P(uf + side * 0.003, v0 - 0.006, w);
        const sc = r.s(w) / 2.4;
        const c = NIGHT.goodsDim[Math.floor(rnd(seed + side + 5, s2 * 13 + g) * NIGHT.goodsDim.length)];
        const gw2 = (13 + rnd(seed + side + 7, s2 * 13 + g) * 10) * sc;
        const gh = (15 + rnd(seed + side + 9, s2 * 13 + g) * 15) * sc;
        parts.push(<rect key={`g${side}${s2}${g}`} x={p.x - gw2 / 2} y={p.y - gh} width={gw2} height={gh} rx={2 * sc} fill={c} stroke={NIGHT.lines} strokeWidth={1.2} opacity={0.92} />);
      }
      const e0 = r.P(uf, v0 + 0.03, w0);
      const e1 = r.P(uf, v0 + 0.03, w1);
      parts.push(<path key={`p${side}${s2}`} d={`M ${e0.x} ${e0.y} L ${e1.x} ${e1.y}`} stroke={NIGHT.rail} strokeWidth={1.8 * r.s((w0 + w1) / 2)} opacity={0.5} />);
    }
  }
  return <g>{parts}</g>;
};

// ---------- the far chiller wall: a bank of freezer doors closing the store's deep end, lit cold ----------
const Chillers: React.FC = () => {
  const r = MARKET;
  const P = r.P;
  const u0 = 0.07;
  const u1 = 0.99;
  const vT = 0.12;
  const vB = 0.86;
  const a = P(u0, vT, 0);
  const b = P(u1, vT, 0);
  const c = P(u1, vB, 0);
  const d = P(u0, vB, 0);
  return (
    <g>
      {/* the housing wall */}
      <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill="#10141A" stroke="#20242C" strokeWidth={4} />
      {/* the header band */}
      <polygon
        points={`${P(u0, vT, 0).x},${P(u0, vT, 0).y} ${P(u1, vT, 0).x},${P(u1, vT, 0).y} ${P(u1, vT + 0.09, 0).x},${P(u1, vT + 0.09, 0).y} ${P(u0, vT + 0.09, 0).x},${P(u0, vT + 0.09, 0).y}`}
        fill="#151A21"
      />
      <polygon
        points={`${P(u0, vB - 0.07, 0).x},${P(u0, vB - 0.07, 0).y} ${P(u1, vB - 0.07, 0).x},${P(u1, vB - 0.07, 0).y} ${P(u1, vB, 0).x},${P(u1, vB, 0).y} ${P(u0, vB, 0).x},${P(u0, vB, 0).y}`}
        fill="#0B0E12"
      />
      {/* the freezer doors, each a dark glass panel with a cold interior glow */}
      {Array.from({ length: 9 }).map((_, i) => {
        const du0 = u0 + 0.015 + (i / 9) * (u1 - u0 - 0.03);
        const du1 = du0 + (u1 - u0 - 0.03) / 9 - 0.006;
        const p0 = P(du0, vT + 0.1, 0);
        const p1 = P(du1, vT + 0.1, 0);
        const p2 = P(du1, vB - 0.08, 0);
        const p3 = P(du0, vB - 0.08, 0);
        const mid = P((du0 + du1) / 2, (vT + vB) / 2, 0);
        const s = r.s(0.02) * 3.2;
        return (
          <g key={i}>
            <polygon points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill="#0E1A22" stroke="#1E2630" strokeWidth={3} />
            <polygon points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill="url(#g3cool)" opacity={0.16} style={{ mixBlendMode: 'screen' }} />
            {/* shelves inside the glass */}
            {[0.3, 0.48, 0.66].map((vv, j) => {
              const q0 = P(du0, vv, 0);
              const q1 = P(du1, vv, 0);
              return <path key={j} d={`M ${q0.x} ${q0.y} L ${q1.x} ${q1.y}`} stroke="#243038" strokeWidth={2.5} opacity={0.8} />;
            })}
            {/* the vertical handle */}
            <path d={`M ${mid.x + s * 2} ${p0.y + s * 3} L ${mid.x + s * 2} ${p3.y - s * 3}`} stroke="#3E4552" strokeWidth={3} opacity={0.9} />
          </g>
        );
      })}
    </g>
  );
};

// ---------- a hanging aisle sign, stepping down the ceiling line into the depth ----------
const AisleSign: React.FC<{ w: number; label: string; u?: number }> = ({ w, label, u = 0.5 }) => {
  const r = MARKET;
  const top = r.P(u, 0.05, w);
  const head = r.P(u, 0.19, w); // the sign's top edge, held at a fixed height on the ceiling line
  const s = r.s(w) / r.s(0.5);
  const sw = 156 * s;
  const sh = 58 * s;
  return (
    <g>
      <path d={`M ${top.x - sw * 0.32} ${top.y} L ${head.x - sw * 0.32} ${head.y}`} stroke="#0A0C10" strokeWidth={3.5 * s} />
      <path d={`M ${top.x + sw * 0.32} ${top.y} L ${head.x + sw * 0.32} ${head.y}`} stroke="#0A0C10" strokeWidth={3.5 * s} />
      <rect x={head.x - sw / 2} y={head.y} width={sw} height={sh} rx={6 * s} fill="#1B2027" stroke="#2A2F3A" strokeWidth={3.5 * s} />
      <text x={head.x} y={head.y + sh * 0.68} textAnchor="middle" fontFamily="'Fragment Mono'" fontWeight={700} fontSize={27 * s} fill="#8FA6B8" opacity={0.95}>{label}</text>
    </g>
  );
};

// ---------- a distant ceiling tube, scaled down by depth ----------
const TubeFar: React.FC<{ w: number; o?: number }> = ({ w, o = 0.5 }) => {
  const r = MARKET;
  const p = r.P(0.5, 0.05, w);
  const s = r.s(w) / r.s(0.5);
  return (
    <g opacity={o}>
      <rect x={p.x - 28 * s} y={p.y - 9 * s} width={56 * s} height={11 * s} rx={4 * s} fill="#0E1116" stroke="#20242C" strokeWidth={2 * s} />
      <rect x={p.x - 24 * s} y={p.y + 2 * s} width={48 * s} height={7 * s} rx={3.5 * s} fill="#CFE2EE" opacity={0.55} />
    </g>
  );
};

// ---------- a cold streak of lamp light lying on the polished floor ----------
const FloorStreak: React.FC<{ u: number; w: number; kind: 'cool' | 'red'; o: number; rx?: number }> = ({ u, w, kind, o, rx = 120 }) => {
  const r = MARKET;
  const p = r.P(u, 0.96, w);
  const s = r.s(w) / r.s(0.4);
  return <ellipse cx={p.x} cy={p.y} rx={rx * s} ry={15 * s} fill={`url(#g3${kind})`} opacity={o} style={{ mixBlendMode: 'screen' }} />;
};

// ---------- the checkout lane (right-front): belt, scanner, bagging shelf, POS, terminal ----------
const Counter: React.FC<{ t: number }> = () => {
  const r = MARKET;
  const { P, Q } = r;
  const K = r.s(0.2);
  const k = (w: number) => r.s(w) / K;
  return (
    <g>
      <FloorShadow r={r} u={[0.74, 1]} w={[0.1, 0.48]} o={0.45} />
      {/* the counter run along the lane: front panel, kick plate, stainless top */}
      <Box r={r} u={[0.78, 1]} v={[0.62, 0.92]} w={[0.12, 0.26]} front="#14181F" top={NIGHT.shelf} side={NIGHT.shelfDark} />
      <Box r={r} u={[0.785, 0.995]} v={[0.92, 0.98]} w={[0.12, 0.26]} front={NIGHT.metalDark} top={NIGHT.metalDark} side="#0A0D11" />
      <Box r={r} u={[0.78, 1]} v={[0.52, 0.62]} w={[0.12, 0.26]} front="#1A2029" top="#3A414C" side={NIGHT.shelfDark} />
      {/* the cash drawer face in the aisle-side panel */}
      <polygon points={Q([[0.779, 0.66, 0.155], [0.779, 0.66, 0.188], [0.779, 0.77, 0.188], [0.779, 0.77, 0.155]])} fill={NIGHT.metalDark} stroke={NIGHT.metal} strokeWidth={2.5} />
      {/* the conveyor belt along the deep half of the counter, slats running across */}
      <Box r={r} u={[0.845, 0.985]} v={[0.495, 0.53]} w={[0.19, 0.255]} front="#0D1014" top="#151A20" side="#0A0D11" />
      {Array.from({ length: 7 }).map((_, i) => {
        const w = 0.194 + i * 0.0088;
        const a = P(0.845, 0.498, w);
        const b = P(0.985, 0.498, w);
        return <path key={i} d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke="#0A0D11" strokeWidth={2.2} opacity={0.9} />;
      })}
      {/* the scanner well: a dark glass inset between belt and bagging shelf */}
      <Box r={r} u={[0.845, 0.985]} v={[0.495, 0.53]} w={[0.158, 0.188]} front="#0A0E12" top="#1C232C" side="#0A0D11" />
      {/* the bagging shelf at the near end, with a bag holder and two plastic bags */}
      {(() => {
        const p = P(0.955, 0.5, 0.138);
        const s = k(0.138);
        return (
          <g>
            <path d={`M ${p.x} ${p.y - 8 * s} L ${p.x} ${p.y - 66 * s}`} stroke={NIGHT.metal} strokeWidth={5 * s} strokeLinecap="round" />
            <rect x={p.x - 32 * s} y={p.y - 76 * s} width={64 * s} height={10 * s} rx={4 * s} fill={NIGHT.metalDark} stroke={NIGHT.metal} strokeWidth={2.5 * s} />
            <path d={`M ${p.x - 20 * s} ${p.y - 66 * s} l -9 ${30 * s} l 23 ${3 * s} l 5 ${-31 * s} Z`} fill="#AEB6BF" opacity={0.45} />
            <path d={`M ${p.x + 12 * s} ${p.y - 66 * s} l -8 ${28 * s} l 21 ${2 * s} l 5 ${-29 * s} Z`} fill="#AEB6BF" opacity={0.35} />
          </g>
        );
      })()}
      {/* the POS monitor on its pole, screen turned toward the cashier; the standby dot is dead */}
      {(() => {
        const p = P(0.868, 0.5, 0.185);
        const s = k(0.185);
        return (
          <g>
            <rect x={p.x - 5 * s} y={p.y - 78 * s} width={10 * s} height={76 * s} fill={NIGHT.metalDark} stroke={NIGHT.metal} strokeWidth={2 * s} />
            <g transform={`rotate(-6 ${p.x} ${p.y - 78 * s})`}>
              <rect x={p.x - 46 * s} y={p.y - 134 * s} width={92 * s} height={58 * s} rx={5 * s} fill="#0D1015" stroke={NIGHT.metal} strokeWidth={3.5 * s} />
              <rect x={p.x - 39 * s} y={p.y - 127 * s} width={78 * s} height={44 * s} rx={3 * s} fill="#101318" />
              <text x={p.x} y={p.y - 98 * s} textAnchor="middle" fontFamily="'Fragment Mono'" fontSize={16 * s} fill="#3E5666" opacity={0.7}>--:--</text>
            </g>
          </g>
        );
      })()}
      {/* the card terminal on its stalk, angled at the customer */}
      {(() => {
        const p = P(0.93, 0.5, 0.192);
        const s = k(0.192);
        return (
          <g>
            <rect x={p.x - 7 * s} y={p.y - 22 * s} width={14 * s} height={22 * s} fill={NIGHT.metalDark} />
            <g transform={`rotate(-14 ${p.x} ${p.y - 22 * s})`}>
              <rect x={p.x - 23 * s} y={p.y - 52 * s} width={46 * s} height={30 * s} rx={4 * s} fill="#0D1015" stroke={NIGHT.metal} strokeWidth={2.5 * s} />
              <rect x={p.x - 17 * s} y={p.y - 45 * s} width={34 * s} height={13 * s} rx={2 * s} fill="#101318" />
            </g>
          </g>
        );
      })()}
      {/* the lane sign pole at the mouth of the lane */}
      {(() => {
        const p = P(0.76, 0.96, 0.1);
        return (
          <g>
            <path d={`M ${p.x} ${p.y} L ${p.x} ${p.y - 150}`} stroke="#2A2F3A" strokeWidth={7} strokeLinecap="round" />
            <rect x={p.x - 36} y={p.y - 198} width={72} height={48} rx={5} fill="#20242C" stroke={NIGHT.lines} strokeWidth={3} />
            <text x={p.x} y={p.y - 166} textAnchor="middle" fontFamily="'Fragment Mono'" fontWeight={700} fontSize={19} fill="#8FA6B8">QUẦY 01</text>
          </g>
        );
      })()}
    </g>
  );
};

// ---------- the back door at eleven o'clock: a real steel emergency exit ----------
const BackDoor: React.FC<{ crack?: number }> = ({ crack = 0 }) => {
  const r = MARKET;
  const { P, Q } = r;
  return (
    <g>
      {/* the door frame, then the leaf */}
      {(() => {
        const f0 = P(0, 0.18, 0.14);
        const f1 = P(0, 0.18, 0.42);
        const b1 = P(0, 1, 0.42);
        const b0 = P(0, 1, 0.14);
        return <polygon points={`${f0.x},${f0.y} ${f1.x},${f1.y} ${b1.x},${b1.y} ${b0.x},${b0.y}`} fill="#0B0E12" stroke={NIGHT.metal} strokeWidth={6} />;
      })()}
      {(() => {
        const t0 = P(0, 0.24, 0.17);
        const t1 = P(0, 0.24, 0.39);
        const b1 = P(0, 1, 0.39);
        const b0 = P(0, 1, 0.17);
        return <polygon points={`${t0.x},${t0.y} ${t1.x},${t1.y} ${b1.x},${b1.y} ${b0.x},${b0.y}`} fill={NIGHT.metalDark} stroke={NIGHT.metal} strokeWidth={5} />;
      })()}
      {/* the hinges on the jamb edge */}
      {[0.36, 0.6, 0.84].map((v, i) => (
        <polygon key={i} points={Q([[0, v - 0.045, 0.155], [0, v - 0.045, 0.183], [0, v + 0.045, 0.183], [0, v + 0.045, 0.155]])} fill={NIGHT.metal} opacity={0.9} />
      ))}
      {/* the door closer arm along the top */}
      {(() => {
        const p = P(0, 0.265, 0.185);
        const p2 = P(0, 0.265, 0.26);
        return (
          <g>
            <polygon points={Q([[0, 0.252, 0.175], [0, 0.252, 0.255], [0, 0.278, 0.255], [0, 0.278, 0.175]])} fill={NIGHT.metalDark} stroke={NIGHT.metal} strokeWidth={2} />
            <path d={`M ${p2.x} ${p2.y} L ${P(0, 0.33, 0.32).x} ${P(0, 0.33, 0.32).y}`} stroke={NIGHT.metal} strokeWidth={4.5} strokeLinecap="round" />
          </g>
        );
      })()}
      {/* the small wired-glass window high in the leaf */}
      {(() => {
        const w = P(0, 0.38, 0.22);
        const w2 = P(0, 0.38, 0.33);
        const d2 = P(0, 0.5, 0.33);
        const d = P(0, 0.5, 0.22);
        return <polygon points={`${w.x},${w.y} ${w2.x},${w2.y} ${d2.x},${d2.y} ${d.x},${d.y}`} fill="#0F141A" stroke={NIGHT.metal} strokeWidth={3.5} opacity={0.95} />;
      })()}
      {/* the KHẨN CẤP plate above the push bar */}
      {(() => {
        const p = P(0, 0.47, 0.295);
        return (
          <g opacity={0.85}>
            <rect x={p.x - 44} y={p.y - 13} width={88} height={24} rx={4} fill="#10141A" stroke={NIGHT.metal} strokeWidth={2.5} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontFamily="'Fragment Mono'" fontSize={12} fill="#8FA6B8" letterSpacing={2}>KHẨN CẤP</text>
          </g>
        );
      })()}
      {/* the push bar with its end housings */}
      {(() => {
        const a = P(0, 0.62, 0.19);
        const b = P(0, 0.62, 0.37);
        const h0 = P(0, 0.62, 0.182);
        const h1 = P(0, 0.62, 0.378);
        return (
          <g>
            <rect x={h0.x - 7} y={h0.y - 17} width={14} height={34} rx={3} fill={NIGHT.metalDark} stroke={NIGHT.metal} strokeWidth={2.5} />
            <rect x={h1.x - 7} y={h1.y - 17} width={14} height={34} rx={3} fill={NIGHT.metalDark} stroke={NIGHT.metal} strokeWidth={2.5} />
            <path d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`} stroke="#4A5260" strokeWidth={10} strokeLinecap="round" />
            <path d={`M ${a.x} ${a.y - 2.5} L ${b.x} ${b.y - 2.5}`} stroke="#5E6774" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
          </g>
        );
      })()}
      {/* the kick plate along the bottom */}
      <polygon points={Q([[0, 0.86, 0.178], [0, 0.86, 0.382], [0, 0.97, 0.382], [0, 0.97, 0.178]])} fill="#2E3540" stroke={NIGHT.metal} strokeWidth={2.5} opacity={0.9} />
      {/* the thumb-latch on the free edge: backplate, four screws, the turn knob, a keyhole under */}
      {(() => {
        const l = LATCH;
        return (
          <g>
            <rect x={l.x - 15} y={l.y - 32} width={30} height={64} rx={5} fill="#0E1116" stroke={NIGHT.metal} strokeWidth={3} />
            {[[-10, -26], [10, -26], [-10, 26], [10, 26]].map(([dx, dy], i) => (
              <circle key={i} cx={l.x + dx} cy={l.y + dy} r={2.4} fill="#3A414C" />
            ))}
            <rect x={l.x - 6} y={l.y - 15} width={12} height={30} rx={4} fill="#59616C" stroke="#7A828C" strokeWidth={2} />
            <path d={`M ${l.x} ${l.y - 9} L ${l.x} ${l.y + 9}`} stroke="#1B2028" strokeWidth={3} strokeLinecap="round" />
            <circle cx={l.x} cy={l.y + 25} r={3.5} fill="#05070A" stroke={NIGHT.metal} strokeWidth={1.5} />
          </g>
        );
      })()}
      {/* the crack: a cold seam of light widening past the free edge when pushed */}
      {crack > 0.01 ? (
        <g>
          {(() => {
            const e0 = P(0, 0.24, 0.39);
            const e1 = P(0, 1, 0.39);
            const e2 = P(0, 1, 0.39 + crack * 0.05);
            const e3 = P(0, 0.24, 0.39 + crack * 0.05);
            return (
              <g>
                <polygon points={`${e0.x},${e0.y} ${e3.x},${e3.y} ${e2.x},${e2.y} ${e1.x},${e1.y}`} fill="#D8E2EA" opacity={0.92} style={{ mixBlendMode: 'screen' }} />
                <polygon points={`${e0.x},${e0.y} ${e3.x},${e3.y} ${e2.x},${e2.y} ${e1.x},${e1.y}`} fill="#8FA6B8" opacity={0.4} style={{ mixBlendMode: 'screen' }} />
              </g>
            );
          })()}
          <Glow x={BDOOR.x + 40} y={BDOOR.y} r={140 + 260 * crack} kind="cool" o={0.55 * crack} />
        </g>
      ) : null}
      {/* the EXIT lamp above the door */}
      {(() => {
        const lp = P(0, 0.2, 0.28);
        return (
          <g>
            <rect x={lp.x - 34} y={lp.y - 12} width={68} height={22} rx={5} fill="#0E1116" stroke={NIGHT.metal} strokeWidth={3} />
            <text x={lp.x} y={lp.y + 5} textAnchor="middle" fontFamily="'Fragment Mono'" fontWeight={700} fontSize={13} fill="#FF5A4A" opacity={0.85}>EXIT</text>
            <circle cx={lp.x} cy={lp.y} r={44} fill="url(#g3red)" opacity={0.4} />
          </g>
        );
      })()}
    </g>
  );
};

// ---------- the tube banks ----------
const TubeBank: React.FC<{ t: number; id: string; flicker?: boolean; x: number; y: number }> = ({ t, id, flicker = false, x, y }) => {
  const base = flicker ? 0.55 + 0.45 * Math.sin(t / 7) * Math.sin(t / 2.3) : 0.72;
  const on = flicker ? (rnd(4, Math.floor(t / 2)) > 0.18 ? base : base * 0.06) : base;
  const lit = 0.12 + 0.5 * on;
  return (
    <g>
      <path d={`M ${x} ${y - 190} L ${x} ${y - 78}`} stroke="#0A0C10" strokeWidth={5} />
      <rect x={x - 30} y={y - 84} width={60} height={12} rx={4} fill="#0E1116" stroke="#232830" strokeWidth={2.5} id={id} />
      <rect x={x - 26} y={y - 70} width={52} height={9} rx={4.5} fill="#CFE2EE" opacity={lit} />
      <rect x={x - 24} y={y - 70} width={48} height={3} fill="#FFFFFF" opacity={0.5 * lit} />
    </g>
  );
};

// ---------- the room ----------
/** The night supermarket. `blink` stutters the far tube, `crack` opens the back door's seam, `red` brings up
 *  the EXIT lamp and an alarm-red wash for the turn. */
export const MarketRoom: React.FC<{
  t: number;
  id?: string;
  veil?: number;
  blink?: boolean;
  crack?: number;
  red?: number;
  /** 'one' (default): the single wide aisle of Tập 1. 'aisles': a real store plan — two center gondolas make
   *  three aisles, category signs hang over each, a chiller wall closes the deep end. */
  layout?: 'one' | 'aisles';
}> = ({ t, id = 'mkt', veil = 0.52, blink = false, crack = 0, red = 0, layout = 'one' }) => {
  const r = MARKET;
  const { P } = r;
  const wide = layout === 'aisles';
  const flickOn = blink ? (rnd(4, Math.floor(t / 2)) > 0.18 ? 1 : 0.05) : 1;
  return (
    <g>
      <RoomShell r={r} id={id} wall={NIGHT.wall} side={NIGHT.side} floorC={NIGHT.floor} ceiling={NIGHT.ceiling} lines={NIGHT.lines} floor="tiles" />
      {/* the far end: the aisle opens and sinks into darkness — a black mouth across most of the back wall,
          with faint deep shelving barely catching light inside it */}
      {!wide &&
        (() => {
        const a = P(0.1, 0.2, 0);
        const b = P(0.9, 0.2, 0);
        const c = P(0.9, 1, 0);
        const d = P(0.1, 1, 0);
        const deep = [0.16, 0.32, 0.46, 0.6, 0.76, 0.88];
        return (
          <g>
            <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill="#050609" />
            {deep.map((u, i) => {
              const t0 = P(u, 0.3, 0);
              const t1 = P(u, 0.62, 0);
              return <path key={i} d={`M ${t0.x} ${t0.y} L ${t1.x} ${t1.y}`} stroke="#161A20" strokeWidth={7 - i * 0.6} opacity={0.8} />;
            })}
            {/* the cold depth glow far down the aisle */}
            <ellipse cx={P(0.5, 0.75, 0).x} cy={P(0.5, 0.8, 0).y} rx={210} ry={60} fill="url(#g3cool)" opacity={0.1} style={{ mixBlendMode: 'screen' }} />
            {/* a dim promo banner strung across the dark */}
            {(() => {
              const p0 = P(0.22, 0.12, 0);
              const p1 = P(0.78, 0.12, 0);
              return (
                <g opacity={0.55}>
                  <path d={`M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`} stroke="#101318" strokeWidth={4} />
                  <text x={(p0.x + p1.x) / 2} y={p0.y + 26} textAnchor="middle" fontFamily="'Fragment Mono'" fontSize={19} fill="#2C3642">KHUYẾN MÃI ĐÊM</text>
                </g>
              );
            })()}
          </g>
        );
      })()}
      {/* shelf rows: the right bank runs the whole depth; the left bank stops short of the door corner,
          with a deep unit continuing behind it */}
      <ShelfRow side={1} seed={23} w0={0.05} w1={0.985} n={9} />
      <ShelfRow side={0} seed={11} w0={0.5} w1={0.985} n={4} />
      <ShelfRow side={0} seed={15} w0={0.16} w1={0.5} n={2} />
      <ShelfRow side={0} seed={13} w0={0.035} w1={0.115} n={1} />
      {/* the far dark end breathes over the floor: a fog polygon that swallows the depth */}
      {(() => {
        const yFar = P(0.5, 1, 0).y;
        const yNear = P(0.5, 1, 0.42).y;
        const a = P(0.04, 1, 0);
        const b = P(0.96, 1, 0);
        const c = P(0.96, 1, 0.42);
        const d = P(0.04, 1, 0.42);
        return (
          <g>
            <defs>
              <linearGradient id={`${id}fog`} gradientUnits="userSpaceOnUse" x1={0} y1={yFar} x2={0} y2={yNear}>
                <stop offset="0%" stopColor="#04050A" stopOpacity={0.92} />
                <stop offset="55%" stopColor="#04050A" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#04050A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill={`url(#${id}fog)`} />
          </g>
        );
      })()}
      {/* the hanging aisle signs, stepping down the ceiling line */}
      <AisleSign w={0.62} label="LỐI 01" />
      <AisleSign w={0.2} label="LỐI 02" />
      {/* the checkout lane on the right, empty: the till's dead dot */}
      <Counter t={t} />
      {/* a stack of delivery boxes in the lối kho (front-left, behind the camera's usual left shoulder) */}
      {(() => {
        const b = P(0.02, 1, 0.66);
        const s = r.s(0.66);
        return (
          <g>
            <ellipse cx={b.x} cy={b.y + 3} rx={60 * s} ry={10 * s} fill="#000" opacity={0.35} />
            <rect x={b.x - 50 * s} y={b.y - 58 * s} width={96 * s} height={54 * s} rx={4 * s} fill="#262B33" stroke={NIGHT.lines} strokeWidth={3} />
            <rect x={b.x - 44 * s} y={b.y - 110 * s} width={84 * s} height={50 * s} rx={4 * s} fill="#232830" stroke={NIGHT.lines} strokeWidth={3} />
            <path d={`M ${b.x - 34 * s} ${b.y - 86 * s} L ${b.x + 26 * s} ${b.y - 86 * s}`} stroke={NIGHT.lines} strokeWidth={3} />
          </g>
        );
      })()}
      {/* the lamp streaks on the polished floor */}
      <FloorStreak u={0.5} w={0.38} kind="cool" o={0.13} rx={130} />
      <FloorStreak u={0.5} w={0.14} kind="cool" o={0.09} rx={80} />
      <FloorStreak u={0.88} w={0.2} kind="cool" o={0.1} rx={90} />
      <FloorStreak u={0.06} w={0.3} kind="red" o={0.1 + 0.18 * red} rx={70} />
      {/* the back door at eleven o'clock, its latch, the EXIT lamp, the crack */}
      <BackDoor crack={crack} />
      {/* the tube banks overhead: the two near ones, then the row receding into the dark */}
      {(() => {
        const a = P(0.26, 0.05, 0.28);
        const b = TUBES;
        return (
          <g>
            <TubeBank t={t} id="tA" x={a.x} y={a.y} />
            <TubeBank t={t} id="tB" x={b.x} y={b.y} flicker />
            <TubeFar w={0.14} o={0.75} />
            <TubeFar w={0.05} o={0.45} />
          </g>
        );
      })()}
      {/* the contrast pass, then the lights again on top */}
      <LightVeil
        id={`${id}veil`}
        lights={[
          [P(0.26, 0.05, 0.28).x, P(0.26, 0.05, 0.28).y + 30, 320],
          [TUBES.x, TUBES.y + 30, 300 * (blink ? flickOn : 1)],
          [BDOOR.x, BDOOR.y, 170 + 90 * red],
          [EXIT.x, EXIT.y, 150 + 130 * red],
          [P(0.93, 0.5, 0.17).x, P(0.93, 0.5, 0.17).y, 170],
          [P(0.5, 0.8, 0).x, P(0.5, 0.8, 0).y, 120],
        ]}
        o={veil}
      />
      <Glow x={P(0.26, 0.05, 0.28).x} y={P(0.26, 0.05, 0.28).y + 30} r={280} kind="cool" o={0.2} />
      <Glow x={TUBES.x} y={TUBES.y + 30} r={260 * (blink ? flickOn : 1)} kind="cool" o={0.22} />
      <Glow x={EXIT.x} y={EXIT.y} r={140 + 160 * red} kind="red" o={0.35 + 0.45 * red} />
      {red > 0 ? <Glow x={BDOOR.x} y={BDOOR.y} r={260} kind="red" o={0.5 * red} /> : null}
      <Dust t={t} seed={17} x0={700} y0={360} w={520} h={340} n={14} o={0.3} />
      <Dust t={t} seed={29} x0={BDOOR.x - 140} y0={BDOOR.y - 100} w={300} h={260} n={10} o={0.22} />
    </g>
  );
};

/** The CCTV insert look: a full-frame monitor with scanlines, a camera label and a REC dot.
 *  Vertical build: the bezel fills the whole 1080 x 1920 canvas, the feed fills it edge to edge. */
export const Cctv: React.FC<{ id?: string; label?: string; time?: string; t: number; children: React.ReactNode }> = ({ id = 'cam', label = 'CAM 04 — CỬA SAU', time = '02:00', t, children }) => (
  <g>
    <rect x={-420} y={-420} width={2760} height={2760} fill="#0A0D11" />
    <defs>
      <clipPath id={`${id}scr`}>
        <rect x={420} y={-420} width={1080} height={1920} rx={8} />
      </clipPath>
    </defs>
    <rect x={420} y={-420} width={1080} height={1920} rx={8} fill="#11161C" />
    <g clipPath={`url(#${id}scr)`}>
      {children}
      {Array.from({ length: 128 }).map((_, i) => (
        <rect key={i} x={420} y={-420 + i * 15} width={1080} height={4} fill="#05070A" opacity={0.5} />
      ))}
      <rect x={420} y={-420 + ((t * 4) % 1920)} width={1080} height={26} fill="#FFFFFF" opacity={0.05} />
    </g>
    <rect x={420} y={-420} width={1080} height={1920} rx={8} fill="none" stroke="#232830" strokeWidth={6} />
    <text x={455} y={-356} fontFamily="'Fragment Mono'" fontWeight={700} fontSize={30} fill="#9FB4C4" opacity={0.85}>{label}</text>
    <circle cx={1444} cy={-364} r={10} fill="#FF3B30" opacity={0.5 + 0.5 * Math.sin(t / 2.2)} />
    <text x={1412} y={-354} textAnchor="end" fontFamily="'Fragment Mono'" fontSize={26} fill="#9FB4C4" opacity={0.7}>REC</text>
    <text x={455} y={1444} fontFamily="'Fragment Mono'" fontSize={24} fill="#7A8A98" opacity={0.6}>{time}</text>
  </g>
);

/** The thing's hand through the crack: a long pale forearm in from the origin (x, y is the seam's point on the
 *  door), too smooth, the fingers curling down the wrong way. `L` is the screen-space distance to the target
 *  and `s` the same scale you pass — so the arm lands exactly on its target; `reach` 0..1 extends it and the
 *  fingertip curl follows. Call it like the S20 reference: s = L / 300, L = hypot(dx, dy), rot = atan2(dy, dx). */
export const PaleHand: React.FC<{ x: number; y: number; rot?: number; s?: number; L?: number; reach?: number }> = ({ x, y, rot = 0, s = 1, L = 300, reach = 0 }) => {
  const G = '#8C97A0';
  const GD = '#59646C';
  const ext = 0.32 + 0.68 * easeOut(clamp(reach));
  const Wc = (L / s) * ext; // the wrist's reach in local units, so the fingertips land on the target at full reach
  const curl = clamp(reach);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={Wc} cy={44} rx={70} ry={12} fill="#000" opacity={0.3} />
      {/* the forearm, smooth and pale, in from the dark seam */}
      <path d={`M 0 -6 Q ${Wc * 0.5} -16 ${Wc - 6} -2`} stroke={G} strokeWidth={19} fill="none" strokeLinecap="round" />
      <path d={`M 4 2 Q ${Wc * 0.5} -6 ${Wc - 6} 6`} stroke={GD} strokeWidth={4.5} fill="none" opacity={0.7} />
      {/* faint creases along the skin */}
      <path d={`M ${Wc * 0.3} -12 q 10 12 4 26 M ${Wc * 0.62} -10 q 8 12 2 24`} stroke={GD} strokeWidth={2.5} fill="none" opacity={0.75} />
      {/* the heel of the hand at the end of the arm */}
      <ellipse cx={Wc + 15} cy={1} rx={15} ry={23} fill={G} stroke={GD} strokeWidth={2.5} />
      <path d={`M ${Wc + 10} -14 q 8 14 2 30`} stroke={GD} strokeWidth={3} fill="none" opacity={0.6} />
      {/* four fingers curving down from the heel, the curl pulling their tips back */}
      {[-28, -12, 5, 21].map((fy, i) => (
        <path
          key={i}
          d={`M ${Wc + 24} ${fy} Q ${Wc + 2 - curl * 4} ${fy - 3} ${Wc - 16 - curl * 6} ${fy + 2 + i}`}
          stroke={G}
          strokeWidth={11 - i}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {/* the knuckles */}
      <path d={`M ${Wc + 24} -24 q 5 5 0 10 M ${Wc + 25} -8 q 5 5 0 10 M ${Wc + 25} 9 q 5 5 0 10`} stroke={GD} strokeWidth={2.5} fill="none" opacity={0.6} />
      {/* the thumb folded under the palm */}
      <path
        d={`M ${Wc + 12} 30 Q ${Wc - 4} ${40 + curl * 4} ${Wc - 22} ${34 + curl * 2} Q ${Wc - 28} ${30 + curl * 2} ${Wc - 22} 26 Q ${Wc - 6} 24 ${Wc + 8} 26 Z`}
        fill={G}
        stroke={GD}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </g>
  );
};

/** The red handprint burned into the skin: a palm and five finger pads that rise with `press` 0..1. */
export const Handprint: React.FC<{ x: number; y: number; rot?: number; s?: number; press: number; smoke?: number; t: number }> = ({ x, y, rot = 0, s = 1, press, smoke = 0, t }) => {
  const p = clamp(press);
  if (p <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {smoke > 0
        ? [0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M ${(i - 1) * 14} -10 q ${6 + i * 3} -26 ${2 + i * 4} -${44 + i * 8}`}
              stroke="#B23A40"
              strokeWidth={7 - i}
              fill="none"
              strokeLinecap="round"
              opacity={smoke * (0.35 + 0.25 * Math.sin(t / 2.5 + i))}
            />
          ))
        : null}
      <ellipse cx={0} cy={6} rx={26} ry={32} fill="#B23A40" opacity={0.85 * p} />
      {[
        [-18, -34, 7],
        [-6, -40, 8],
        [7, -40, 8],
        [18, -33, 7],
        [26, -14, 6],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#B23A40" opacity={0.85 * p} />
      ))}
      <ellipse cx={0} cy={6} rx={16} ry={20} fill="#7A1E26" opacity={0.7 * p} />
      <circle cx={0} cy={0} r={70} fill="url(#g3red)" opacity={0.4 * p} style={{ mixBlendMode: 'screen' }} />
    </g>
  );
};

// ---------- the one outside ----------
/** The night-shift creature, for the CCTV close-ups: a narrow dark body, a pale plate face that lifts to the lens,
 *  and the smile that opens red. x, y is its base on the floor; `rise` 0..1 lifts the bowed head level with the
 *  camera; `smile` 0..1 pulls the mouth wide; `s` scales. Pure function of the props, so any CCTV shot can stage it. */
export const GhostHead: React.FC<{ x: number; y: number; s: number; rise: number; smile: number; t: number }> = ({ x, y, s, rise, smile, t }) => {
  const lift = easeOut(clamp(rise));
  const tilt = lerp(58, 9, lift);
  const sway = Math.sin(t / 3.4) * 2;
  const open = easeOut(clamp(smile));
  const FACE = '#77817A';
  return (
    <g transform={`translate(${x + sway * 0.5} ${y}) scale(${s})`}>
      {/* the narrow dark body rising off the floor */}
      <path d="M -44 -196 Q -30 -206 0 -208 Q 30 -206 44 -196 L 38 -4 Q 20 4 0 0 Q -24 6 -40 -16 Z" fill="#232927" stroke="#151A18" strokeWidth={3} />
      <path d="M -44 -196 Q -30 -206 0 -208 Q 30 -206 44 -196 L 42 -156 L -42 -156 Z" fill="#1C2220" opacity={0.85} />
      {[-1, 1].map((side) => (
        <g key={side}>
          <path d={`M ${side * 40} -186 Q ${side * 52} -120 ${side * 40} -30`} stroke="#232927" strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d={`M ${side * 40} -30 Q ${side * 42} -18 ${side * 40} -10`} stroke="#6E756C" strokeWidth={4.5} fill="none" strokeLinecap="round" />
        </g>
      ))}
      <path d="M -40 -178 Q -60 -60 -52 32 Q -46 50 -34 44 Q -46 -50 -30 -158 Z" fill="#04050A" />
      <path d="M 40 -178 Q 60 -60 52 32 Q 46 50 34 44 Q 46 -50 30 -158 Z" fill="#04050A" />
      {/* the head, lifting from bowed to level with the lens */}
      <g transform={`translate(0 ${-216 + lerp(34, 0, lift)})`}>
        <g transform={`rotate(${tilt} 0 24)`}>
          <path d="M -34 -16 Q -40 -64 0 -70 Q 40 -64 34 -16 L 32 52 Q 14 64 -4 60 L -30 48 Z" fill="#04050A" />
          <path d="M 3 -48 Q 20 -42 21 -12 Q 21 12 10 26 Q 3 22 3 -48 Z" fill={FACE} opacity={0.3 + 0.5 * lift} />
          <path d="M 7 -26 Q 14 -6 9 18" stroke="#5F685F" strokeWidth={3} opacity={0.35 + 0.25 * lift} fill="none" strokeLinecap="round" />
          <path d="M 9 0 q 3 4 0 7" stroke="#5F685F" strokeWidth={2} opacity={0.45 * lift} fill="none" strokeLinecap="round" />
          <ellipse cx={15} cy={-12} rx={4.2} ry={7.5} fill="#020304" opacity={lift} />
          <ellipse cx={4} cy={-13} rx={2.2} ry={5} fill="#020304" opacity={lift * 0.45} />
          <path
            d={`M 2 ${6 + open * 3} Q 11 ${12 + open * 6} ${20 + open * 8} ${2 - open * 3}`}
            stroke="#7A130D"
            strokeWidth={2.6}
            fill="none"
            strokeLinecap="round"
            opacity={(0.3 + 0.7 * lift) * (0.3 + 0.7 * open)}
          />
          {open > 0.35 ? (
            <path
              d={`M 4 ${8 + open * 4} Q 12 ${14 + open * 5} ${19 + open * 6} ${4 - open * 2} Q 11 ${9 + open * 4} 4 ${8 + open * 4} Z`}
              fill="#3A0806"
              opacity={lift * open * 0.85}
            />
          ) : null}
          {[-1, 8, 17].map((hx, i) => (
            <path
              key={i}
              d={`M ${hx} -46 Q ${hx + (i % 2 ? 6 : -5)} -12 ${hx + (i % 2 ? 2 : -2)} ${22 + i * 6}`}
              stroke="#04050A"
              strokeWidth={7 - lift * 2.6}
              fill="none"
              strokeLinecap="round"
              opacity={1 - lift * 0.35}
            />
          ))}
        </g>
      </g>
    </g>
  );
};
