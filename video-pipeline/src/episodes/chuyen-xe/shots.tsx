import React from 'react';
import { basePose, CHARACTERS, FlatHero, Pose, ShotProps, push } from '../../engine';
import { BigMirror, BloodDrop, CabinV, Clock, GripHand, MirrorV, RoadV, TV, WomanInGlass } from '../../engine/taxi';


// "CHUYẾN XE KHÔNG CÓ KHÁCH" — 33 shots, 540s, 1080x1920.
// Every shot is a pure function of t. The mirror rule is geometry, not a prompt: before T21 the woman
// exists only inside <MirrorV>, never in a seat.
//
// Status: Act 1 is built (T01-T03 done, T04-T09 next). The rest draw a placeholder card so `Board`
// shows exactly what is still missing.

const FONT = 'Anton, Be Vietnam Pro, sans-serif';
const CARD = { x: 420, y: -420, w: 1080, h: 1920 };

// T03 · POV-H · 23:34
export const T03: React.FC<ShotProps> = ({ t, len }) => {
  return (
    <g transform={push(t, len, 1.0, 1.025)}>
      <RoadV t={t} rain={0.7} speed={0.35} lamps={3} />
      <CabinV t={t} speed={0.35} wheel={Math.sin(t / 38) * 2} />
      <GripHand x={692} y={1338} side={-1} t={t} />
      <GripHand x={1228} y={1338} side={1} t={t} torn />
      <Clock text="23:34" x={1290} y={1178} />
      <MirrorV t={t} occupant="none" />
      <BloodDrop t={t} />
    </g>
  );
};

// T04 · INS · the radio dies, and that is when he hears her
export const T04: React.FC<ShotProps> = ({ t, len }) => {
  const flick = 0.34 + 0.1 * Math.sin(t / 6) - 0.12 * (t / 300);
  return (
    <g transform={push(t, len, 1.0, 1.05)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#04070C" />
      {/* the unit fills the frame: this is a close-up, not a panel in a room */}
      <rect x={420} y={-420} width={1080} height={1560} fill="#0A111B" />
      <rect x={420} y={-420} width={1080} height={6} fill="#1B2C3E" opacity={0.6} />
      {/* display */}
      <rect x={470} y={-300} width={980} height={300} rx={16} fill="#050C12" stroke="#16303F" strokeWidth={3} />
      <text x={960} y={-100} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={128} letterSpacing={8} fill={TV.amber} opacity={Math.max(0, flick)}>
        FM 103.5
      </text>
      <text x={960} y={-40} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={22} letterSpacing={4} fill="#7A6134" opacity={0.7}>
        STEREO · CH 03
      </text>
      {/* preset row, numbered so the object reads as a car radio */}
      {[1, 2, 3, 4].map((n, i) => (
        <g key={n} transform={`translate(${560 + i * 130} 60)`}>
          <rect x={-44} y={-26} width={88} height={52} rx={8} fill="#0B1420" stroke="#1D3046" strokeWidth={2} />
          <text y={8} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={22} fill="#5C7A9B" opacity={0.8}>
            {n}
          </text>
        </g>
      ))}
      {/* tuning slot */}
      <rect x={470} y={170} width={620} height={12} rx={6} fill="#050A11" stroke="#16283A" strokeWidth={2} />
      <rect x={560} y={172} width={70} height={8} rx={4} fill="#3C5A78" />
      {/* the knob: small enough to sit inside the pinch */}
      <circle cx={1094} cy={566} r={78} fill="#0A1524" stroke="#3A5773" strokeWidth={5} />
      <circle cx={1094} cy={566} r={56} fill="#0D1A28" stroke="#5C7A96" strokeWidth={2} />
      <circle cx={1094} cy={566} r={56} fill="none" stroke="#8FB4D6" strokeWidth={1.5} opacity={0.35} />
      <rect x={1088} y={524} width={12} height={26} rx={6} fill="#A8C4DC" opacity={0.75} transform={`rotate(${Math.min(40, t * 0.8)} 1094 566)`} />
      {/* left hand: index and thumb bow into a C whose hole holds the knob; three fingers up */}
      <g transform={`translate(0 ${Math.sin(t / 40) * 2})`}>
        {/* wrist */}
        <path d="M 872 640 L 796 840" stroke="#B47A55" strokeWidth={92} strokeLinecap="round" />
        {/* back of the hand */}
        <path d="M 878 468 q 74 -22 116 42 q 32 54 -2 102 q -44 44 -104 18 q -44 -32 -34 -96 q 8 -50 24 -66 Z" fill="#C98E68" />
        {/* three fingers, raised and slightly curved */}
        <path d="M 866 530 Q 890 440 874 356" stroke="#C98E68" strokeWidth={34} strokeLinecap="round" fill="none" />
        <path d="M 900 526 Q 930 432 920 344" stroke="#C98E68" strokeWidth={34} strokeLinecap="round" fill="none" />
        <path d="M 932 528 Q 972 452 960 366" stroke="#C98E68" strokeWidth={34} strokeLinecap="round" fill="none" />
        <path d="M 860 350 q 14 -6 28 -2 M 906 338 q 14 -6 28 -2 M 946 360 q 12 -6 26 -2" stroke="#B47A55" strokeWidth={3} fill="none" opacity={0.3} />
        {/* index: curves over, tip resting on the knob's top edge only */}
        <path d="M 962 486 Q 1044 468 1096 512" stroke="#C98E68" strokeWidth={36} fill="none" strokeLinecap="round" />
        {/* thumb: curves up, tip resting near the middle of the knob — it does not wrap it */}
        <path d="M 946 638 Q 1022 642 1082 590" stroke="#B47A55" strokeWidth={38} fill="none" strokeLinecap="round" />
        {/* knuckle creases */}
        <path d="M 986 500 q -10 34 -6 60 M 940 560 q 22 -6 40 8" stroke="#A96E4A" strokeWidth={4} fill="none" opacity={0.45} />
      </g>
      {/* the rest of the dash below the unit */}
      <rect x={420} y={1140} width={1080} height={360} fill="#070C13" />
      <rect x={420} y={1140} width={1080} height={4} fill="#1B2C3E" opacity={0.5} />
      <text x={960} y={1290} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={20} letterSpacing={4} fill="#2A4056">
        TAXI · 51B-234.56
      </text>
    </g>
  );
};

// T05 · POV-H · the mirror, and her inside it
export const T05: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.0, 1.045)}>
    <RoadV t={t} rain={0.55} speed={0.3} lamps={2} />
    <CabinV t={t} speed={0.3} wheel={Math.sin(t / 40) * 1.5} />
    <GripHand x={692} y={1338} side={-1} t={t} />
    <GripHand x={1228} y={1338} side={1} t={t} torn />
    <BigMirror t={t} occupant="woman" />
    <Clock text="23:34" x={1290} y={1178} />
  </g>
);

// T09 · INS · her face against the glass, only fingertips on the inside
export const T09: React.FC<ShotProps> = ({ t, len }) => {
  const tap = Math.abs(Math.sin(t / 16));
  return (
    <g transform={push(t, len, 1.0, 1.05)}>
      <defs>
        <linearGradient id="t09g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12293F" />
          <stop offset="55%" stopColor="#091521" />
          <stop offset="100%" stopColor="#04080D" />
        </linearGradient>
        <linearGradient id="t09fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#04080D" stopOpacity={0} />
          <stop offset="100%" stopColor="#04080D" stopOpacity={0.95} />
        </linearGradient>
        <radialGradient id="t09lamp">
          <stop offset="0%" stopColor={TV.amber} stopOpacity={0.22} />
          <stop offset="100%" stopColor={TV.amber} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={420} y={-420} width={1080} height={1920} fill="url(#t09g)" />
      {/* one lamp outside, out of focus */}
      <circle cx={650} cy={330} r={110} fill="url(#t09lamp)" />
      <circle cx={650} cy={330} r={7} fill={TV.amber} opacity={0.3} />

      {/* her, close to the glass */}
      <g transform="translate(920 370) scale(2.35)" opacity={0.62}>
        <WomanInGlass t={t} face />
      </g>

      {/* the bottom of the window goes to black before the hand, no hard seam */}
      <rect x={420} y={760} width={1080} height={740} fill="url(#t09fade)" />

      {/* fingertips pressing from the inside, palm out of frame */}
      <g transform={'translate(1010 ' + (1290 + tap * 7) + ')'} opacity={0.92}>
        {[0, 1, 2, 3].map((i) => {
          const h = 176 - Math.abs(i - 1.4) * 22;
          const x = -88 + i * 48;
          const tilt = (i - 1.5) * 3;
          return (
            <g key={i} transform={`translate(${x} 0) rotate(${tilt})`}>
              <path d={`M -17 120 L -17 ${-h + 20} Q -17 ${-h} 0 ${-h} Q 17 ${-h} 17 ${-h + 20} L 17 120 Z`} fill="#D5DDE5" opacity={0.9} />
              <path d={`M -15 -8 L -15 ${-h + 26} Q -15 ${-h + 6} 0 ${-h + 6} Q 15 ${-h + 6} 15 ${-h + 26} L 15 -8 Z`} fill="#EEF4F9" opacity={0.28} />
            </g>
          );
        })}
        <path d="M -124 34 q 32 -30 124 -30 q 92 0 124 30 l 0 140 l -248 0 Z" fill="#CFD8E0" opacity={0.82} />
      </g>

      {/* rain running down the glass, in front of everything */}
      {Array.from({ length: 44 }).map((_, i) => {
        const x = 440 + ((i * 137) % 1040);
        const y = -380 + ((i * 271 + t * (12 + (i % 5) * 7)) % 1800);
        return <rect key={i} x={x} y={y} width={2.2} height={10 + (i % 4) * 12} rx={1.1} fill="#CFE6FF" opacity={0.13} />;
      })}
    </g>
  );
};
// T06 · dashboard camera looking back at him, the rear bench empty
export const T06: React.FC<ShotProps> = ({ t, len }) => {
  const turn = Math.min(1, t / 26);
  const pose: Pose = {
    ...basePose,
    x: 960,
    y: 544,
    scale: 1.5,
    facing: 1,
    yaw: -0.2 + turn * 0.4,
    look: -0.4,
    expr: 'worried',
    armL: { a: 14, b: -10 },
    armR: { a: 10, b: -14 },
    legL: { a: 4, b: 2 },
    legR: { a: -4, b: 2 },
  };
  return (
    <g transform={push(t, len, 1.0, 1.03)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#050A11" />
      {/* rear window */}
      <rect x={500} y={-320} width={920} height={620} rx={28} fill="#071320" stroke="#16283A" strokeWidth={4} />
      <rect x={500} y={-30} width={920} height={2} fill="#2E4A66" opacity={0.35} />
      <circle cx={1250} cy={-52} r={5} fill={TV.amber} opacity={0.3} />
      {Array.from({ length: 34 }).map((_, i) => {
        const x = 520 + ((i * 149) % 880);
        const y = -310 + ((i * 223 + t * (10 + (i % 4) * 6)) % 600);
        return <rect key={i} x={x} y={y} width={2} height={11 + (i % 3) * 8} rx={1} fill="#CFE6FF" opacity={0.12} />;
      })}
      {/* rear bench, empty */}
      <path d="M 470 520 q 490 -48 980 0 l 0 190 l -980 0 Z" fill="#080E17" />
      <path d="M 510 522 q 450 -38 900 0" stroke="#16283A" strokeWidth={3} fill="none" opacity={0.6} />
      {/* him, turning to look back */}
      <g transform={`translate(0 ${Math.sin(t / 40) * 1.5})`}>
        <FlatHero pose={pose} look={CHARACTERS.hung.look} light={{ x: 0.12, y: -0.3, rim: 0.28, shade: 0.26, warm: "#FFE7C2" }} />
        `r`n        <path d="M 946 189 l 36 10" stroke="#B3261E" strokeWidth={6} strokeLinecap="round" />
      </g>
      {/* the seat back in front of the camera */}
      <path d="M 420 760 q 540 -64 1080 0 l 0 1160 l -1080 0 Z" fill="#070C13" />
      <path d="M 420 756 q 540 -64 1080 0" stroke="#1B2C3E" strokeWidth={3} fill="none" opacity={0.45} />
    </g>
  );
};

// T02 · 3P · from behind: the taxi's tail on a road that runs away from the camera
export const T02: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.0, 1.03)}>
    <RoadV t={t} rain={0.9} speed={0.55} lamps={4} />
    <g transform={`translate(${940 + Math.sin(t / 60) * 4} 1010)`}>
      {/* ground shadow */}
      <ellipse cx={0} cy={104} rx={196} ry={24} fill="#000" opacity={0.6} />
      {/* body, seen from the back: wider at the bumper than at the roof */}
      <path d="M -150 -46 q 6 -58 44 -66 l 24 -6 q 26 -14 82 -14 q 56 0 82 14 l 24 6 q 38 8 44 66 l 8 118 q -2 18 -22 18 l -264 0 q -20 0 -22 -18 Z" fill="#0A1220" />
      {/* rear window + roof rim */}
      <path d="M -112 -44 q 8 -40 38 -46 l 14 -3 q 24 -10 60 -10 q 36 0 60 10 l 14 3 q 30 6 38 46 Z" fill="#060B12" />
      <path d="M -112 -44 q 8 -40 38 -46 l 14 -3 q 24 -10 60 -10 q 36 0 60 10 l 14 3 q 30 6 38 46" fill="none" stroke={TV.cyan} strokeWidth={3.2} opacity={0.34} />
      {/* roof sign, seen edge-on from behind */}
      <rect x={-30} y={-118} width={60} height={18} rx={4} fill={TV.amber} opacity={0.95} />
      <rect x={-30} y={-106} width={60} height={4} rx={2} fill="#7A4E12" opacity={0.7} />
      {/* boot seam + bumper */}
      <path d="M -132 22 l 264 0" stroke="#16222F" strokeWidth={3} />
      <rect x={-146} y={56} width={292} height={34} rx={10} fill="#070D16" />
      {/* plate, centred, legible */}
      <rect x={-62} y={62} width={124} height={24} rx={3} fill="#DDE4EA" opacity={0.92} />
      <text x={0} y={79} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={15} fill="#0A1119">
        51B-234.56
      </text>
      {/* tail lights: amber, never red (red is blood only) */}
      <rect x={-136} y={-6} width={34} height={44} rx={8} fill={TV.amber} opacity={0.55} />
      <rect x={102} y={-6} width={34} height={44} rx={8} fill={TV.amber} opacity={0.55} />
      <rect x={-132} y={-2} width={26} height={16} rx={5} fill="#FFE3A6" opacity={0.5} />
      <rect x={106} y={-2} width={26} height={16} rx={5} fill="#FFE3A6" opacity={0.5} />
      {/* wheels, only the outer edge shows from behind */}
      <rect x={-158} y={78} width={22} height={36} rx={6} fill="#04070C" />
      <rect x={136} y={78} width={22} height={36} rx={6} fill="#04070C" />
      {/* warm spill on the wet road behind the car */}
      <ellipse cx={0} cy={112} rx={150} ry={18} fill={TV.amber} opacity={0.05} />
    </g>
  </g>
);

// T01 / T33 · cards, drawn in the vertical window
export const T01: React.FC<ShotProps> = ({ t }) => (
  <g>
    <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} fill="#000" />
    {t >= 6 * 30 && t < 9 * 30 ? (
      <text x={960} y={548} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={54} letterSpacing={12} fill="#E9F1F8" opacity={0.92}>
        23:34
      </text>
    ) : null}
  </g>
);

export const T33: React.FC<ShotProps> = () => <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} fill="#000" />;

/** Everything not drawn yet: a card that names the shot, so the board never lies. */
const pending = (id: string, label: string): React.FC<ShotProps> => () => (
  <g>
    <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} fill="#05080F" />
    <rect x={CARD.x + 40} y={CARD.y + 40} width={CARD.w - 80} height={CARD.h - 80} fill="none" stroke="#12202E" strokeWidth={2} />
    <text x={960} y={930} textAnchor="middle" fontFamily={FONT} fontSize={64} letterSpacing={8} fill="#1E3247">
      {id}
    </text>
    <text x={960} y={986} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={22} letterSpacing={3} fill="#22384D">
      CHƯA DỰNG · {label}
    </text>
  </g>
);

export const SHOTS: Record<string, React.FC<ShotProps>> = {
  T01,
  T02,
  T03,
  T04,
  T05: T05,
  T06,
  T07: pending('T07', 'POV-W'),
  T08: pending('T08', '3P hông xe'),
  T09: T09,
  T10: pending('T10', 'INS điện thoại'),
  T11: pending('T11', 'POV-CAM'),
  T12: pending('T12', 'POV-CAM va chạm'),
  T13: pending('T13', '3P cabin'),
  T14: pending('T14', '3P wide'),
  T15: pending('T15', 'POV-H KM17'),
  T16: pending('T16', '3P wide'),
  T17: pending('T17', 'POV-H phanh'),
  T18: pending('T18', '3P đèn pin'),
  T19: pending('T19', 'INS bánh xe'),
  T20: pending('T20', 'POV-HW cống'),
  T21: pending('T21', '3P sau lưng'),
  T22: pending('T22', '3P hai người'),
  T23: pending('T23', 'POV-CAM đâm cây'),
  T24: pending('T24', 'INS tay áo'),
  T25: pending('T25', '3P xe nát'),
  T26: pending('T26', 'POV-HW biển số'),
  T27: pending('T27', 'INS gương nát'),
  T28: pending('T28', 'POV-HW mặt'),
  T29: pending('T29', '3P khuỵu'),
  T30: pending('T30', '3P xe hiện lại'),
  T31: pending('T31', 'POV-W đồng hồ'),
  T32: pending('T32', 'INS bàn chân'),
  T33,
};
