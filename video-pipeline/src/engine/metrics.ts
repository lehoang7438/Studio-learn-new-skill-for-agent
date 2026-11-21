// ONE source of truth for body geometry. Both `Hero` (rig.tsx) and `FlatHero` (flat.tsx) import from here.
//
// Before this file the two rigs repeated the same maths with different constants: thigh 72 vs 88,
// shin 68 vs 84, shoulder x 42 vs 68, hip x 17 vs 24. Same `Pose`, same `Look`, different skeleton —
// so a character silently changed shape when a scene switched rigs. Keep every measurement here, and
// attach props to a hand through `handAnchors()` instead of a literal x/y in a shot.

export type Pt = { x: number; y: number };

export type Renderer = 'rig' | 'flat';

/** Local space: hips at 0,0, y down. Half-widths; arm lengths in the same units. */
export type BodyMetrics = {
  upperArm: number;
  foreArm: number;
  thigh: number;
  shin: number;
  shoulder: Pt;
  hip: Pt;
  headR: number;
};

export const BODY_METRICS: Record<Renderer, BodyMetrics> = {
  rig: {
    upperArm: 62,
    foreArm: 58,
    thigh: 72,
    shin: 68,
    shoulder: { x: 42, y: -108 },
    hip: { x: 17, y: 0 },
    headR: 62,
  },
  flat: {
    upperArm: 62,
    foreArm: 58,
    thigh: 88,
    shin: 84,
    shoulder: { x: 68, y: -94 },
    hip: { x: 24, y: 0 },
    headR: 58,
  },
};

export const HEAD = { x: 0, y: -176, r: BODY_METRICS.rig.headR };
/** Floor distance for each body — use the one that matches the renderer, not a global constant. */
export const legLength = (m: BodyMetrics) => m.thigh + m.shin;
export const LEG_LEN = legLength(BODY_METRICS.rig);
export const FLAT_LEG_LEN = legLength(BODY_METRICS.flat);
/** Half-widths actually drawn, so a character sheet can print the numbers it used. */
export const FLAT_METRICS = {
  shoulder: BODY_METRICS.flat.shoulder.x,
  hip: BODY_METRICS.flat.hip.x,
  headR: BODY_METRICS.flat.headR,
};

export const rad = (d: number) => (d * Math.PI) / 180;
export const rot = (p: Pt, deg: number, c: Pt = { x: 0, y: 0 }): Pt => {
  const r = rad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(r) - dy * Math.sin(r), y: c.y + dx * Math.sin(r) + dy * Math.cos(r) };
};
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** How wide the body reads as it turns: full width face-on, about 60% in profile. */
export const turnWidth = (yaw: number) => 1 - 0.4 * Math.min(1, Math.abs(yaw));
/** Shoulders and hips close up as he turns, so in profile the limbs overlap the body. */
export const limbSpread = (yaw: number) => 1 - 0.85 * Math.min(1, Math.abs(yaw));

/** The geometric part of `Pose` — structural, so both rigs can pass their full Pose straight in. */
export type PoseGeom = {
  x: number;
  y: number;
  scale: number;
  facing: 1 | -1;
  tilt: number;
  spin: number;
  yaw: number;
  armL: { a: number; b: number };
  armR: { a: number; b: number };
  legL: { a: number; b: number };
  legR: { a: number; b: number };
};

export type LimbJoints = { root: Pt; mid: Pt; end: Pt };
export type Joints = { armL: LimbJoints; armR: LimbJoints; legL: LimbJoints; legR: LimbJoints; head: Pt };

/** Joint positions in local space (before the hip translate/scale), so scenes can attach props to hands.
 *  Identical maths for both rigs; only `m` changes. `armLen` is the flat rig's adult-arm multiplier. */
export const jointsFor = (pose: PoseGeom, m: BodyMetrics, armLen = 1): Joints => {
  const UA = m.upperArm * armLen;
  const FA = m.foreArm * armLen;
  const side = (s: 1 | -1, limb: { a: number; b: number }, root: Pt, l1: number, l2: number, isLeg: boolean): LimbJoints => {
    const dir = isLeg ? pose.facing : s;
    const d1 = { x: dir * Math.sin(rad(limb.a)), y: Math.cos(rad(limb.a)) };
    const mid = { x: root.x + d1.x * l1, y: root.y + d1.y * l1 };
    const a2 = limb.a + limb.b;
    const d2 = { x: dir * Math.sin(rad(a2)), y: Math.cos(rad(a2)) };
    return { root, mid, end: { x: mid.x + d2.x * l2, y: mid.y + d2.y * l2 } };
  };
  const torsoRot = (p: Pt) => rot(p, pose.tilt);
  const sp = limbSpread(pose.yaw);
  const shL = { x: -m.shoulder.x * sp + pose.yaw * 6, y: m.shoulder.y };
  const shR = { x: m.shoulder.x * sp + pose.yaw * 6, y: m.shoulder.y };
  const armL = side(-1, pose.armL, shL, UA, FA, false);
  const armR = side(1, pose.armR, shR, UA, FA, false);
  const legL = side(-1, pose.legL, { x: -m.hip.x * sp, y: 0 }, m.thigh, m.shin, true);
  const legR = side(1, pose.legR, { x: m.hip.x * sp, y: 0 }, m.thigh, m.shin, true);
  const r = (o: LimbJoints) => ({ root: torsoRot(o.root), mid: torsoRot(o.mid), end: torsoRot(o.end) });
  return { armL: r(armL), armR: r(armR), legL, legR, head: torsoRot(HEAD) };
};

/** Local point to world space, for attaching props (the mug in Pip's hand). */
export const toWorld = (pose: PoseGeom, p: Pt): Pt => {
  const spun = rot(p, pose.spin, { x: 0, y: -90 });
  return { x: pose.x + spun.x * pose.scale, y: pose.y + spun.y * pose.scale };
};

export type HandAnchor = {
  /** World position of the wrist/hand tip. */
  at: Pt;
  /** Unit vector from the hand back up the forearm, in WORLD space. Use it for cuffs and grips. */
  axis: Pt;
  /** The joint chain this anchor came from (local space). */
  joints: Joints;
};

/** The hand + its forearm axis. Every prop (wheel, cup, phone, door handle) derives its placement
 *  from this, so a camera or pose change can never leave a hand floating away from the object. */
export const handAnchors = (pose: PoseGeom, m: BodyMetrics, armLen = 1): { L: HandAnchor; R: HandAnchor } => {
  const j = jointsFor(pose, m, armLen);
  const anchor = (limb: LimbJoints): HandAnchor => {
    const end = toWorld(pose, limb.end);
    const mid = toWorld(pose, limb.mid);
    const dx = mid.x - end.x;
    const dy = mid.y - end.y;
    const len = Math.hypot(dx, dy) || 1;
    return { at: end, axis: { x: dx / len, y: dy / len }, joints: j };
  };
  return { L: anchor(j.armL), R: anchor(j.armR) };
};

export const handAt = (pose: PoseGeom, m: BodyMetrics, armLen = 1, side: 'L' | 'R' = 'R') => handAnchors(pose, m, armLen)[side].at;
