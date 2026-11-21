import React from 'react';
import { lerp, easeInOut } from './anim';

// The cast, drawn entirely in code: one rig, and a costume (a Look) per character. Every character is built
// once here, so they look identical in every shot: that's the "drawn, not guessed" point. Original
// characters only: never a channel's own hero or anything that resembles a famous cartoon character.

export const C = {
  skin: '#F6EFE3',
  skinShade: '#E2D3BE',
  ink: '#1D2033',
  jacket: '#F2B33D',
  jacketShade: '#D4922A',
  shoe: '#2FB7A6',
  orange: '#FF8A3D',
  limb: '#EFE2CC',
};

/** A costume for the rig: the same body and animation, different colours and one optional extra piece. */
export type Look = {
  skin: string;
  skinShade: string;
  hand: string;
  jacket: string;
  jacketShade: string;
  accent: string;
  limb: string;
  line: string;
  shoe: string;
  face: string;
  hair: string;
  /** Arms and legs can carry their own colour: a tee has bare arms above denim legs. Default: `limb`. */
  arm?: string;
  leg?: string;
  /** 0..1 of the upper arm covered by a short sleeve in the jacket colour (a tee, not a jacket). */
  sleeve?: number;
  /** 'round' = a white eyeball with a dark pupil (the flat-vector reference look); default = the rig's dot eye. */
  eyes?: 'dot' | 'round';
  /** 'clear' = thin wire frames (a real pair of glasses); default = the rig's dark shades. */
  glassesStyle?: 'shade' | 'clear';
  /** 0..1: plain brows for the expressions that would otherwise have none (neutral, happy). */
  brow?: number;
  /** true = brows are a dead straight line (the tired night driver). */
  browStraight?: boolean;
  /** arm length multiplier (1 = the rig's default cartoon arm). A human driver needs ~1.3. */
  armLen?: number;
  /** arm thickness multiplier (1 = the rig's default cartoon arm). 0.85 = a lean adult forearm. */
  armW?: number;
  /** 1 = the character's own eyes have gone white/cloudy (the pupil rolls up under the lid). */
  whiteEyes?: number;
  extra?: 'hood' | 'hoodBun' | 'curls' | 'bunches' | 'bob' | 'suit' | 'cap' | 'long' | 'pony' | 'short' | 'messy' | 'slick';
  beard?: boolean;
  /** flat body only: head radius and a longer, narrower face (the older passenger in the second reference). */
  headR?: number;
  longFace?: boolean;
  /** true = the right hand is gone: the right arm stops at the wrist with the red print on it, and no
   *  mitten is drawn, so the hand that wrote the fourth rule is never accidentally given back. */
  noHandR?: boolean;
};
export type CastName = 'pip' | 'pipHood' | 'pipInk' | 'mo' | 'sis' | 'mom' | 'suit' | 'minh' | 'lan' | 'bao' | 'minhY' | 'linh' | 'zWalker' | 'zRunner' | 'zBloater' | 'zClicker' | 'zTank';
export const LOOKS: Record<CastName, Look> = {
  // A: Pip as built
  pip: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: C.jacket, jacketShade: C.jacketShade, accent: C.jacketShade, limb: C.limb, line: C.ink, shoe: C.shoe, face: C.ink, hair: C.ink },
  // B: Pip in a dark hoodie with mustard drawstrings: the body goes dark and catches the rim light, the head stays the brightest thing
  pipHood: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#2E2B3D', jacketShade: '#24212F', accent: C.jacket, limb: '#2E2B3D', line: '#121019', shoe: C.shoe, face: C.ink, hair: C.ink, extra: 'hood' },
  // C: a dark head with light features, the genre's high-contrast convention, in Pip's mustard
  pipInk: { skin: '#26232F', skinShade: '#1C1A24', hand: '#26232F', jacket: C.jacket, jacketShade: C.jacketShade, accent: C.jacketShade, limb: '#26232F', line: '#121019', shoe: C.shoe, face: '#F6EFE3', hair: '#26232F' },
  // Mo, Pip's friend: a second recurring character with his own costume (curly hair, headphones round his neck)
  mo: { skin: '#C98E68', skinShade: '#B07A58', hand: '#C98E68', jacket: '#5E6E46', jacketShade: '#4C5A38', accent: '#E9C46A', limb: '#3A3446', line: '#1A1622', shoe: '#D9534F', face: C.ink, hair: '#2A1C18', extra: 'curls' },
  // the formula's recurring cast (beats 5 and 6): Pip's little sister (draw her at about 0.7 of Pip's scale), his mum,
  // and the man in a suit who notices the power. All three are ours: plain shapes, no famous silhouettes.
  sis: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#3E8C86', jacketShade: '#2F6E69', accent: '#F28C6A', limb: '#3A3446', line: '#14121C', shoe: '#F28C6A', face: C.ink, hair: '#3A2620', extra: 'bunches' },
  mom: { skin: C.skin, skinShade: C.skinShade, hand: C.skin, jacket: '#8A5A6A', jacketShade: '#704858', accent: '#E9C46A', limb: '#3A3446', line: '#14121C', shoe: '#5A4A6A', face: C.ink, hair: '#5A3226', extra: 'bob' },
  suit: { skin: '#D9C6AE', skinShade: '#C2AE96', hand: '#D9C6AE', jacket: '#2B2F3A', jacketShade: '#20232C', accent: '#A8323E', limb: '#2B2F3A', line: '#0E0F14', shoe: '#14151A', face: C.ink, hair: '#17141A', extra: 'suit' },
  // Loa Camera's chalkboard cast: dark heads with white features, chalk-white limbs, dark clothes outlined in
  // chalk — the night-shift look of the series. Minh: guard cap with a red badge. Lan: long chalk-white hair,
  // a red name-tag. Chú Bảo: grey chalk hair, white shirt and red tie.
  minh: { skin: '#1E1E22', skinShade: '#17171B', hand: '#1E1E22', jacket: '#18181C', jacketShade: '#131316', accent: '#FF3B30', limb: '#F2EFE9', line: '#EDEAE2', shoe: '#2A2A2E', face: '#F2EFE9', hair: '#1E1E22', extra: 'cap' },
  lan: { skin: '#1E1E22', skinShade: '#17171B', hand: '#1E1E22', jacket: '#1B1B1F', jacketShade: '#141418', accent: '#FF3B30', limb: '#F2EFE9', line: '#EDEAE2', shoe: '#2A2A2E', face: '#F2EFE9', hair: '#F2EFE9', extra: 'long' },
  bao: { skin: '#1E1E22', skinShade: '#17171B', hand: '#1E1E22', jacket: '#1B1B1F', jacketShade: '#141418', accent: '#FF3B30', limb: '#F2EFE9', line: '#EDEAE2', shoe: '#1A1A1E', face: '#F2EFE9', hair: '#4A4A50', extra: 'suit' },
  // Young sibling survivors: simple clothes, normal kid proportions.
  minhY: { skin: '#F6EFE3', skinShade: '#E2D3BE', hand: '#F6EFE3', jacket: '#6B8A9A', jacketShade: '#5A7A8A', accent: '#E9C46A', limb: '#3A3446', line: '#1A1622', shoe: '#4A6A7A', face: C.ink, hair: '#3A2620', extra: 'short' },
  linh: { skin: '#F6EFE3', skinShade: '#E2D3BE', hand: '#F6EFE3', jacket: '#3A3A4A', jacketShade: '#2A2A3A', accent: '#E9C46A', limb: '#3A3A4A', line: '#141418', shoe: '#2A2A2E', face: C.ink, hair: '#3A2620', extra: 'hoodBun' },
  // Zombies: sickly skin, hollow (dark) eyes with pale features, tattered dark clothes, blood accent.
  zWalker: { skin: '#8a9a7a', skinShade: '#6a7a5a', hand: '#8a9a7a', jacket: '#3a4a3a', jacketShade: '#2a3a2a', accent: '#7e1414', limb: '#3a4a3a', line: '#1a2a1a', shoe: '#2a2a2a', face: '#e8e8e0', hair: '#2a3a2a', extra: 'hood' },
  zRunner: { skin: '#9a8a7a', skinShade: '#7a6a5a', hand: '#9a8a7a', jacket: '#4a3a2a', jacketShade: '#3a2a1a', accent: '#7e1414', limb: '#4a3a2a', line: '#1a1a14', shoe: '#2a2a2a', face: '#e8e8e0', hair: '#3a2a1a', extra: 'long' },
  zBloater: { skin: '#a8b890', skinShade: '#889870', hand: '#a8b890', jacket: '#5a6a4a', jacketShade: '#4a5a3a', accent: '#7e1414', limb: '#5a6a4a', line: '#2a3a2a', shoe: '#3a3a3a', face: '#e8e8e0', hair: '#4a5a3a', extra: 'hood' },
  zClicker: { skin: '#b8c0a8', skinShade: '#98a088', hand: '#b8c0a8', jacket: '#4a5a4a', jacketShade: '#3a4a3a', accent: '#7e1414', limb: '#4a5a4a', line: '#2a3a2a', shoe: '#3a3a3a', face: '#e8e8e0', hair: '#3a4a3a', extra: 'long' },
  zTank: { skin: '#7a8a5a', skinShade: '#5a6a3a', hand: '#7a8a5a', jacket: '#3a4a3a', jacketShade: '#2a3a2a', accent: '#7e1414', limb: '#3a4a3a', line: '#1a2a1a', shoe: '#2a2a2a', face: '#e8e8e0', hair: '#2a3a2a', extra: 'suit' },
};

// ---------- the hero ----------
/** Mitten hands: open (a palm and a thumb) or pointing (a fist with the index finger out). */
export type HandKind = 'open' | 'point';
export type Expr = 'neutral' | 'happy' | 'smug' | 'shock' | 'worried' | 'angry' | 'oops' | 'cool' | 'dizzy' | 'tired' | 'zombie';
export type Limb = { a: number; b: number }; // a: upper segment angle, b: bend of the lower segment (degrees)
export type Pose = {
  x: number;
  y: number; // hip point
  scale: number;
  facing: 1 | -1;
  tilt: number; // torso lean around the hips, degrees, + leans screen-right
  spin: number; // whole-body rotation around the chest (tumbles)
  headTilt: number;
  armL: Limb;
  armR: Limb;
  legL: Limb;
  legR: Limb;
  expr: Expr;
  blink: number; // 0 open, 1 shut
  look: number; // -1..1 eye offset
  glasses: number; // 0..1
  yaw: number; // -1 profile facing screen-left, 0 front, 1 profile facing screen-right
  squash: number; // + squashes (landing), - stretches (jump), about the feet
  handL: HandKind;
  handR: HandKind;
  sway: number; // secondary motion: how far loose things (the hood's drawstrings) swing, degrees-ish
  glint?: number; // 0..1 the eyes light up in the power's colour (set it after poseAt: it isn't interpolated)
  glintColor?: string;
};

export const basePose: Pose = {
  x: 960,
  y: 700,
  scale: 1,
  facing: 1,
  tilt: 0,
  spin: 0,
  headTilt: 0,
  armL: { a: 10, b: -8 },
  armR: { a: 10, b: -8 },
  legL: { a: 5, b: 0 },
  legR: { a: -5, b: 0 },
  expr: 'neutral',
  blink: 0,
  look: 0,
  glasses: 0,
  yaw: 0,
  squash: 0,
  handL: 'open',
  handR: 'open',
  sway: 0,
};

type Key = { f: number; p: Partial<Pose>; ease?: (t: number) => number };

const mixLimb = (a: Limb, b: Limb, t: number): Limb => ({ a: lerp(a.a, b.a, t), b: lerp(a.b, b.b, t) });

/** Interpolates every numeric part of a pose between keys; the face swaps (never morphs) at its key. */
export const poseAt = (f: number, keys: Key[], from: Pose = basePose): Pose => {
  // resolve each key into a full pose, carrying values forward
  const full: { f: number; p: Pose; ease?: (t: number) => number }[] = [];
  let cur = from;
  for (const k of keys) {
    cur = { ...cur, ...k.p };
    full.push({ f: k.f, p: cur, ease: k.ease });
  }
  if (f <= full[0].f) return full[0].p;
  for (let i = 0; i < full.length - 1; i++) {
    const A = full[i];
    const B = full[i + 1];
    if (f <= B.f) {
      const t = (B.ease ?? easeInOut)((f - A.f) / Math.max(1e-6, B.f - A.f));
      return {
        x: lerp(A.p.x, B.p.x, t),
        y: lerp(A.p.y, B.p.y, t),
        scale: lerp(A.p.scale, B.p.scale, t),
        facing: t < 0.5 ? A.p.facing : B.p.facing,
        tilt: lerp(A.p.tilt, B.p.tilt, t),
        spin: lerp(A.p.spin, B.p.spin, t),
        headTilt: lerp(A.p.headTilt, B.p.headTilt, t),
        armL: mixLimb(A.p.armL, B.p.armL, t),
        armR: mixLimb(A.p.armR, B.p.armR, t),
        legL: mixLimb(A.p.legL, B.p.legL, t),
        legR: mixLimb(A.p.legR, B.p.legR, t),
        expr: A.p.expr, // a face swaps when its own key lands, so hold the earlier one
        handL: A.p.handL,
        handR: A.p.handR,
        blink: lerp(A.p.blink, B.p.blink, t),
        look: lerp(A.p.look, B.p.look, t),
        glasses: lerp(A.p.glasses, B.p.glasses, t),
        yaw: lerp(A.p.yaw, B.p.yaw, t),
        squash: lerp(A.p.squash, B.p.squash, t),
        sway: lerp(A.p.sway, B.p.sway, t),
      };
    }
  }
  return full[full.length - 1].p;
};

// body measurements (local space: hips at 0,0, y down)
const UPPER_ARM = 62;
const FORE_ARM = 58;
const THIGH = 72;
const SHIN = 68;
const SHOULDER = { x: 42, y: -108 };
const HIP = { x: 17, y: 0 };
export const HEAD = { x: 0, y: -176, r: 62 };
export const LEG_LEN = THIGH + SHIN;

const rad = (d: number) => (d * Math.PI) / 180;
type P = { x: number; y: number };
const rot = (p: P, deg: number, c: P = { x: 0, y: 0 }): P => {
  const r = rad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r) };
};

/** Joint positions in local space (before the hip translate/scale), so scenes can attach props to hands. */
export const joints = (pose: Pose) => {
  const side = (s: 1 | -1, limb: Limb, root: P, l1: number, l2: number, isLeg: boolean) => {
    // arms swing outward (away from the body) on their own side; legs swing forward in the facing direction
    const dir = isLeg ? pose.facing : s;
    const d1 = { x: dir * Math.sin(rad(limb.a)), y: Math.cos(rad(limb.a)) };
    const mid = { x: root.x + d1.x * l1, y: root.y + d1.y * l1 };
    const a2 = limb.a + limb.b;
    const d2 = { x: dir * Math.sin(rad(a2)), y: Math.cos(rad(a2)) };
    return { root, mid, end: { x: mid.x + d2.x * l2, y: mid.y + d2.y * l2 } };
  };
  const torsoRot = (p: P) => rot(p, pose.tilt);
  const sp = limbSpread(pose.yaw);
  const shL = { x: -SHOULDER.x * sp + pose.yaw * 6, y: SHOULDER.y };
  const shR = { x: SHOULDER.x * sp + pose.yaw * 6, y: SHOULDER.y };
  const armL = side(-1, pose.armL, shL, UPPER_ARM, FORE_ARM, false);
  const armR = side(1, pose.armR, shR, UPPER_ARM, FORE_ARM, false);
  const legL = side(-1, pose.legL, { x: -HIP.x * sp, y: 0 }, THIGH, SHIN, true);
  const legR = side(1, pose.legR, { x: HIP.x * sp, y: 0 }, THIGH, SHIN, true);
  const r = (o: { root: P; mid: P; end: P }) => ({ root: torsoRot(o.root), mid: torsoRot(o.mid), end: torsoRot(o.end) });
  return { armL: r(armL), armR: r(armR), legL, legR, head: torsoRot(HEAD) };
};

/** How wide the body reads as it turns: full width face-on, about 60% in profile. */
export const turnWidth = (yaw: number) => 1 - 0.4 * Math.min(1, Math.abs(yaw));
/** Shoulders and hips close up as he turns, so in profile the limbs overlap the body. */
export const limbSpread = (yaw: number) => 1 - 0.85 * Math.min(1, Math.abs(yaw));

/** Face swaps happen through a blink: two frames shut either side of each change, as in the genre. */
export const faceAt = (f: number, keys: [number, Expr][]): { expr: Expr; blink: number } => {
  let expr = keys[0][1];
  let blink = 0;
  for (let i = 0; i < keys.length; i++) {
    const [k, e] = keys[i];
    if (f >= k) expr = e;
    if (i > 0 && f >= k - 2 && f < k + 1) blink = 1;
  }
  return { expr, blink };
};

/** A local point to world space, for attaching props (the mug in Pip's hand). */
export const toWorld = (pose: Pose, p: P): P => {
  const spun = rot(p, pose.spin, { x: 0, y: -90 });
  return { x: pose.x + spun.x * pose.scale, y: pose.y + spun.y * pose.scale };
};

/** Where a pose's hand is in world space, so props (a torch, a latch grip) can be attached to it. */
export const handR = (pose: Pose) => toWorld(pose, joints(pose).armR.end);
export const handL = (pose: Pose) => toWorld(pose, joints(pose).armL.end);

/** Straight-arm reach: the right arm angle (local) that points the hand at a world target. */
export const reachAngle = (pose: Pose, target: P) => {
  const sh = toWorld(pose, rot({ x: SHOULDER.x * limbSpread(pose.yaw) + pose.yaw * 6, y: SHOULDER.y }, pose.tilt));
  const world = (Math.atan2(target.x - sh.x, target.y - sh.y) * 180) / Math.PI; // 0 = straight down
  return world - pose.tilt;
};

/** Bảo's hair, back to basics: one plain grey mass drawn OVER the face, so its front edge presses
 *  right onto the brow line — the brows sit under the fringe. The closing curve's ends stay on the
 *  head circle, so nothing sticks out at the sides; the hint of hair round the back is the spare
 *  grey stroke slipped behind the scalp before it is painted. */
export const HairCut: React.FC<{ color: string; r?: number; y?: number }> = ({ color, r = HEAD.r, y = HEAD.y }) => (
  <path
    d={`M 54.3 ${y - 30} A ${r} ${r} 0 0 0 -54.3 ${y - 30} Q 0 ${y - 2} 54.3 ${y - 30} Z`}
    fill={color}
  />
);

/** The elder's white mustache + chin beard, drawn AFTER the face (over it) so the mustache rides on
 *  the upper lip like the old-man reference. It inherits the face's own turn transform, so the
 *  beard follows the mouth at every yaw — and it is clipped to the head circle, so whatever would
 *  poke past the silhouette is trimmed along the jaw instead of sticking out. Reusable on any
 *  bearded stickman; the young ones simply never mount it. */
export const Beard: React.FC<{ color: string; yaw?: number; y?: number }> = ({ color, yaw = 0, y = HEAD.y }) => (
  <g>
    <clipPath id="beardClip">
      <circle cx={0} cy={y} r={61} />
    </clipPath>
    <g clipPath="url(#beardClip)">
      <g transform={`translate(${yaw * 30} 0) scale(${1 - 0.28 * Math.abs(yaw)} 1)`} fill={color}>
        {/* the mustache, a full walrus mass drooping over the upper lip — it caps the mouth's top */}
        <path d={`M -21 ${y + 15} Q 0 ${y + 7} 21 ${y + 15} Q 17 ${y + 31} 0 ${y + 34} Q -17 ${y + 31} -21 ${y + 15} Z`} />
        {/* the chin beard under the mouth, tucked inside the jaw */}
        <path d={`M -24 ${y + 34} Q -27 ${y + 52} 0 ${y + 58} Q 27 ${y + 52} 24 ${y + 34} Q 12 ${y + 44} 0 ${y + 45} Q -12 ${y + 44} -24 ${y + 34} Z`} />
      </g>
    </g>
  </g>
);

const Face: React.FC<{ expr: Expr; blink: number; look: number; glasses: number; yaw?: number; ink?: string; glint?: number; glintColor?: string; whiteEyes?: number; eyesStyle?: 'dot' | 'round'; glassesStyle?: 'shade' | 'clear'; brow?: number }> = ({ expr, blink, look, glasses, yaw = 0, ink = C.ink, glint = 0, glintColor = '#8FF0FF', whiteEyes = 0, eyesStyle = 'dot', glassesStyle = 'shade', brow = 0 }) => {
  const ex = look * 7;
  const roundEyes = eyesStyle === 'round';
  const ay = Math.min(1, Math.abs(yaw));
  const farHidden = ay > 0.72;
  const farSide = yaw > 0 ? -1 : 1; // facing screen-right hides the screen-left eye
  const eyeY = HEAD.y - 4;
  // heavy lids: half shut when smug or cool, more than half when tired (with dark rings under the eyes)
  const lid = expr === 'smug' || expr === 'cool' ? 0.45 : expr === 'tired' ? 0.58 : 0;
  const open = Math.max(0.08, 1 - Math.max(blink, lid));
  const eye = (cx: number) => {
    if (farHidden && Math.sign(cx) === farSide) return null;
    if (expr === 'happy') return <path d={`M ${cx - 10} ${eyeY + 3} Q ${cx} ${eyeY - 9} ${cx + 10} ${eyeY + 3}`} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" />;
    if (expr === 'oops') return <path d={`M ${cx - 9} ${eyeY - 6} L ${cx + 4} ${eyeY} L ${cx - 9} ${eyeY + 6}`} transform={cx > 0 ? `translate(${2 * cx},0) scale(-1,1)` : undefined} stroke={ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    if (expr === 'dizzy') return <g stroke={ink} strokeWidth={5} strokeLinecap="round"><path d={`M ${cx - 7} ${eyeY - 7} L ${cx + 7} ${eyeY + 7} M ${cx + 7} ${eyeY - 7} L ${cx - 7} ${eyeY + 7}`} /></g>;
    // the reference look: a white eyeball with a dark pupil, not a dot. The eyeball stays put and the
    // pupil travels, so a glance still reads when the head is turned.
    if (roundEyes) {
      if (blink >= 0.95)
        return <path d={`M ${cx - 12} ${eyeY + 1} Q ${cx} ${eyeY + 8} ${cx + 12} ${eyeY + 1}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />;
      const big = expr === 'shock';
      const rx = big ? 13.5 : 11.5;
      const ry = (big ? 15 : 13) * open;
      return (
        <g>
          <ellipse cx={cx} cy={eyeY + (lid ? 2 : 0)} rx={rx} ry={ry} fill="#FFFCF4" stroke={ink} strokeWidth={3} />
          <circle cx={cx + ex * 0.7} cy={eyeY + (lid ? 2.5 : 1)} r={big ? 5.8 : 5} fill={ink} />
          <circle cx={cx + ex * 0.7 + 1.7} cy={eyeY - 1.4} r={1.7} fill="#FFFFFF" opacity={0.9} />
          {lid ? <path d={`M ${cx - rx - 1} ${eyeY - 1} Q ${cx} ${eyeY - 6} ${cx + rx + 1} ${eyeY - 1}`} stroke={ink} strokeWidth={4} strokeLinecap="round" fill="none" /> : null}
        </g>
      );
    }
    if (whiteEyes > 0.01) {
      // the character's OWN eye turns white — it keeps the rig's look/blink/yaw transform,
      // so it can never drift away from the face the way a separate overlay can
      if (blink >= 0.95)
        return <path d={`M ${cx - 12} ${eyeY + 1} Q ${cx} ${eyeY + 8} ${cx + 12} ${eyeY + 1}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />;
      const big = expr === 'shock';
      const rx = big ? 11 : 8;
      const ry = (big ? 13 : 10) * open;
      const ccy = eyeY + (lid ? 3 : 0);
      const top = ccy - ry;
      return (
        <g opacity={Math.min(1, whiteEyes)}>
          <ellipse cx={cx + ex} cy={ccy} rx={rx + 1.5} ry={ry + 1.5} fill="#D6E0EA" opacity={0.7} />
          <ellipse cx={cx + ex} cy={ccy} rx={rx} ry={ry} fill="#F7FAFD" />
          {/* pupil rolled almost all the way up: only a sliver at the upper edge */}
          <path d={`M ${cx + ex - rx * 0.72} ${top + ry * 0.3} Q ${cx + ex} ${top - ry * 0.22} ${cx + ex + rx * 0.72} ${top + ry * 0.3} Q ${cx + ex} ${top + ry * 0.1} ${cx + ex - rx * 0.72} ${top + ry * 0.3} Z`} fill={ink} opacity={0.85} />
        </g>
      );
    }
    if (expr === 'zombie') return (
      <g>
        <ellipse cx={cx + ex} cy={eyeY} rx={10} ry={12} fill={ink} />
        <circle cx={cx + ex + 2} cy={eyeY - 3} r={2.5} fill="#9a1010" />
      </g>
    );
    // shut (a blink's middle frame, or asleep): the closed lid's curve, with the tired rings kept
    if (blink >= 0.95)
      return (
        <g>
          <path d={`M ${cx - 12} ${eyeY + 1} Q ${cx} ${eyeY + 8} ${cx + 12} ${eyeY + 1}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          {expr === 'tired' ? <path d={`M ${cx - 12} ${eyeY + 15} Q ${cx} ${eyeY + 22} ${cx + 12} ${eyeY + 15}`} stroke="#8C7AA6" strokeWidth={4.5} fill="none" strokeLinecap="round" opacity={0.85} /> : null}
        </g>
      );
    const big = expr === 'shock';
    const rx = big ? 11 : 7;
    const ry = (big ? 13 : 10) * open;
    return (
      <g>
        <ellipse cx={cx + ex} cy={eyeY + (lid ? 3 : 0)} rx={rx} ry={ry} fill={ink} />
        {big && open > 0.5 ? <circle cx={cx + ex + 3.5} cy={eyeY - 4} r={3.4} fill="#fff" /> : null}
        {lid ? <path d={expr === 'tired' ? `M ${cx - 13} ${eyeY - 1} Q ${cx} ${eyeY - 5} ${cx + 13} ${eyeY - 1}` : `M ${cx - 12} ${eyeY - 4} L ${cx + 12} ${eyeY - 2}`} stroke={ink} strokeWidth={4} strokeLinecap="round" fill="none" /> : null}
        {expr === 'tired' ? <path d={`M ${cx - 12} ${eyeY + 14} Q ${cx} ${eyeY + 21} ${cx + 12} ${eyeY + 14}`} stroke="#8C7AA6" strokeWidth={4.5} fill="none" strokeLinecap="round" opacity={0.85} /> : null}
      </g>
    );
  };
  const brows: Record<Expr, string> = {
    neutral: '',
    happy: '',
    smug: `M -34 ${eyeY - 22} L -12 ${eyeY - 20} M 12 ${eyeY - 26} L 34 ${eyeY - 30}`,
    shock: `M -32 ${eyeY - 28} Q -21 ${eyeY - 36} -10 ${eyeY - 29} M 10 ${eyeY - 29} Q 21 ${eyeY - 36} 32 ${eyeY - 28}`,
    worried: `M -32 ${eyeY - 18} L -12 ${eyeY - 26} M 12 ${eyeY - 26} L 32 ${eyeY - 18}`,
    // angry: the inner ends dip toward the eyes instead of lifting — the opposite slope to worried
    angry: `M -32 ${eyeY - 30} L -12 ${eyeY - 16} M 12 ${eyeY - 16} L 32 ${eyeY - 30}`,
    oops: `M -32 ${eyeY - 20} L -12 ${eyeY - 16} M 12 ${eyeY - 16} L 32 ${eyeY - 20}`,
    cool: '',
    dizzy: '',
    tired: `M -33 ${eyeY - 17} Q -22 ${eyeY - 21} -11 ${eyeY - 19} M 11 ${eyeY - 19} Q 22 ${eyeY - 21} 33 ${eyeY - 17}`,
    zombie: '',
  };
  const mY = HEAD.y + 28;
  const mouth: Record<Expr, React.ReactNode> = {
    neutral: <path d={`M -10 ${mY} Q 0 ${mY + 4} 10 ${mY}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    happy: <path d={`M -18 ${mY - 4} Q 0 ${mY + 20} 18 ${mY - 4} Z`} fill={ink} />,
    smug: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    shock: <ellipse cx={0} cy={mY + 4} rx={10} ry={14} fill={ink} />,
    worried: <path d={`M -16 ${mY + 4} Q -8 ${mY - 4} 0 ${mY + 4} Q 8 ${mY + 12} 16 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    angry: <path d={`M -15 ${mY + 5} Q 0 ${mY - 2} 15 ${mY + 5}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    oops: <g><rect x={-18} y={mY - 6} width={36} height={16} rx={6} fill={ink} /><path d={`M -14 ${mY + 2} L 14 ${mY + 2}`} stroke="#fff" strokeWidth={3} /></g>,
    cool: <path d={`M -12 ${mY + 2} Q 4 ${mY + 8} 16 ${mY - 6}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    dizzy: <path d={`M -14 ${mY + 4} Q -7 ${mY - 4} 0 ${mY + 4} Q 7 ${mY + 12} 14 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    tired: <path d={`M -11 ${mY + 4} Q 0 ${mY} 11 ${mY + 4}`} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />,
    zombie: (
      <g>
        <path d={`M -52 ${mY + 4} L -46 ${mY - 2} L -18 ${mY - 6} L 0 ${mY - 4} L 18 ${mY - 6} L 46 ${mY - 2} L 52 ${mY + 4} L 48 ${mY + 46} L 16 ${mY + 54} L 0 ${mY + 58} L -16 ${mY + 54} L -48 ${mY + 46} Z`} fill="#0a0303" />
        <line x1={-52} y1={mY + 4} x2={-18} y2={mY - 6} stroke="#050202" strokeWidth={4} />
        <line x1={-18} y1={mY - 6} x2={0} y2={mY - 4} stroke="#050202" strokeWidth={4} />
        <line x1={0} y1={mY - 4} x2={18} y2={mY - 6} stroke="#050202" strokeWidth={4} />
        <line x1={18} y1={mY - 6} x2={52} y2={mY + 4} stroke="#050202" strokeWidth={4} />
        {[-44,-26,-8,10,28,46].map((tx, i) => (
          <line key={i} x1={tx} y1={mY + 8} x2={tx + (i % 2 ? 3 : -2)} y2={mY + 8 + (24 + (i % 3) * 6)} stroke="#d8cfc0" strokeWidth={3.5} strokeLinecap="round" />
        ))}
      </g>
    ),
  };
  return (
    <g transform={`translate(${yaw * 30} 0) scale(${1 - 0.28 * ay} 1)`}>
      {eye(-21)}
      {eye(21)}
      {brows[expr] ? (
        <path d={brows[expr]} stroke={ink} strokeWidth={5} fill="none" strokeLinecap="round" />
      ) : brow > 0.01 ? (
        // a character with permanent brows: two short flat strokes, used by the flat-vector cast
        <path
          d={`M -34 ${eyeY - 24} L -12 ${eyeY - 23} M 12 ${eyeY - 23} L 34 ${eyeY - 24}`}
          stroke={ink}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          opacity={brow}
        />
      ) : null}
      {expr === 'angry' ? <path d={`M -4 ${eyeY - 36} L 0 ${eyeY - 25} L 4 ${eyeY - 36}`} stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.75} /> : null}
      {mouth[expr]}
      {expr === 'zombie' ? (
        <g>
          <path d={`M -24 ${HEAD.y + 34} Q -28 ${HEAD.y + 60} -24 ${HEAD.y + 86}`} stroke="#1a0606" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d={`M 22 ${HEAD.y + 32} Q 26 ${HEAD.y + 58} 22 ${HEAD.y + 82}`} stroke="#1a0606" strokeWidth={3.5} fill="none" strokeLinecap="round" />
        </g>
      ) : null}
      {expr === 'shock' || expr === 'oops' ? <path d={`M 52 ${HEAD.y - 30} q 6 10 0 16 q -6 -6 0 -16 Z`} fill="#EDEAE2" /> : null}
      {/* a power lighting the eyes: a soft halo, a bright iris, a white catchlight (none while the lids are shut) */}
      {glint > 0.01 && blink < 0.95
        ? [-21, 21].map((cx) =>
            farHidden && Math.sign(cx) === farSide ? null : (
              <g key={`gl${cx}`} opacity={Math.min(1, glint)}>
                <circle cx={cx + ex} cy={eyeY} r={17} fill={glintColor} opacity={0.2} />
                <circle cx={cx + ex} cy={eyeY} r={12} fill={glintColor} opacity={0.28} />
                <ellipse cx={cx + ex} cy={eyeY + (lid ? 3 : 0)} rx={8} ry={Math.max(2, 11 * open)} fill={glintColor} />
                <circle cx={cx + ex + 2.5} cy={eyeY - 3} r={2.6} fill="#FFFFFF" />
              </g>
            ),
          )
        : null}
      {glasses > 0.01 ? (
        <g opacity={glasses} transform={`translate(0 ${(1 - glasses) * -60})`}>
          {glassesStyle === 'clear' ? (
            // real glasses: two big wire lenses with a light tint, a bridge and short temples
            <g>
              <rect x={-56} y={eyeY - 17} width={46} height={34} rx={11} fill="#BFD9FF" fillOpacity={0.13} stroke={ink} strokeWidth={4} />
              <rect x={10} y={eyeY - 17} width={46} height={34} rx={11} fill="#BFD9FF" fillOpacity={0.13} stroke={ink} strokeWidth={4} />
              <path d={`M -10 ${eyeY - 5} L 10 ${eyeY - 5}`} stroke={ink} strokeWidth={4} strokeLinecap="round" />
              <path d={`M -56 ${eyeY - 11} L -64 ${eyeY - 16} M 56 ${eyeY - 11} L 64 ${eyeY - 16}`} stroke={ink} strokeWidth={4} strokeLinecap="round" />
              <path d={`M -48 ${eyeY - 9} L -34 ${eyeY + 5} M 18 ${eyeY - 9} L 32 ${eyeY + 5}`} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.3} />
            </g>
          ) : (
            <g>
              {/* classic shades: a full bar across, two big lenses, one bright glint so it reads at feed size */}
              <path d={`M -58 ${eyeY - 12} L 58 ${eyeY - 12}`} stroke={ink} strokeWidth={6} strokeLinecap="round" />
              <path d={`M -50 ${eyeY - 14} L -6 ${eyeY - 14} L -10 ${eyeY + 8} Q -28 ${eyeY + 18} -46 ${eyeY + 8} Z`} fill="#0D0F1C" stroke={ink} strokeWidth={3} />
              <path d={`M 6 ${eyeY - 14} L 50 ${eyeY - 14} L 46 ${eyeY + 8} Q 28 ${eyeY + 18} 10 ${eyeY + 8} Z`} fill="#0D0F1C" stroke={ink} strokeWidth={3} />
              <path d={`M -40 ${eyeY + 2} L -26 ${eyeY - 10} M 16 ${eyeY + 2} L 30 ${eyeY - 10}`} stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
            </g>
          )}
        </g>
      ) : null}
    </g>
  );
};

export const Hero: React.FC<{ pose: Pose; shadow?: number; rimId?: string | null; look?: Look }> = ({ pose, shadow = 1, rimId, look = LOOKS.pipHood }) => {
  const j = joints(pose);
  const L = look;
  const armC = L.arm ?? L.limb;
  const legC = L.leg ?? L.limb;
  // limbs are light with a dark outline, so they read on the dark sets (navy limbs vanished on navy walls)
  const limb = (o: { root: P; mid: P; end: P }, w: number, color = L.limb) => {
    const d = `M ${o.root.x} ${o.root.y} L ${o.mid.x} ${o.mid.y} L ${o.end.x} ${o.end.y}`;
    return (
      <g>
        <path d={d} stroke={L.line} strokeWidth={w + 7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };
  // a short sleeve: the jacket colour stops partway down the upper arm, so a tee reads as a tee.
  // It carries no dark outline of its own, so it melts into the torso instead of floating beside it.
  const sleeve = (o: { root: P; mid: P }) => {
    const t = Math.max(0, Math.min(0.9, L.sleeve ?? 0));
    if (!t) return null;
    const ex = o.root.x + (o.mid.x - o.root.x) * t;
    const ey = o.root.y + (o.mid.y - o.root.y) * t;
    const dx = o.mid.x - o.root.x;
    const dy = o.mid.y - o.root.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return (
      <g>
        <path d={`M ${o.root.x} ${o.root.y} L ${ex} ${ey}`} stroke={L.jacket} strokeWidth={22} strokeLinecap="round" />
        <path d={`M ${ex - nx * 10} ${ey - ny * 10} L ${ex + nx * 10} ${ey + ny * 10}`} stroke={L.jacketShade} strokeWidth={4} strokeLinecap="round" opacity={0.85} />
      </g>
    );
  };
  const shoe = (o: { root: P; mid: P; end: P }) => (
    <ellipse cx={o.end.x + pose.facing * 9} cy={o.end.y + 4} rx={22} ry={11} fill={L.shoe} stroke={L.line} strokeWidth={4} />
  );
  // a mitten along the forearm: the palm, the thumb toward the body, two knuckle marks; or a pointing fist
  const hand = (o: { mid: P; end: P }, side: 1 | -1, kind: HandKind) => {
    const ang = (Math.atan2(o.end.x - o.mid.x, o.end.y - o.mid.y) * 180) / Math.PI;
    return (
      <g transform={`translate(${o.end.x} ${o.end.y}) rotate(${-ang})`}>
        {kind === 'point' ? (
          <g>
            <rect x={-4} y={10} width={8} height={24} rx={4} fill={L.hand} stroke={L.line} strokeWidth={3.5} />
            <path d="M -11 -2 Q -14 14 -6 18 L 7 18 Q 14 14 11 -2 Z" fill={L.hand} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
            <ellipse cx={side * 10} cy={6} rx={4.5} ry={7} fill={L.hand} stroke={L.line} strokeWidth={3.5} />
          </g>
        ) : (
          <g>
            <ellipse cx={side * 10} cy={3} rx={5.5} ry={9} transform={`rotate(${side * -28} ${side * 10} 3)`} fill={L.hand} stroke={L.line} strokeWidth={4} />
            <ellipse cx={0} cy={10} rx={11} ry={15} fill={L.hand} stroke={L.line} strokeWidth={4} />
            <path d="M -4 17 L -4 23 M 3 18 L 3 24" stroke={L.line} strokeWidth={2} opacity={0.45} strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  };
  // a healed wrist where the right hand was taken: the forearm ends in a bandaged stump, no mitten, so
  // the hand that wrote the fourth rule is never accidentally given back
  const stump = (o: { mid: P; end: P }) => {
    const ang = (Math.atan2(o.end.x - o.mid.x, o.end.y - o.mid.y) * 180) / Math.PI;
    return (
      <g transform={`translate(${o.end.x} ${o.end.y}) rotate(${-ang})`}>
        {/* the sleeve stops at the wrist, then the short healed stub of bare skin, bandaged across its end */}
        <path d="M -11 -9 L 11 -9 L 8 16 Q 0 23 -8 16 Z" fill={L.skin} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
        <path d="M -11 1 L 11 1" stroke="#D8CDB8" strokeWidth={6} strokeLinecap="butt" opacity={0.95} />
        <path d="M -10 9 L 10 9" stroke="#D8CDB8" strokeWidth={5} strokeLinecap="butt" opacity={0.75} />
        <ellipse cx={0} cy={16} rx={6} ry={4} fill={L.line} opacity={0.3} />
      </g>
    );
  };
  const kw = turnWidth(pose.yaw);
  const torso = (
    <g transform={`rotate(${pose.tilt}) translate(${pose.yaw * 6} 0) scale(${kw} 1)`}>
      <path d="M -46 -112 Q 0 -124 46 -112 L 40 2 Q 0 12 -40 2 Z" fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
      <path d="M 10 -116 Q 30 -114 46 -112 L 40 2 Q 26 8 12 9 Z" fill={L.jacketShade} opacity={0.55} />
      <path d="M 0 -112 L 0 4" stroke={L.jacketShade} strokeWidth={4} />
      {L.extra === 'suit' ? (
        // a white shirt in the V of the jacket and a tie in the accent colour
        <g>
          <path d="M -24 -116 L 0 -54 L 24 -116 Z" fill="#EDE8DE" />
          <path d="M -7 -112 L 7 -112 L 9 -100 L 5 -64 L 0 -56 L -5 -64 L -9 -100 Z" fill={L.accent} />
          <path d="M -26 -116 L 0 -54 M 26 -116 L 0 -54" stroke={L.line} strokeWidth={4} />
        </g>
      ) : (
        <path d="M -22 -118 Q 0 -100 22 -118" stroke={L.accent} strokeWidth={6} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
  const head = (
    <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt} 0 ${HEAD.y + 40})`}>
      {L.extra === 'long' ? (
        // long hair's back mass: behind the head, so the face stays clear
        <g transform={`translate(${-pose.yaw * 14} 0)`}>
          <path d={`M -78 ${HEAD.y + 20} Q -88 ${HEAD.y - 78} 0 ${HEAD.y - 78} Q 88 ${HEAD.y - 78} 78 ${HEAD.y + 20} L 46 ${HEAD.y + 96} Q 0 ${HEAD.y + 108} -46 ${HEAD.y + 96} Z`} fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M -76 ${HEAD.y + 10} Q -82 ${HEAD.y - 66} -14 ${HEAD.y - 70} Q -58 ${HEAD.y - 30} -60 ${HEAD.y + 70}`} fill="none" stroke={L.line} strokeWidth={3} opacity={0.35} />
        </g>
      ) : null}
      {L.extra === 'pony' ? (
        // the tail is drawn BEHIND the head, anchored at the back of the crown: only a sliver beside the
        // crown and its lower length past the jaw ever show, so the face stays clear
        <g transform={`rotate(${pose.sway * 0.9} ${-pose.yaw * 24 - 22} ${HEAD.y - 52})`}>
          <path
            d={`M ${-pose.yaw * 24 - 18} ${HEAD.y - 58} Q ${-pose.yaw * 24 - 62} ${HEAD.y - 22} ${-pose.yaw * 24 - 66} ${HEAD.y + 52} Q ${-pose.yaw * 24 - 40} ${HEAD.y + 96} ${-pose.yaw * 24 - 8} ${HEAD.y + 60} Q ${-pose.yaw * 24 + 8} ${HEAD.y + 12} ${-pose.yaw * 24 + 14} ${HEAD.y - 58} Z`}
            fill={L.hair} stroke={L.line} strokeWidth={4} strokeLinejoin="round"
          />
        </g>
      ) : null}
      {L.extra === 'suit' ? (
        // one spare grey stroke slipped behind the scalp — it hugs just outside the head circle,
        // so only a thin rim shows past the silhouette: the hint that the hair wraps round the back
        <path d={`M -50.7 ${HEAD.y - 40} A 64 64 0 0 1 50.7 ${HEAD.y - 40}`} stroke={L.hair} strokeWidth={6} fill="none" strokeLinecap="round" />
      ) : null}
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={L.skin} stroke={L.line} strokeWidth={4} />
      <path d={`M ${HEAD.x + 14} ${HEAD.y + 58} A ${HEAD.r} ${HEAD.r} 0 0 0 ${HEAD.x + 60} ${HEAD.y + 14} A 70 70 0 0 1 ${HEAD.x + 14} ${HEAD.y + 58} Z`} fill={L.skinShade} />
      {L.extra === 'bunches' || L.extra === 'hoodBun' || L.extra === 'bob' || L.extra === 'suit' || L.extra === 'long' || L.extra === 'pony' || L.extra === 'cap' || L.extra === 'short' ? null : (
        <path transform={`translate(${-pose.yaw * 16} 0)`} d={`M -6 ${HEAD.y - 60} q 10 -26 30 -18 q -16 2 -14 16 q -8 -10 -16 2 Z`} fill={L.hair} />
      )}
      {L.extra === 'short' ? (
        <path transform={`translate(${-pose.yaw * 14} 0)`} d={`M -56 ${HEAD.y - 28} Q -58 ${HEAD.y - 72} 0 ${HEAD.y - 76} Q 58 ${HEAD.y - 72} 56 ${HEAD.y - 28} Q 30 ${HEAD.y - 52} 0 ${HEAD.y - 50} Q -30 ${HEAD.y - 52} -56 ${HEAD.y - 28} Z`} fill={L.hair} stroke={L.line} strokeWidth={3} strokeLinejoin="round" />
      ) : null}
      {L.extra === 'messy' ? (
        // a messy fringe that hugs the skull, with two strands standing up: the reference's haircut
        <g transform={`translate(${-pose.yaw * 14} 0)`}>
          <path
            d={`M -54.3 ${HEAD.y - 30} A ${HEAD.r} ${HEAD.r} 0 0 1 54.3 ${HEAD.y - 30} Q 44 ${HEAD.y - 22} 34 ${HEAD.y - 12} Q 24 ${HEAD.y - 1} 12 ${HEAD.y - 15} Q 2 ${HEAD.y - 3} -10 ${HEAD.y - 17} Q -22 ${HEAD.y - 3} -32 ${HEAD.y - 15} Q -44 ${HEAD.y - 20} -54.3 ${HEAD.y - 30} Z`}
            fill={L.hair}
            stroke={L.line}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path d={`M -4 ${HEAD.y - 64} Q 1 ${HEAD.y - 80} 12 ${HEAD.y - 82} Q 5 ${HEAD.y - 74} 8 ${HEAD.y - 66} Q 3 ${HEAD.y - 71} -4 ${HEAD.y - 64} Z`} fill={L.hair} />
          <path d={`M 6 ${HEAD.y - 66} Q 12 ${HEAD.y - 78} 21 ${HEAD.y - 79} Q 15 ${HEAD.y - 73} 16 ${HEAD.y - 67} Q 12 ${HEAD.y - 70} 6 ${HEAD.y - 66} Z`} fill={L.hair} />
        </g>
      ) : null}
      {L.extra === 'bunches' || L.extra === 'hoodBun' ? (
        // a fringe cap and two bunches tied with coral bands; the bunches swing a little with sway
        <g>
          {[-1, 1].map((sd) => (
            <g key={sd} transform={`rotate(${pose.sway * 0.5} ${sd * 58} ${HEAD.y - 30})`}>
              <circle cx={sd * 72 - pose.yaw * 10} cy={HEAD.y - 24} r={24} fill={L.hair} stroke={L.line} strokeWidth={4} />
              <circle cx={sd * 55 - pose.yaw * 10} cy={HEAD.y - 30} r={8} fill={L.accent} />
            </g>
          ))}
          <path transform={`translate(${-pose.yaw * 14} 0)`} d={`M -60 ${HEAD.y - 22} Q -62 ${HEAD.y - 66} 0 ${HEAD.y - 66} Q 62 ${HEAD.y - 66} 60 ${HEAD.y - 22} Q 40 ${HEAD.y - 46} 14 ${HEAD.y - 40} Q 0 ${HEAD.y - 50} -14 ${HEAD.y - 40} Q -40 ${HEAD.y - 46} -60 ${HEAD.y - 22} Z`} fill={L.hair} />
        </g>
      ) : null}
      {L.extra === 'bob' ? (
        // a chin-length bob framing the face, a side parting
        <path
          transform={`translate(${-pose.yaw * 12} 0)`}
          d={`M -74 ${HEAD.y + 34} Q -84 ${HEAD.y - 70} 0 ${HEAD.y - 72} Q 84 ${HEAD.y - 70} 74 ${HEAD.y + 34} L 56 ${HEAD.y + 34} Q 60 ${HEAD.y - 20} 40 ${HEAD.y - 40} Q 10 ${HEAD.y - 34} -16 ${HEAD.y - 48} Q -52 ${HEAD.y - 30} -56 ${HEAD.y + 34} Z`}
          fill={L.hair}
          stroke={L.line}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ) : null}
      {L.extra === 'long' ? (
        // a fringe over the forehead, in front of the hairline
        <path transform={`translate(${-pose.yaw * 14} 0)`} d={`M -62 ${HEAD.y - 30} Q -60 ${HEAD.y - 74} 0 ${HEAD.y - 76} Q 60 ${HEAD.y - 74} 62 ${HEAD.y - 30} Q 30 ${HEAD.y - 58} 0 ${HEAD.y - 56} Q -30 ${HEAD.y - 58} -62 ${HEAD.y - 30} Z`} fill={L.hair} stroke={L.line} strokeWidth={3} strokeLinejoin="round" />
      ) : null}
      {L.extra === 'pony' ? (
        // a thick fringe cap: its top edge is the head circle itself (nothing pokes outside the skull),
        // its bottom edge sweeps across the forehead in waves — a full head of hair that hugs at every yaw —
        // plus the tail behind the head and the tie visible at the crown
        <g>
          <path
            d={`M -54.3 ${HEAD.y - 30} A ${HEAD.r} ${HEAD.r} 0 0 1 54.3 ${HEAD.y - 30} Q 42 ${HEAD.y - 18} 26 ${HEAD.y - 22} Q 12 ${HEAD.y - 8} -4 ${HEAD.y - 18} Q -20 ${HEAD.y - 6} -36 ${HEAD.y - 20} Q -46 ${HEAD.y - 26} -54.3 ${HEAD.y - 30} Z`}
            fill={L.hair} stroke={L.line} strokeWidth={3} strokeLinejoin="round"
          />
          <circle cx={-pose.yaw * 24 - 14} cy={HEAD.y - 52} r={9} fill={L.accent} stroke={L.line} strokeWidth={3} />
        </g>
      ) : null}
      {L.extra === 'cap' ? (
        // a guard's cap: a flat crown, a band and a small brim, in the jacket colour with a brass badge
        <g transform={`translate(${-pose.yaw * 10} 0)`}>
          <path d={`M -62 ${HEAD.y - 28} Q -66 ${HEAD.y - 66} 0 ${HEAD.y - 70} Q 66 ${HEAD.y - 66} 62 ${HEAD.y - 28} Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M -62 ${HEAD.y - 28} Q 0 ${HEAD.y - 40} 62 ${HEAD.y - 28}`} fill="none" stroke={L.line} strokeWidth={3} opacity={0.5} />
          <rect x={-64} y={HEAD.y - 30} width={128} height={12} rx={5} fill={L.jacketShade} stroke={L.line} strokeWidth={3} />
          <circle cx={0} cy={HEAD.y - 24} r={7} fill={L.accent} stroke={L.line} strokeWidth={2} />
          <path d={`M -52 ${HEAD.y - 18} Q 0 ${HEAD.y - 2} 52 ${HEAD.y - 18} L 46 ${HEAD.y - 26} Q 0 ${HEAD.y - 14} -46 ${HEAD.y - 26} Z`} fill={L.jacketShade} stroke={L.line} strokeWidth={3} strokeLinejoin="round" />
        </g>
      ) : null}
      <Face expr={pose.expr} blink={pose.blink} look={pose.look} glasses={pose.glasses} yaw={pose.yaw} ink={L.face} glint={pose.glint} glintColor={pose.glintColor} whiteEyes={L.whiteEyes ?? 0} eyesStyle={L.eyes} glassesStyle={L.glassesStyle} brow={L.brow} />
      {L.extra === 'suit' ? <HairCut color={L.hair} /> : null}
      {L.beard ? <Beard color={L.hair} yaw={pose.yaw} /> : null}
      {L.extra === 'curls'
        ? [-150, -125, -100, -78, -55, -30].map((deg, k) => {
            const a = (deg * Math.PI) / 180;
            return <circle key={k} cx={Math.cos(a) * 54} cy={HEAD.y + Math.sin(a) * 54} r={24} fill={L.hair} />;
          })
        : null}
    </g>
  );
  return (
    <g>
      {shadow > 0 ? <ellipse cx={pose.x} cy={pose.y + LEG_LEN * pose.scale + 10} rx={70 * pose.scale} ry={12 * pose.scale} fill="#000" opacity={0.25 * shadow} /> : null}
      <g transform={`translate(${pose.x} ${pose.y}) scale(${pose.scale}) rotate(${pose.spin} 0 -90)`} filter={rimId ? `url(#${rimId})` : undefined}>
        <g transform={`translate(0 ${LEG_LEN}) scale(${1 + 0.6 * pose.squash} ${1 - pose.squash}) translate(0 ${-LEG_LEN})`}>
          {/* the far side is drawn first, so a turned body overlaps itself the right way */}
          {pose.yaw < 0 ? <>{limb(j.legR, 12, legC)}{shoe(j.legR)}{limb(j.legL, 12, legC)}{shoe(j.legL)}</> : <>{limb(j.legL, 12, legC)}{shoe(j.legL)}{limb(j.legR, 12, legC)}{shoe(j.legR)}</>}
          {pose.yaw < 0 ? <>{limb(j.armR, 11, armC)}{sleeve(j.armR)}{L.noHandR ? stump(j.armR) : hand(j.armR, -1, pose.handR)}</> : <>{limb(j.armL, 11, armC)}{sleeve(j.armL)}{hand(j.armL, 1, pose.handL)}</>}
          {torso}
          {pose.yaw < 0 ? <>{limb(j.armL, 11, armC)}{sleeve(j.armL)}{hand(j.armL, 1, pose.handL)}</> : <>{limb(j.armR, 11, armC)}{sleeve(j.armR)}{L.noHandR ? stump(j.armR) : hand(j.armR, -1, pose.handR)}</>}
          {L.extra === 'hood' || L.extra === 'hoodBun' ? (
            <g transform={`rotate(${pose.tilt}) rotate(${pose.headTilt * 0.5} 0 ${HEAD.y + 40})`}>
              <path d={`M -70 ${HEAD.y + 14} Q -80 ${HEAD.y - 74} 0 ${HEAD.y - 80} Q 80 ${HEAD.y - 74} 70 ${HEAD.y + 14} Q 52 -100 0 -106 Q -52 -100 -70 ${HEAD.y + 14} Z`} fill={L.jacket} stroke={L.line} strokeWidth={4} />
              {(() => {
                const sw = pose.sway * 0.7 - pose.tilt * 0.6;
                return (
                  <g>
                    <path d={`M -12 -108 Q ${-14 + sw * 0.3} -88 ${-16 + sw} -66 M 12 -108 Q ${14 + sw * 0.3} -88 ${16 + sw} -66`} stroke={L.accent} strokeWidth={5} strokeLinecap="round" fill="none" />
                    <circle cx={-16 + sw} cy={-64} r={5} fill={L.accent} />
                    <circle cx={16 + sw} cy={-64} r={5} fill={L.accent} />
                  </g>
                );
              })()}
            </g>
          ) : null}
          {L.extra === 'curls' ? (
            <g transform={`rotate(${pose.tilt})`}>
              <path d="M -46 -110 Q 0 -86 46 -110" stroke="#E06A5A" strokeWidth={8} fill="none" strokeLinecap="round" />
              <rect x={-60} y={-126} width={20} height={32} rx={8} fill="#E06A5A" stroke={L.line} strokeWidth={4} />
              <rect x={40} y={-126} width={20} height={32} rx={8} fill="#E06A5A" stroke={L.line} strokeWidth={4} />
            </g>
          ) : null}
          {head}
        </g>
      </g>
    </g>
  );
};


/** A character is the rig in a costume: <Actor> is the same as <Hero>, named for scenes with more than one person. */
export const Actor = Hero;

/**
 * A walk in profile. `phase` advances about 0.6 a frame for a normal walk; `ground` is the floor height under the hips
 * (a number, or a function of x for stairs and slopes). Leans into the step, bobs the head, bends the elbows, swings
 * loose things (the drawstrings) a beat behind the body.
 */
export const walkPose = (x: number, phase: number, ground: number | ((x: number) => number), scale = 0.9, extra: Partial<Pose> = {}, facing: 1 | -1 = 1): Pose => {
  const s = Math.sin(phase);
  const g = typeof ground === 'number' ? ground : ground(x);
  return {
    ...basePose,
    x,
    y: g - LEG_LEN * scale - Math.abs(Math.cos(phase)) * 7,
    scale,
    facing,
    yaw: facing,
    tilt: 5 * facing,
    headTilt: 2 * Math.sin(phase * 2),
    sway: 10 * Math.sin(phase + 0.8),
    legL: { a: 28 * s, b: -Math.max(0, 40 * Math.sin(phase + 1.2)) },
    legR: { a: -28 * s, b: -Math.max(0, 40 * Math.sin(phase + 1.2 + Math.PI)) },
    armL: { a: 24 * s, b: 12 + 14 * Math.abs(s) },
    armR: { a: 24 * s, b: 12 + 14 * Math.abs(s) },
    ...extra,
  };
};

/** Where the feet are for a pose standing at hip y: use it to put a character on a floor (y = floor - feetBelowHips). */
export const feetBelowHips = (scale: number) => LEG_LEN * scale;
