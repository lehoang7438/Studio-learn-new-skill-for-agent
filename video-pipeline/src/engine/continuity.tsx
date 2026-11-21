import React from 'react';
import { clamp } from './anim';
import { FONT } from './fonts';
import { Renderer } from './metrics';
import { describeLookGaps, HandSpec, handSpecFor } from './look';
import { basePose, Pose } from './rig';
import { FlatHero, flatHandR } from './flat';
import { WheelHand } from './taxi';
import { CharSpec, characterChecklist } from './character';

// The continuity gate. A character sheet proves the drawing matches a reference AT REST; this strip
// proves it survives a scene change. It renders the SAME spec in four contexts — standing outside,
// sitting in the cab, a face close-up, and a hand gripping a prop — on one page, with the same light.
// If the silhouette, sleeve or hand skin changes between panels, the SCENE is wrong, not the sheet.

/** Four contexts, one Body Lock. Keep panels anchored on the same hip/head rule. */
export const ContinuitySheet: React.FC<{
  spec: CharSpec;
  t?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  bg?: string;
}> = ({ spec, t = 0, x = 420, y = -400, w = 1080, h = 1500, bg = '#101319' }) => {
  const S = spec.look;
  const hand: HandSpec = handSpecFor(S);
  const renderer: Renderer = spec.renderer ?? 'flat';
  const gaps = describeLookGaps(S, renderer);
  const inner = w - 80;
  const colW = inner / 2;
  const rowH = (h - 300) / 2;
  const light = { x: -0.55, y: -0.45, rim: 0.5, shade: 0.4, warm: '#FFF1D8' };
  const gid = `continuityClip-${spec.id}`;

  const panel = (i: number, label: string, pose: Pose, prop?: React.ReactNode) => {
    const px = 40 + (i % 2) * colW;
    const py = 270 + Math.floor(i / 2) * rowH;
    return (
      <g key={label} transform={`translate(${px} ${py})`}>
        <rect x={0} y={0} width={colW - 16} height={rowH - 16} rx={14} fill="#191D24" stroke="#2A303A" strokeWidth={2} />
        <text x={22} y={38} fontFamily={FONT.ui} fontSize={17} letterSpacing={3} fill="#8E9AA8">{label}</text>
        <g clipPath={`url(#${gid}-${i})`}>
          <FlatHero pose={pose} look={S} shadow={0} light={light} />
          {prop}
        </g>
      </g>
    );
  };

  // all four poses share one body spec; only camera framing and limb angles change
  const standing: Pose = {
    ...basePose,
    x: colW / 2 - 8,
    y: rowH / 2 + 170,
    scale: 1.1,
    yaw: 0,
    armL: { a: 12, b: -8 },
    armR: { a: 12, b: -8 },
    legL: { a: -6, b: 0 },
    legR: { a: 6, b: 0 },
  };
  const seated: Pose = {
    ...standing,
    yaw: 0.12,
    armL: { a: 38, b: 42 },
    armR: { a: 35, b: 44 },
    legL: { a: 74, b: -68 },
    legR: { a: 78, b: -70 },
  };
  const close: Pose = { ...standing, x: colW / 2 - 8, y: rowH / 2 + 470, scale: 2.6, yaw: 0.06 };
  const gripping: Pose = { ...standing, x: colW / 2 - 8, y: rowH / 2 + 120, scale: 1, yaw: 0.05 };
  const hr = flatHandR(gripping);

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        {[0, 1, 2, 3].map((i) => (
          <clipPath id={`${gid}-${i}`} key={i}>
            <rect x={40 + (i % 2) * colW} y={270 + Math.floor(i / 2) * rowH} width={colW - 16} height={rowH - 16} rx={14} />
          </clipPath>
        ))}
      </defs>
      <rect x={0} y={0} width={w} height={h} fill={bg} />
      <rect x={0} y={0} width={w} height={8} fill={S.jacket} />
      <text x={40} y={62} fontFamily={FONT.ui} fontSize={19} letterSpacing={4} fill="#7C8794">
        CONTINUITY STRIP · CÙNG MỘT NHÂN VẬT, 4 NGỮ CẢNH
      </text>
      <text x={40} y={132} fontFamily={FONT.title} fontSize={64} fill="#F4EEE2" letterSpacing={2}>
        {spec.name}
      </text>
      <text x={w - 40} y={132} textAnchor="end" fontFamily={FONT.ui} fontSize={16} letterSpacing={2} fill={gaps ? '#FF7A59' : '#5E6874'}>
        {renderer.toUpperCase()}{gaps ? ` · BỎ QUA: ${gaps}` : ' · KHỚP'}
      </text>
      <line x1={40} y1={168} x2={w - 40} y2={168} stroke="#2A303A" strokeWidth={2} />
      <text x={40} y={214} fontFamily={FONT.body} fontSize={21} fill="#9AA6B4">
        {characterChecklist(spec).join(' · ')}
      </text>

      {panel(0, 'NGOÀI TRỜI · TOÀN THÂN', standing)}
      {panel(1, 'TRONG XE · NGỒI', seated)}
      {panel(2, 'CẬN MẶT', close)}
      {panel(3, 'TAY CẦM VÔ LĂNG', gripping, <WheelHand x={hr.x} y={hr.y} look={S} s={0.9} />)}

      <g transform={`translate(40 ${h - 78})`}>
        <rect x={0} y={-32} width={inner} height={66} rx={12} fill="#1B2027" stroke={S.jacket} strokeWidth={2} />
        <text x={22} y={4} fontFamily={FONT.body} fontSize={21} fill="#F4EEE2">
          Da tay {hand.skin} · tay áo {hand.sleeve} — lấy từ CÙNG một Look, không gõ hex ở shot.
        </text>
      </g>
      <rect x={0} y={h - 8} width={clamp((t % 120) / 120) * w} height={8} fill={S.accent} opacity={0.85} />
    </g>
  );
};
