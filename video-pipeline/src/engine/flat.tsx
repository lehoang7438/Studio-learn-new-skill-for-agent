import React from 'react';
import { Look, LOOKS, Pose } from './rig';
import {
  BODY_METRICS,
  FLAT_LEG_LEN,
  FLAT_METRICS,
  HEAD,
  Pt,
  handAt,
  jointsFor,
  lerpPt,
  turnWidth,
} from './metrics';

// Re-export the sheet numbers: character.tsx and old shots import them from here.
export { FLAT_LEG_LEN, FLAT_METRICS };

// The flat-vector body, for the character-reference episode.
//
// `Hero` in rig.tsx is the studio's stick rig: a circle head on stroke limbs. That is the right body for the
// chalkboard episodes, but it is not the body in the reference images. This file is the second rig: the same
// `Pose` (so every pose, walk and prop attachment still works), drawn the way the reference is drawn —
// filled tapered limbs, a tee with short sleeves and bare arms, denim legs, big round eyes with a brown iris,
// thick brows, a messy fringe and wire glasses. No black outlines: the reference separates shapes with shade.
//
// Coordinates are the rig's: hips at 0,0, y down, head centre at HEAD.y. Only the silhouette changes.

// ---- body geometry -----------------------------------------------------------------------------
// ONE source of truth lives in metrics.ts. The maths below used to be copy-pasted from rig.tsx with
// different constants (thigh 72 vs 88, shoulder 42 vs 68...), so the same character changed shape
// when a scene swapped rigs. These wrappers keep every `flat*` call site working, nothing is redrawn.

/** Joints for the flat body: exactly `jointsFor`, with the flat skeleton's longer limbs. */
export const flatJoints = (pose: Pose, armLen = 1) => jointsFor(pose, BODY_METRICS.flat, armLen);

/** Where the flat body's hands are, for props and for the other character's grip. */
export const flatHandR = (pose: Pose, armLen = 1) => handAt(pose, BODY_METRICS.flat, armLen, 'R');
export const flatHandL = (pose: Pose, armLen = 1) => handAt(pose, BODY_METRICS.flat, armLen, 'L');

const shade = (hex: string, amount: number) => {
  // a darker/lighter copy of a hex colour, so a look only has to declare its base tones
  const n = parseInt(hex.replace('#', ''), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

/** Directional light for the flat body: x/y in -1..1 (0,0 = flat), rim/shade 0..1, warm = light colour. */
export type FlatLight = { x?: number; y?: number; rim?: number; shade?: number; warm?: string };

/** The flat body. Same props as `Hero`, so a scene can swap one line and keep its blocking.
 *  `hands` false drops the mitten at the end of each arm, for a shot that draws its own hand on top. */
export const FlatHero: React.FC<{
  pose: Pose;
  look?: Look;
  shadow?: number;
  rimId?: string | null;
  light?: FlatLight;
  hands?: boolean;
}> = ({
  pose,
  look = LOOKS.pipHood,
  shadow = 1,
  rimId,
  light = {},
  hands = true,
}) => {
  const L = look;
  const lx = Math.max(-1, Math.min(1, light.x ?? -0.6));
  const ly = Math.max(-1, Math.min(1, light.y ?? -0.35));
  const rimAmt = Math.max(0, Math.min(1, light.rim ?? 0.6));
  const shadeAmt = Math.max(0, Math.min(1, light.shade ?? 0.42));
  const warm = light.warm ?? '#FFE7C2';
  const gid = React.useId().replace(/[:]/g, '');
  const j = flatJoints(pose, look?.armLen ?? 1);
  const ink = L.line;
  const long = Boolean(L.longFace);
  const rx = L.headR ?? FLAT_METRICS.headR;
  const ry = long ? 70 : 60;
  const headPath = `M ${-rx} ${HEAD.y - 4} C ${-rx} ${HEAD.y - ry * 0.9} ${-rx * 0.62} ${HEAD.y - ry} 0 ${HEAD.y - ry} C ${rx * 0.62} ${HEAD.y - ry} ${rx} ${HEAD.y - ry * 0.9} ${rx} ${HEAD.y - 4} C ${rx} ${HEAD.y + ry * 0.5} ${rx * 0.62} ${HEAD.y + ry} 0 ${HEAD.y + ry} C ${-rx * 0.62} ${HEAD.y + ry} ${-rx} ${HEAD.y + ry * 0.5} ${-rx} ${HEAD.y - 4} Z`;
  const torsoPath = 'M -74 -102 Q -38 -108 0 -108 Q 38 -108 74 -102 L 64 -22 Q 62 12 56 20 Q 0 29 -56 20 Q -62 12 -64 -22 Z';
  // One light, painted on every surface: a soft warm pool on the lit side, a soft cool shade on the
  // far side, and a rim that follows the lit edge. Percent coordinates, so each shape gets its own.
  const lightDefs = (
    <defs>
      <clipPath id={`${gid}-head`}>
        <path d={headPath} />
      </clipPath>
      <clipPath id={`${gid}-torso`}>
        <path d={torsoPath} />
      </clipPath>
      <linearGradient
        id={`${gid}-shade`}
        x1={`${50 + lx * 50}%`}
        y1={`${50 + ly * 50}%`}
        x2={`${50 - lx * 50}%`}
        y2={`${50 - ly * 50}%`}
      >
        <stop offset="0%" stopColor="#241109" stopOpacity={0} />
        <stop offset="34%" stopColor="#2A1710" stopOpacity={0.04 * shadeAmt} />
        <stop offset="58%" stopColor="#2A1710" stopOpacity={0.26 * shadeAmt} />
        <stop offset="78%" stopColor="#2A1710" stopOpacity={0.5 * shadeAmt} />
        <stop offset="100%" stopColor="#2A1710" stopOpacity={0.68 * shadeAmt} />
      </linearGradient>
      <radialGradient id={`${gid}-warm`} cx={`${50 + lx * 42}%`} cy={`${50 + ly * 42}%`} r="72%">
        <stop offset="0%" stopColor={warm} stopOpacity={0.1 + 0.16 * rimAmt} />
        <stop offset="100%" stopColor={warm} stopOpacity={0} />
      </radialGradient>
      <linearGradient
        id={`${gid}-rim`}
        x1={`${50 + lx * 50}%`}
        y1={`${50 + ly * 50}%`}
        x2={`${50 - lx * 50}%`}
        y2={`${50 - ly * 50}%`}
      >
        <stop offset="0%" stopColor={warm} stopOpacity={0.8 * rimAmt} />
        <stop offset="26%" stopColor={warm} stopOpacity={0.22 * rimAmt} />
        <stop offset="52%" stopColor={warm} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
  // a cylinder of shade down one side of a limb, and a thin rim on the other
  const limbLight = (a: Pt, b: Pt, w: number, dark: string) => (
    <g>
      <line
        x1={a.x - lx * 4}
        y1={a.y - ly * 4}
        x2={b.x - lx * 4}
        y2={b.y - ly * 4}
        stroke={dark}
        strokeWidth={w * 0.52}
        opacity={0.3 * shadeAmt}
        strokeLinecap="round"
      />
      <line
        x1={a.x + lx * 5}
        y1={a.y + ly * 5}
        x2={b.x + lx * 5}
        y2={b.y + ly * 5}
        stroke={warm}
        strokeWidth={w * 0.26}
        opacity={0.28 * rimAmt}
        strokeLinecap="round"
      />
    </g>
  );
  const eyeY = HEAD.y - 4;
  const eyeCX = long ? 17 : 19;
  const eyeRX = long ? 11.5 : 14;
  const eyeRY = long ? 13 : 15;
  const irisR = long ? 6.8 : 8.2;
  const mY = long ? HEAD.y + 40 : HEAD.y + 36;
  const sleeveR = long ? 14 : 17;

  const capsule = (a: Pt, b: Pt, w: number, color: string) => (
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={w} strokeLinecap="round" />
  );

  /** a limb that narrows from one end to the other, so a forearm flows into a wrist instead of ending
   *  in a fat round cap that the hand then has to cover */
  const taperLimb = (a: Pt, b: Pt, w0: number, w1: number, color: string) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const n = Math.hypot(dx, dy) || 1;
    const nx = -dy / n;
    const ny = dx / n;
    return (
      <path
        d={`M ${a.x - nx * w0} ${a.y - ny * w0} L ${b.x - nx * w1} ${b.y - ny * w1} L ${b.x + nx * w1} ${b.y + ny * w1} L ${a.x + nx * w0} ${a.y + ny * w0} Z`}
        fill={color}
      />
    );
  };

  const arm = (o: { root: Pt; mid: Pt; end: Pt }, side: 1 | -1, kind: 'open' | 'point') => {
    const elbow = lerpPt(o.root, o.mid, 0.56);
    const ang = (Math.atan2(o.end.x - o.mid.x, o.end.y - o.mid.y) * 180) / Math.PI;
    const aw = L.armW ?? 1;
    return (
      <g>
        {capsule(o.root, o.mid, 30 * aw, L.arm ?? L.skin)}
        {limbLight(o.root, o.mid, 30 * aw, shade(L.arm ?? L.skin, -42))}
        {/* the forearm narrows to the wrist: a hand drawn on top then meets a wrist, not a fat stump */}
        {taperLimb(o.mid, o.end, 13 * aw, 8 * aw, L.arm ?? L.skin)}
        {limbLight(o.mid, o.end, 21 * aw, shade(L.arm ?? L.skin, -42))}
        {/* the short sleeve: the tee's colour over the top half of the upper arm, with a stitched hem */}
        <circle cx={o.root.x} cy={o.root.y} r={sleeveR} fill={L.jacket} />
        {capsule(o.root, elbow, sleeveR * 2, L.jacket)}
        <path
          d={`M ${elbow.x - 15} ${elbow.y - 7} Q ${elbow.x} ${elbow.y + 6} ${elbow.x + 15} ${elbow.y - 7}`}
          stroke={L.jacketShade}
          strokeWidth={4}
          fill="none"
          opacity={0.55}
        />
        {/* the hand: a soft mitten, the thumb toward the body. A shot that draws its own hand on the
            rim passes hands={false}, so the mitten never bulges out around it */}
        {hands ? (
          <g transform={`translate(${o.end.x} ${o.end.y}) rotate(${-ang})`}>
            <ellipse cx={0} cy={13} rx={13.5} ry={17} fill={L.hand} />
            <ellipse cx={side * 12} cy={8} rx={6} ry={9} transform={`rotate(${side * -26} ${side * 12} 8)`} fill={L.hand} />
            {kind === 'point' ? <rect x={-4} y={12} width={8} height={22} rx={4} fill={L.hand} /> : null}
            <path d="M -5 20 Q 0 24 5 20" stroke={shade(L.hand, -22)} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.7} />
          </g>
        ) : null}
      </g>
    );
  };

  const leg = (o: { root: Pt; mid: Pt; end: Pt }) => (
    <g>
      {capsule(o.root, o.mid, 34, L.leg ?? L.limb)}
      {limbLight(o.root, o.mid, 34, shade(L.leg ?? L.limb, -34))}
      {capsule(o.mid, o.end, 26, L.leg ?? L.limb)}
      {limbLight(o.mid, o.end, 26, shade(L.leg ?? L.limb, -34))}
      {/* a soft crease down the outside, so the denim reads as cloth and not a pipe */}
      <path
        d={`M ${o.root.x + 12} ${o.root.y - 4} Q ${o.mid.x + 9} ${o.mid.y} ${o.end.x + 6} ${o.end.y - 12}`}
        stroke={shade(L.leg ?? L.limb, -18)}
        strokeWidth={2.4}
        fill="none"
        opacity={0.5}
        strokeLinecap="round"
      />
      <g transform={`translate(${o.end.x + pose.facing * 8} ${o.end.y})`}>
        <path d="M -17 -5 Q -22 12 -6 15 L 25 13 Q 35 8 29 -3 Q 17 -11 0 -9 Z" fill={L.shoe} />
        <path d="M -16 9 Q 4 15 27 9" stroke={shade(L.shoe, -30)} strokeWidth={3} fill="none" opacity={0.65} strokeLinecap="round" />
      </g>
    </g>
  );

  const kw = turnWidth(pose.yaw);
  const torso = (
    <g transform={`rotate(${pose.tilt}) translate(${pose.yaw * 6} 0) scale(${kw} 1)`}>
      {/* neck first, so the collar covers its base and the chin casts a shadow on it */}
      <path d="M -18 -128 L 18 -128 L 20 -90 L -20 -90 Z" fill={L.skin} />
      <path d="M 6 -126 L 18 -126 L 20 -90 L 6 -90 Z" fill={L.skinShade} opacity={0.55} />
      <path d="M -18 -126 L -8 -126 L -8 -90 L -20 -90 Z" fill={L.skinShade} opacity={0.3} />
      {/* the chin's shadow lands on the neck before the collar covers its base */}
      <ellipse cx={0} cy={-120} rx={24} ry={12} fill="#1B0F0A" opacity={0.22 * shadeAmt} />
      <path d={torsoPath} fill={L.jacket} />
      {/* one light: soft pool on the lit side, soft shade on the far side, rim on the lit edge */}
      <g clipPath={`url(#${gid}-torso)`}>
        <rect x={-80} y={-115} width={160} height={150} fill={`url(#${gid}-shade)`} />
        <rect x={-80} y={-115} width={160} height={150} fill={`url(#${gid}-warm)`} />
        <path d={torsoPath} fill="none" stroke={`url(#${gid}-rim)`} strokeWidth={5} opacity={0.78} />
      </g>
      {L.extra === 'slick' ? (
        <g>
          {/* a pale shirt in the V and a dark tie: the night-passenger's coat */}
          <path d="M -30 -104 L 0 -56 L 30 -104 Z" fill="#DAD6CA" />
          <path d="M -8 -102 L 8 -102 L 9 -90 L 4 -62 L 0 -56 L -4 -62 L -9 -90 Z" fill={L.accent} />
          <path d="M -74 -102 L -30 -104 L 0 -56 L -16 -50 Z" fill={L.jacketShade} />
          <path d="M 74 -102 L 30 -104 L 0 -56 L 16 -50 Z" fill={L.jacketShade} />
          <path d="M -30 -104 L 0 -56 L 30 -104" stroke={ink} strokeWidth={3} fill="none" opacity={0.45} />
        </g>
      ) : (
        <g>
          {/* a crew neck and a hem, the two lines that make a tee read as a tee */}
          <path d="M -21 -108 Q 0 -88 21 -108" stroke={L.jacketShade} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M -56 17 Q 0 27 56 17" stroke={L.jacketShade} strokeWidth={4} fill="none" opacity={0.7} strokeLinecap="round" />
        </g>
      )}
    </g>
  );

  const hairMessy = (
    <g transform={`translate(${-pose.yaw * 14} 0)`}>
      <path
        d="M -67 -196 C -73 -236 -42 -260 0 -262 C 42 -260 73 -236 67 -196
           Q 58 -210 50 -198 Q 40 -218 28 -202 Q 12 -222 -2 -206 Q -18 -220 -30 -204 Q -44 -212 -56 -198 Z"
        fill={L.hair}
        stroke={`url(#${gid}-rim)`}
        strokeWidth={3.5}
        opacity={0.55}
      />
      {/* the fringe crosses the forehead from the part; no outline, so the mass stays one shape */}
      {/* two short tufts leave the silhouette; the reference's hair is messy, not a crown */}
      <path d="M -28 -256 Q -32 -265 -23 -268 Q -25 -261 -21 -256 Z" fill={L.hair} />
      <path d="M -6 -258 Q -2 -264 6 -265 Q 2 -260 2 -256 Z" fill={L.hair} />
      {/* short locks in front of the ears: they stop above the cheekbone, never below it */}
      <path d="M -58 -204 L -53 -204 L -54 -188 Q -59 -185 -62 -190 Z" fill={L.hair} />
      <path d="M 58 -204 L 53 -204 L 54 -188 Q 59 -185 62 -190 Z" fill={L.hair} />
    </g>
  );

  const hairSlick = (
    <g transform={`translate(${-pose.yaw * 12} 0)`}>
      {/* a high, side-swept hairline: lower on the parting side, higher at the far temple */}
      <path
        d="M -54 -206 C -56 -244 -34 -254 0 -254 C 34 -254 56 -244 54 -206
           C 48 -220 30 -224 6 -224 C -18 -224 -38 -232 -54 -206 Z"
        fill={L.hair}
        stroke={`url(#${gid}-rim)`}
        strokeWidth={3.5}
        opacity={0.55}
      />
      {/* the side parting and a thin sweep, not a widow's peak */}
      <path d="M -16 -248 Q -12 -238 -10 -226" stroke={shade(L.hair, -30)} strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.6} />
      <path d="M -38 -240 Q -26 -236 -16 -230 Q -28 -234 -38 -232 Z" fill={shade(L.hair, 8)} opacity={0.65} />
      <path d="M -54 -204 L -50 -204 L -51 -186 Q -56 -183 -59 -188 Z" fill={L.hair} opacity={0.9} />
      <path d="M 54 -204 L 50 -204 L 51 -186 Q 56 -183 59 -188 Z" fill={L.hair} opacity={0.9} />
    </g>
  );

  const hair =
    L.extra === 'messy' ? hairMessy : L.extra === 'slick' ? hairSlick : (
      <path
        d={`M ${-rx * 0.9} ${HEAD.y - 22} Q ${-rx * 0.94} ${HEAD.y - 62} 0 ${HEAD.y - 66} Q ${rx * 0.94} ${HEAD.y - 62} ${rx * 0.9} ${HEAD.y - 22} Q 0 ${HEAD.y - 44} ${-rx * 0.9} ${HEAD.y - 22} Z`}
        fill={L.hair}
        stroke={`url(#${gid}-rim)`}
        strokeWidth={3.5}
        opacity={0.55}
      />
    );

  const ay = Math.min(1, Math.abs(pose.yaw));
  const farHidden = ay > 0.72;
  const farSide = pose.yaw > 0 ? -1 : 1;
  const lid = pose.expr === 'smug' || pose.expr === 'cool' ? 0.45 : pose.expr === 'tired' ? 0.58 : 0;
  const open = Math.max(0.08, 1 - Math.max(pose.blink, lid));
  const ex = pose.look * 6;

  const eye = (cx: number) => {
    if (farHidden && Math.sign(cx) === farSide) return null;
    if (open < 0.18) {
      return (
        <path
          d={`M ${cx - eyeRX} ${eyeY} Q ${cx} ${eyeY + 6} ${cx + eyeRX} ${eyeY}`}
          stroke={ink}
          strokeWidth={3.6}
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    return (
      <g>
        <ellipse cx={cx} cy={eyeY} rx={eyeRX} ry={eyeRY * open} fill="#F8F2E7" />
        <ellipse cx={cx} cy={eyeY + 2} rx={irisR} ry={irisR * 1.04} fill={long ? '#33313A' : '#4A2E22'} />
        <circle cx={cx} cy={eyeY + 2.4} r={irisR * 0.5} fill="#171210" />
        <circle cx={cx + irisR * 0.38} cy={eyeY - irisR * 0.34} r={long ? 2.2 : 2.9} fill="#FFFFFF" opacity={0.92} />
        <path
          d={`M ${cx - eyeRX} ${eyeY - 4} Q ${cx} ${eyeY - eyeRY - 4} ${cx + eyeRX} ${eyeY - 4}`}
          stroke={ink}
          strokeWidth={2.8}
          fill="none"
          opacity={0.65}
          strokeLinecap="round"
        />
      </g>
    );
  };

  const brow = (cx: number) => {
    const inner = cx + (cx < 0 ? 11 : -11);
    const outer = cx + (cx < 0 ? -12 : 12);
    let yi = eyeY - 28;
    let yo = eyeY - 23;
    if (pose.expr === 'worried') {
      yi = eyeY - 34;
      yo = eyeY - 20;
    } else if (pose.expr === 'angry') {
      yi = eyeY - 20;
      yo = eyeY - 30;
    } else if (pose.expr === 'shock' || pose.expr === 'oops') {
      yi = eyeY - 37;
      yo = eyeY - 31;
    } else if (pose.expr === 'tired') {
      yi = eyeY - 26;
      yo = eyeY - 23;
    }
    return (
      <path
        d={L.browStraight ? `M ${outer} ${yo} L ${inner} ${yi}` : `M ${outer} ${yo} Q ${cx} ${(yi + yo) / 2 - 3} ${inner} ${yi}`}
        stroke={shade(L.hair, -24)}
        strokeWidth={long ? 5 : 7.5}
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  const mouth = () => {
    const w = long ? 9 : 12;
    const s = { stroke: ink, strokeWidth: long ? 3.2 : 4, fill: 'none' as const, strokeLinecap: 'round' as const };
    switch (pose.expr) {
      case 'happy':
        return <path d={`M ${-w} ${mY - 2} Q 0 ${mY + 12} ${w} ${mY - 2}`} {...s} />;
      case 'worried':
        return <path d={`M ${-w} ${mY} Q ${-w / 2} ${mY - 6} 0 ${mY - 1} Q ${w / 2} ${mY + 5} ${w} ${mY - 2}`} {...s} />;
      case 'angry':
        return <path d={`M ${-w} ${mY + 3} Q 0 ${mY - 3} ${w} ${mY + 3}`} {...s} />;
      case 'shock':
        return <ellipse cx={0} cy={mY + 2} rx={7} ry={9} fill={ink} />;
      case 'tired':
        return <path d={`M ${-w * 0.8} ${mY + 2} Q 0 ${mY} ${w * 0.8} ${mY + 2}`} {...s} />;
      case 'smug':
      case 'cool':
        return <path d={`M ${-w} ${mY + 2} Q 2 ${mY + 7} ${w + 3} ${mY - 5}`} {...s} />;
      case 'oops':
        return <ellipse cx={0} cy={mY + 2} rx={6} ry={7} fill={ink} />;
      default:
        return <path d={`M ${-w * 0.85} ${mY + 1} Q 0 ${mY - 4} ${w * 0.85} ${mY + 1}`} {...s} />;
    }
  };

  const face = (
    <g transform={`translate(${pose.yaw * 20} 0) scale(${1 - 0.22 * ay} 1)`}>
      {eye(-eyeCX + ex)}
      {eye(eyeCX + ex)}
      {brow(-eyeCX + ex)}
      {brow(eyeCX + ex)}
      {pose.expr === 'angry' ? (
        <path
          d={`M -4 ${eyeY - 42} L 0 ${eyeY - 31} L 4 ${eyeY - 42}`}
          stroke={ink}
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
          opacity={0.7}
        />
      ) : null}
      {/* nose: a shade, not a line drawing */}
      {long ? (
        <g stroke={L.skinShade} fill="none" strokeLinecap="round">
          <path d={`M 0 ${HEAD.y - 8} Q 4 ${HEAD.y + 14} 1 ${HEAD.y + 24}`} strokeWidth={3} opacity={0.55} />
          <path d={`M -6 ${HEAD.y + 25} Q 2 ${HEAD.y + 31} 8 ${HEAD.y + 23}`} strokeWidth={3.4} />
        </g>
      ) : (
        <path
          d={`M 0 ${HEAD.y + 8} Q 4 ${HEAD.y + 16} -3 ${HEAD.y + 18}`}
          stroke={L.skinShade}
          strokeWidth={3.2}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {long ? (
        <g stroke={L.skinShade} strokeWidth={2} fill="none" opacity={0.38} strokeLinecap="round">
          <path d={`M -15 ${HEAD.y + 24} Q -20 ${HEAD.y + 36} -15 ${HEAD.y + 46}`} />
          <path d={`M 15 ${HEAD.y + 24} Q 20 ${HEAD.y + 36} 15 ${HEAD.y + 46}`} />
        </g>
      ) : null}
      {mouth()}
      {long ? <path d={`M -7 ${mY + 16} Q 0 ${mY + 19} 7 ${mY + 16}`} stroke={L.skinShade} strokeWidth={2.2} fill="none" opacity={0.4} strokeLinecap="round" /> : null}
      {pose.glint && pose.glint > 0.01 && pose.blink < 0.95 ? (
        <g opacity={Math.min(1, pose.glint)}>
          {[-eyeCX, eyeCX].map((cx) =>
            farHidden && Math.sign(cx) === farSide ? null : (
              <g key={`g${cx}`}>
                <circle cx={cx + ex} cy={eyeY} r={18} fill={pose.glintColor ?? '#8FF0FF'} opacity={0.22} />
                <circle cx={cx + ex} cy={eyeY} r={irisR + 2} fill={pose.glintColor ?? '#8FF0FF'} opacity={0.7} />
              </g>
            ),
          )}
        </g>
      ) : null}
    </g>
  );

  const lensW = long ? 32 : 46;
  const lensH = long ? 26 : 40;
  const glasses = pose.glasses > 0.01 && L.glassesStyle === 'clear' ? (
    <g opacity={pose.glasses} transform={`translate(0 ${(1 - pose.glasses) * -50}) translate(${pose.yaw * 20} 0) scale(${1 - 0.22 * ay} 1)`}>
      {[-eyeCX, eyeCX].map((cx) => (
        <rect
          key={`lens${cx}`}
          x={cx - lensW / 2}
          y={eyeY - lensH / 2 - 1}
          width={lensW}
          height={lensH}
          rx={long ? 6 : 10}
          fill="#BFD9FF"
          fillOpacity={0.11}
          stroke="#1B2230"
          strokeWidth={long ? 2.8 : 3.6}
        />
      ))}
      <path d={`M ${-eyeCX + lensW / 2} ${eyeY - 4} L ${eyeCX - lensW / 2} ${eyeY - 4}`} stroke="#1B2230" strokeWidth={3.2} strokeLinecap="round" />
      <path
        d={`M ${-eyeCX - lensW / 2} ${eyeY - 8} L ${-rx + 4} ${eyeY - 12} M ${eyeCX + lensW / 2} ${eyeY - 8} L ${rx - 4} ${eyeY - 12}`}
        stroke="#1B2230"
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <path d={`M ${-eyeCX - 11} ${eyeY - 8} L ${-eyeCX - 1} ${eyeY + 7} M ${eyeCX - 11} ${eyeY - 8} L ${eyeCX - 1} ${eyeY + 7}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.2} />
    </g>
  ) : null;

  const head = (
    <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt} 0 ${HEAD.y + 40})`}>
      <g transform={`translate(0 ${HEAD.y}) scale(${rx / 64} ${ry / 64}) translate(0 ${-HEAD.y})`}>
        {/* ears sit under the hair, one on each side */}
        <ellipse cx={-rx + 3} cy={HEAD.y + 8} rx={7} ry={11} fill={L.skin} />
        <ellipse cx={rx - 3} cy={HEAD.y + 8} rx={7} ry={11} fill={L.skin} />
        <path d={`M ${-rx + 6} ${HEAD.y + 4} Q ${-rx + 2} ${HEAD.y + 9} ${-rx + 6} ${HEAD.y + 14}`} stroke={L.skinShade} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <path d={`M ${rx - 6} ${HEAD.y + 4} Q ${rx - 2} ${HEAD.y + 9} ${rx - 6} ${HEAD.y + 14}`} stroke={L.skinShade} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <path d={headPath} fill={L.skin} />
        {/* one light on the face: warm pool on the lit cheek, soft shade on the far cheek,
            and a rim that follows the lit edge of the skull */}
        <g clipPath={`url(#${gid}-head)`}>
          <rect x={-rx - 4} y={HEAD.y - ry - 4} width={rx * 2 + 8} height={ry * 2 + 8} fill={`url(#${gid}-shade)`} />
          <rect x={-rx - 4} y={HEAD.y - ry - 4} width={rx * 2 + 8} height={ry * 2 + 8} fill={`url(#${gid}-warm)`} />
          <path d={headPath} fill="none" stroke={`url(#${gid}-rim)`} strokeWidth={7} />
        </g>
      </g>
      {face}
      {hair}
      {glasses}
    </g>
  );

  return (
    <g>
      {lightDefs}
      {shadow > 0 ? (
        <ellipse cx={pose.x} cy={pose.y + FLAT_LEG_LEN * pose.scale + 12} rx={78 * pose.scale} ry={13 * pose.scale} fill="#000" opacity={0.26 * shadow} />
      ) : null}
      <g transform={`translate(${pose.x} ${pose.y}) scale(${pose.scale}) rotate(${pose.spin} 0 -90)`} filter={rimId ? `url(#${rimId})` : undefined}>
        <g transform={`translate(0 ${FLAT_LEG_LEN}) scale(${1 + 0.6 * pose.squash} ${1 - pose.squash}) translate(0 ${-FLAT_LEG_LEN})`}>
          {/* the waistband ties the two legs together under the tee */}
          <path d="M -42 -10 Q 0 -16 42 -10 L 40 24 Q 0 32 -40 24 Z" fill={L.leg ?? L.limb} />
          {/* both legs first, so the tee hem covers the top of the thighs */}
          {pose.yaw < 0 ? (
            <>
              {leg(j.legR)}
              {leg(j.legL)}
              {arm(j.armR, -1, pose.handR)}
              {torso}
              {arm(j.armL, 1, pose.handL)}
            </>
          ) : (
            <>
              {leg(j.legL)}
              {leg(j.legR)}
              {arm(j.armL, 1, pose.handL)}
              {torso}
              {arm(j.armR, -1, pose.handR)}
            </>
          )}
          {head}
        </g>
      </g>
    </g>
  );
};
