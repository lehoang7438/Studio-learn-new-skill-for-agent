import React from 'react';
import {
  basePose,
  CharacterSheet,
  CHARACTERS,
  ChoiceCard,
  FlatHero,
  flatHandR,
  FONT,
  Hud,
  LightPool,
  Pose,
  push,
  Scanlines,
  ShotProps,
} from '../../engine';
import project from './project.json';

// REF NHÂN VẬT — the character-reference test, not an episode.
// It proves one thing: a character read off a reference image can be drawn once and reused in
// every framing without drifting. S1 is the sheet, S2 is the reference's corridor beat, S3 is the
// close-up, S4 puts the same face behind a HUD, S5 closes the loop. One spec, five shots.
//
// The character is original (name, story, colours from our own palette); only the *visual language*
// of the reference is borrowed: flat vector shapes, huge round eyes, a messy fringe, a tee.
// Captions come from project.json -> captions.json -> CaptionLayer, never from a shot.

const END = project.endCard;
const NAM = CHARACTERS.nam;
const ONG = CHARACTERS.ong;
const LOOK = NAM.look;

const blinkAt = (t: number, every = 100) => (t % every > every - 5 ? 1 : 0);

/** The corridor: deep teal walls, a louvred window, two doors, a name plate. */
const Corridor: React.FC<{ t: number }> = ({ t }) => {
  const flick = 0.9 + 0.1 * Math.sin(t / 7) * Math.sin(t / 13);
  return (
    <g>
      <rect x={420} y={-420} width={1080} height={1920} fill="#152A2C" />
      <rect x={420} y={-420} width={1080} height={1000} fill="#204043" />
      {/* the window with its louvres, one slat at a time */}
      <g>
        <rect x={466} y={16} width={400} height={630} rx={8} fill="#0E2022" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x={480}
            y={30 + i * 74}
            width={372}
            height={54}
            rx={4}
            fill="#7FA8A2"
            opacity={0.26 + 0.06 * Math.sin((t + i * 9) / 16)}
          />
        ))}
        <rect x={466} y={16} width={400} height={630} rx={8} fill="none" stroke="#2E5254" strokeWidth={10} />
      </g>
      {/* two doors, brass handles */}
      {[1088, 1298].map((x) => (
        <g key={x}>
          <rect x={x} y={86} width={198} height={814} rx={6} fill="#2A4A4C" />
          <rect x={x + 12} y={106} width={174} height={774} rx={4} fill="#234042" stroke="#152A2C" strokeWidth={6} />
          <rect x={x + 34} y={176} width={130} height={252} rx={4} fill="#1B3436" />
          <rect x={x + 34} y={468} width={130} height={332} rx={4} fill="#1B3436" />
          <rect x={x + 152} y={470} width={12} height={62} rx={6} fill="#C9A24A" opacity={0.85} />
        </g>
      ))}
      {/* skirting, floor tiles, ceiling tube */}
      <rect x={420} y={898} width={1080} height={26} fill="#0F2224" />
      <rect x={420} y={924} width={1080} height={620} fill="#12282A" />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={`h${i}`} x1={420} y1={958 + i * 66} x2={1500} y2={958 + i * 66} stroke="#1B383A" strokeWidth={2} />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={`v${i}`} x1={470 + i * 160} y1={924} x2={430 + i * 180} y2={1520} stroke="#1B383A" strokeWidth={2} />
      ))}
      <rect x={640} y={-372} width={560} height={20} rx={10} fill="#D7E8DE" opacity={0.85 * flick} />
      <LightPool x={920} y={-180} r={640} color="#CFE3D8" o={0.13 * flick} />
      <LightPool x={700} y={640} r={520} color="#9FC8C0" o={0.06} />
      {/* the name plate above the shoulder */}
      <g transform="translate(1032 104)">
        <rect x={-96} y={-40} width={192} height={80} rx={8} fill="#0E1E20" stroke="#3E6A66" strokeWidth={3} />
        <text x={-76} y={4} fontFamily={FONT.title} fontSize={38} fill="#E8F2EC">
          NAM
        </text>
        <text x={-76} y={28} fontFamily={FONT.ui} fontSize={16} letterSpacing={2} fill="#7FA8A2">
          LỚP 11A2
        </text>
      </g>
    </g>
  );
};

/** The other student's arm, entering from off-frame and closing round Nam's wrist. */
const Grab: React.FC<{ pose: Pose; t: number }> = ({ pose, t }) => {
  const w = flatHandR(pose);
  const sway = Math.sin(t / 18) * 4;
  return (
    <g>
      {/* the arm: one tapered stroke, darker skin than Nam's so the two bodies never merge */}
      <path
        d={`M 1560 ${520 + sway} Q 1300 ${560 + sway} ${w.x + 34} ${w.y - 6}`}
        stroke="#241C22"
        strokeWidth={62}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M 1560 ${520 + sway} Q 1300 ${560 + sway} ${w.x + 34} ${w.y - 6}`}
        stroke="#C98E68"
        strokeWidth={54}
        fill="none"
        strokeLinecap="round"
      />
      {/* the hand: palm on the far side of the wrist, four fingers curling back over it,
          thumb underneath — darker than Nam's skin so the two bodies never merge */}
      <g transform={`translate(${w.x + 6} ${w.y + 2}) rotate(8)`}>
        <ellipse cx={20} cy={4} rx={31} ry={35} fill="#B47A52" opacity={0.5} />
        <ellipse cx={20} cy={0} rx={30} ry={34} fill="#C98E68" />
        {[-19, -7, 5, 17].map((dy, i) => (
          <g key={i}>
            <rect x={-30} y={dy - 7 + i * 0.6} width={56} height={14} rx={7} fill="#D19A70" />
            <path
              d={`M -28 ${dy + 7.2 + i * 0.6} L 24 ${dy + 7.2 + i * 0.6}`}
              stroke="#9C6A46"
              strokeWidth={2}
              opacity={0.38}
              strokeLinecap="round"
            />
          </g>
        ))}
        {/* thumb: from the palm, laid across the top of the wrist */}
        <ellipse cx={-20} cy={-24} rx={11} ry={16} transform="rotate(-26 -20 -24)" fill="#D9A275" />
        <path d="M -12 -8 Q 2 -15 16 -6" stroke="#9C6A46" strokeWidth={2} fill="none" opacity={0.3} strokeLinecap="round" />
      </g>
    </g>
  );
};

// S1 — the sheet. Four views, the palette, the rule. This is the frame you hold next to the image.
export const S1: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.0, 1.028)}>
    <CharacterSheet spec={NAM} t={t} refImage={NAM.ref} />
    <Scanlines o={0.04} />
  </g>
);

// S2 — the reference beat: corridor, name plate, a hand closing on the wrist, the same worried face.
export const S2: React.FC<ShotProps> = ({ t, len }) => {
  const pose: Pose = {
    ...basePose,
    x: 790,
    y: 810,
    scale: 2.3,
    facing: 1,
    yaw: 0.1,
    tilt: -1.5 + Math.sin(t / 26) * 1.1,
    headTilt: 2 + Math.sin(t / 32) * 1.4,
    expr: 'worried',
    blink: blinkAt(t, 104),
    look: -0.12,
    armL: { a: 16, b: -8 },
    armR: { a: 78, b: -30 },
    legL: { a: -8, b: 0 },
    legR: { a: 8, b: 0 },
    sway: Math.sin(t / 20) * 3,
  };
  return (
    <g transform={push(t, len, 1.0, 1.04)}>
      <Corridor t={t} />
      <FlatHero pose={pose} look={LOOK} light={{ x: -0.8, y: -0.35, rim: 0.75, shade: 0.5, warm: '#D7E8DE' }} />
      <Grab pose={pose} t={t} />
      <rect x={420} y={-420} width={1080} height={1920} fill="#061012" opacity={0.08} />
      <Scanlines o={0.05} />
    </g>
  );
};

// S3 — extreme close-up. Same face, same eyes; only the light changes.
export const S3: React.FC<ShotProps> = ({ t, len }) => {
  const pose: Pose = {
    ...basePose,
    x: 960,
    y: 1335,
    scale: 5.4,
    facing: 1,
    yaw: 0.06,
    tilt: -1,
    headTilt: 1 + Math.sin(t / 34) * 1.2,
    expr: 'worried',
    blink: blinkAt(t, 112),
    look: -0.1,
    glint: 0.18,
    glintColor: '#FFD24A',
  };
  return (
    <g transform={push(t, len, 1.0, 1.03)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#132628" />
      <LightPool x={720} y={360} r={780} color="#8FBEB4" o={0.16} />
      <rect x={420} y={-420} width={1080} height={1920} fill="#081214" opacity={0.28} />
      <FlatHero pose={pose} look={LOOK} light={{ x: -0.85, y: -0.3, rim: 0.85, shade: 0.55, warm: '#CFE3D8' }} />
      <Scanlines o={0.07} />
    </g>
  );
};

/** The night cabin: a window, a seat, a HUD. The same face, now under blue light. */
const CabinSeat: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={420} y={-420} width={1080} height={1920} fill="#0B1226" />
    {/* the window on the right, with the lights of the line going past */}
    <g>
      <rect x={1150} y={-260} width={330} height={620} rx={26} fill="#060B18" stroke="#2A3550" strokeWidth={10} />
      {Array.from({ length: 5 }).map((_, i) => (
        <rect
          key={i}
          x={1164}
          y={-220 + ((i * 130 + t * 3) % 560)}
          width={300}
          height={26}
          rx={12}
          fill="#7FA8E8"
          opacity={0.18 + 0.1 * Math.sin((t + i * 20) / 9)}
        />
      ))}
      <rect x={1150} y={-260} width={330} height={620} rx={26} fill="none" stroke="#38466A" strokeWidth={4} />
    </g>
    {/* the seat behind him */}
    <path d="M 560 1180 L 560 420 Q 560 300 700 300 L 1220 300 Q 1360 300 1360 420 L 1360 1180 Z" fill="#1B2440" stroke="#2C3A5E" strokeWidth={6} />
    <path d="M 700 380 Q 960 340 1220 380" stroke="#2C3A5E" strokeWidth={4} fill="none" />
    <rect x={420} y={-420} width={1080} height={1920} fill="#1B2A5A" opacity={0.14} />
  </g>
);

// S4 — the second reference: the night passenger with wire glasses, under the HUD and the seat tag.
export const S4: React.FC<ShotProps> = ({ t, len }) => {
  const pose: Pose = {
    ...basePose,
    x: 960,
    y: 1270,
    scale: 5.5,
    facing: 1,
    yaw: 0.02,
    tilt: 0,
    headTilt: Math.sin(t / 40) * 0.8,
    expr: 'tired',
    blink: blinkAt(t, 132),
    look: 0.06,
    glasses: 1,
  };
  return (
    <g transform={push(t, len, 1.0, 1.03)}>
      <CabinSeat t={t} />
      <FlatHero pose={pose} look={ONG.look} light={{ x: 0.75, y: -0.4, rim: 0.9, shade: 0.6, warm: '#BFD9FF' }} />
      {/* the cold grade that makes the same skin read as night-blue */}
      <rect x={420} y={-420} width={1080} height={1920} fill="#24356B" opacity={0.26} />
      {/* the seat back in front, so the standing rig reads as a seated passenger */}
      <path d="M 420 1180 Q 960 1090 1500 1180 L 1500 1520 L 420 1520 Z" fill="#151D33" stroke="#2A3550" strokeWidth={6} />
      <rect x={420} y={1180} width={1080} height={16} fill="#2A3550" opacity={0.8} />
      {/* the seat tag from the reference */}
      <g transform="translate(960 790)">
        <rect x={-104} y={-38} width={208} height={76} rx={14} fill="#0B1120" opacity={0.9} stroke="#6B7BA8" strokeWidth={2} />
        <text x={0} y={10} textAnchor="middle" fontFamily={FONT.ui} fontSize={30} letterSpacing={2} fill="#E6EDF5">
          GHẾ 5
        </text>
      </g>
      <Hud t={t} clock="23:14" route="CHUYẾN CUỐI" fuel={47} km={46} seats={5} lights={false} />
      <Scanlines o={0.06} />
    </g>
  );
};

// S5 — the choice card.
export const S5: React.FC<ShotProps> = ({ t }) => (
  <g>
    <rect x={420} y={-420} width={1080} height={1920} fill="#101A1C" />
    <LightPool x={960} y={560} r={760} color="#7FA8A2" o={0.09} />
    <ChoiceCard t={t} a={END.a} b={END.b} subA={END.subA} subB={END.subB} prompt={END.prompt} />
  </g>
);

