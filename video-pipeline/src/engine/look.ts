// The second half of the character contract: WHAT a renderer understands.
//
// `metrics.ts` locks the skeleton; this file locks the costume vocabulary. `Hero` (rig.tsx) and
// `FlatHero` (flat.tsx) both accept the same `Look`, but each only ever read part of it. A scene could
// set `sleeve: 0.46, eyes: 'round'` on a flat character and the fields were silently ignored — the
// character looked different from the sheet and nothing warned. Keep the support table here and show
// the gaps on the reference sheet (and in `unsupportedLookFields`) instead of guessing at render time.

import type { Look } from './rig';
import type { Renderer } from './metrics';

/** Which renderer honours each field. 'both' = the same intent on both bodies,
 *  'partial' = the field is an enum with a different supported subset per renderer (see EXTRA_SUPPORT). */
export const LOOK_SUPPORT: Record<keyof Look, Renderer | 'both' | 'partial'> = {
  // palette: shared, so a colour on the sheet is a colour in every scene
  skin: 'both',
  skinShade: 'both',
  hand: 'both',
  jacket: 'both',
  jacketShade: 'both',
  accent: 'both',
  limb: 'both',
  line: 'both',
  shoe: 'both',
  hair: 'both',
  face: 'rig', // FlatHero draws the face with `line`, not a separate `face` ink
  arm: 'both',
  leg: 'both',
  // costume: only one body draws these
  sleeve: 'rig',
  eyes: 'rig',
  brow: 'rig',
  whiteEyes: 'rig',
  noHandR: 'rig',
  beard: 'rig',
  glassesStyle: 'both', // both draw wire frames when 'clear'
  // geometry / expression: only the flat body reads these
  armLen: 'flat',
  armW: 'flat',
  headR: 'flat',
  longFace: 'flat',
  browStraight: 'flat',
  extra: 'partial',
};

/** Hairstyle/prop values each renderer actually draws. Anything else falls back to a generic shape. */
export const EXTRA_SUPPORT: Record<Renderer, readonly string[]> = {
  rig: ['hood', 'hoodBun', 'curls', 'bunches', 'bob', 'suit', 'cap', 'long', 'pony', 'short', 'messy'],
  flat: ['messy', 'slick'],
};

/** Fields set on `look` that `renderer` will silently ignore. Use this as a gate before adding a shot:
 *  if the list is not empty, the spec and the rig disagree and the character sheet is a lie. */
export const unsupportedLookFields = (look: Look, renderer: Renderer): string[] => {
  const other: Renderer = renderer === 'rig' ? 'flat' : 'rig';
  const out: string[] = [];
  for (const key of Object.keys(look) as (keyof Look)[]) {
    if (LOOK_SUPPORT[key] === other) out.push(key as string);
  }
  if (look.extra && !EXTRA_SUPPORT[renderer].includes(look.extra)) out.push(`extra:${look.extra}`);
  return out.sort();
};

/** Human-readable version for the sheet's warning strip. */
export const describeLookGaps = (look: Look, renderer: Renderer): string =>
  unsupportedLookFields(look, renderer).join(', ');

// ---------- hands --------------------------------------------------------------------------------
// A hand is part of the Body Lock, not a free-floating drawing. These three colours used to be typed
// as hex literals inside WheelHand / GripHand / PovArm, so an off-screen hand had a different skin
// tone from the same character's on-screen hand. Every close-up hand now derives from the same Look.

export type HandSpec = {
  /** Back of the hand and fingers — the character's `hand` colour. */
  skin: string;
  /** Knuckles / finger shadow — the character's `skinShade`. */
  shade: string;
  /** The forearm right above the wrist: a bare arm (`arm`) or a shirt sleeve. */
  forearm: string;
  /** Shade down one side of that forearm. */
  forearmShade: string;
  /** The jacket/coat at the frame edge, past the elbow. */
  sleeve: string;
  /** Cuff and sleeve shadow. */
  sleeveShade: string;
  /** Outline, when the close-up needs one. */
  line: string;
};

/** The legacy palette of the taxi driver, kept ONLY for callers that still omit a `look`.
 *  New code must pass `handSpecFor(look)` so the hand matches the body. */
export const HAND_FALLBACK: HandSpec = {
  skin: '#C08A63',
  shade: '#A67150',
  forearm: '#C08A63',
  forearmShade: '#A67150',
  sleeve: '#14181F',
  sleeveShade: '#0B0F14',
  line: '#05070A',
};

export const handSpecFor = (look?: Look): HandSpec => {
  if (!look) return HAND_FALLBACK;
  return {
    skin: look.hand ?? look.skin,
    shade: look.skinShade,
    forearm: look.arm ?? look.skin,
    forearmShade: look.skinShade,
    sleeve: look.jacket,
    sleeveShade: look.jacketShade,
    line: look.line,
  };
};
