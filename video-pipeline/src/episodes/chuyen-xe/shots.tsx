import React from 'react';
import { basePose, CHARACTERS, FlatHero, flatHandL, flatHandR, Pose, ShotProps, push } from '../../engine';
import { BackOfDriver, BigMirror, BloodDrop, CabinV, Clock, DashcamHud, DashcamRearEmpty, DriverAtWheel, Mirror, MirrorV, PhoneHeld, RadioPanel, RoadV, TaxiSide, TV, VideoNoise, Wheel, WheelHand, WomanInGlass } from '../../engine/taxi';


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
      <WheelHand x={760} y={1308} s={1.6} rot={14} flip />
      <WheelHand x={1160} y={1308} mirror s={1.6} rot={-14} flip torn />
      {/* the near rim passes in front of the palms */}
      <path d="M 620 1280 A 340 150 0 0 1 1300 1280" stroke="#1B2838" strokeWidth={40} fill="none" strokeLinecap="round" />
      <Clock text="23:34" x={1290} y={1178} />
      <MirrorV t={t} occupant="none" />
      {/* blood: a smear at the very front of the lens, out of focus, running down from the brow */}
      <g opacity={0.55}>
        <path d="M 560 -420 q 26 120 16 240 q -8 90 -30 170 l 46 -26 q 24 -120 18 -220 q -6 -90 -18 -164 Z" fill="#B3261E" />
        <path d="M 606 -160 q 10 60 2 120 l 18 -12 q 6 -60 -6 -110 Z" fill="#8E1B15" opacity={0.7} />
      </g>
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
        {/* forearm running out of the bottom-left frame edge, with a sleeve */}
        <path d="M 900 700 Q 760 900 700 1080 L 640 1380 L 420 1420 L 420 1500 L 760 1480 Q 860 1200 960 1020 Z" fill="#10141B" />
        <path d="M 700 1080 L 640 1380 L 420 1420 L 420 1340 L 660 1320 Q 780 1200 830 1060 Z" fill="#0B0F14" opacity={0.55} />
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
    <WheelHand x={760} y={1308} s={1.6} rot={14} flip />
    <WheelHand x={1160} y={1308} mirror s={1.6} rot={-14} flip torn />
    {/* the near rim passes in front of the palms */}
    <path d="M 620 1280 A 340 150 0 0 1 1300 1280" stroke="#1B2838" strokeWidth={40} fill="none" strokeLinecap="round" />
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
        {/* thumb, angled away on the right */}
        <g transform="rotate(16 150 40)">
          <rect x={132} y={-64} width={42} height={120} rx={21} fill="#D5DDE5" opacity={0.88} />
          <rect x={132} y={-64} width={42} height={26} rx={13} fill="#EEF4F9" opacity={0.3} />
        </g>
      </g>

      {/* rain running down the glass, in front of everything */}
      {Array.from({ length: 44 }).map((_, i) => {
        const x = 440 + ((i * 137) % 1040);
        const y = -380 + ((i * 271 + t * (12 + (i % 5) * 7)) % 1800);
        return <rect key={i} x={x} y={y} width={2.2} height={10 + (i % 4) * 12} rx={1.1} fill="#CFE6FF" opacity={0.13} />;
      })}
      {/* the rear window: rubber frame + sill, so she is pressed against a real window */}
      <path d="M 430 -414 Q 960 -400 1490 -414 L 1490 1490 Q 960 1476 430 1490 Z" fill="none" stroke="#0A121C" strokeWidth={34} />
      <path d="M 430 -420 L 1490 -420 L 1490 -330 Q 960 -300 430 -330 Z" fill="#080F17" opacity={0.9} />
      <path d="M 430 1240 Q 960 1210 1490 1240 L 1490 1490 L 430 1490 Z" fill="#080F17" opacity={0.9} />
    </g>
  );
};
// T06 · dashboard camera looking back at him, the rear bench empty
export const T06: React.FC<ShotProps> = ({ t, len }) => {
  const turn = Math.min(1, t / 26);
  const pose: Pose = {
    ...basePose,
    x: 960,
    y: 800,
    scale: 3.5,
    facing: 1,
    yaw: -0.2 + turn * 0.4,
    look: -0.4,
    expr: 'neutral',
    armL: { a: 8, b: -18 },
    armR: { a: 6, b: -20 },
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
      {/* him, at the wheel, turning to look back */}
      <g transform={`translate(0 ${Math.sin(t / 40) * 1.5})`}>
        <DriverAtWheel
          t={t}
          pose={pose}
          look={{ ...CHARACTERS.hung.look, browStraight: true }}
          light={{ x: 0.12, y: -0.3, rim: 0.28, shade: 0.26, warm: '#FFE7C2' }}
        />
        <path d="M 934 104 l 44 12" stroke="#B3261E" strokeWidth={8} strokeLinecap="round" />
      </g>
      <rect x={420} y={1250} width={1080} height={700} fill="#070C13" />
    </g>
  );
};

// T07 · POV-W · over his shoulder: the mirror hands his own fear back to him
export const T07: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.0, 1.02)}>
    <RoadV t={t} rain={0.8} speed={0.5} lamps={3} />
    <CabinV t={t} speed={0.5} wheel={Math.sin(t / 44) * 1.6} />
    {/* the mirror, and his eyes in it: for once he is the one being looked back at */}
    <BigMirror t={t} occupant="hung" x={760} y={-220} w={560} h={250} />
    {/* his two hands on the rim, seen over his shoulder */}
    <WheelHand x={760} y={1308} s={1.6} rot={14} flip />
    <WheelHand x={1160} y={1308} mirror s={1.6} rot={-14} flip torn />
    {/* and him between us and the road: no face, only the back of the head and the shoulders */}
    <BackOfDriver x={980} y={1300} s={1.02} />
  </g>
);

// T08 · 3P · the taxi in profile, in the rain, her bowed head inside the mirror
export const T08: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.0, 1.05)}>
    <TaxiSide t={t} speed={0.62} rain={0.9} driver mirror="woman" x={950} y={60} s={1.3} />
    {/* rain past the lens, in front of the car */}
    {Array.from({ length: 90 }).map((_, i) => {
      const x = 420 + ((i * 173) % 1120);
      const y = -420 + ((i * 311 + t * (820 + (i % 5) * 240)) % 2400);
      return <line key={i} x1={x} y1={y} x2={x - 14} y2={y + 60} stroke="#CFE6FF" strokeWidth={2} opacity={0.06 + (i % 4) * 0.03} />;
    })}
  </g>
);

// T10 · INS · phone in hand, dashcam app opening, only screen light
export const T10: React.FC<ShotProps> = ({ t, len }) => {
  const fade = Math.min(1, t / 18);
  const tap = t > len * 0.45 ? 1 : 0;
  return (
    <g transform={push(t, len, 1.0, 1.03)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#020407" />
      {/* faint rain on the side window behind, barely caught by screen light */}
      {Array.from({ length: 26 }).map((_, i) => {
        const x = 430 + ((i * 151) % 1060);
        const y = -420 + ((i * 277 + t * 40) % 2000);
        return <rect key={i} x={x} y={y} width={2} height={12 + (i % 4) * 10} rx={1} fill="#7FE8FF" opacity={0.03} />;
      })}
      {/* cold spill from the screen onto the cabin void */}
      <ellipse cx={940} cy={760} rx={380} ry={460} fill="#7FE8FF" opacity={0.07 * fade} />

      <PhoneHeld x={720} y={280} w={420} rot={-6}>
        <rect width={382} height={787} fill="#040A12" />
        {/* dashcam app opening */}
        <rect x={24} y={40} width={334} height={60} rx={10} fill="#0C1A28" />
        <circle cx={54} cy={70} r={10} fill="#7FE8FF" opacity={0.8} />
        <text x={76} y={78} fontFamily="ui-monospace, Consolas, monospace" fontSize={22} letterSpacing={2} fill="#CFE6FF" opacity={0.9}>CAMERA HÀNH TRÌNH</text>
        <rect x={24} y={130} width={334} height={420} rx={8} fill="#050B12" stroke="#163048" strokeWidth={2} />
        {/* a live preview suggestion: dark road streaks */}
        <rect x={24} y={300} width={334} height={120} fill="#07131F" />
        <path d={`M ${191 + Math.sin(t / 18) * 14} 360 L 120 520 L 262 520 Z`} fill="#0B1E30" opacity={0.7} />
        <circle cx={191} cy={520} r={5} fill="#E24B3B" opacity={0.75 + 0.25 * Math.sin(t / 7)} />
        <text x={206} y={526} fontFamily="ui-monospace, Consolas, monospace" fontSize={16} fill="#E24B3B" opacity={0.85}>REC</text>
        <rect x={54} y={590} width={274} height={64} rx={32} fill={tap ? '#163048' : '#0C1A28'} stroke="#2A4A66" strokeWidth={2} />
        <text x={191} y={630} textAnchor="middle" fontFamily="ui-monospace, Consolas, monospace" fontSize={24} fill="#EAF4FF" opacity={0.95}>MỞ VIDEO</text>
        {/* thumb reaching to tap */}
        <g transform={`translate(${tap ? 210 : 250} ${tap ? 610 : 700}) rotate(-18)`} opacity={0.85}>
          <ellipse cx={0} cy={0} rx={34} ry={22} fill="#9B7656" />
        </g>
        <VideoNoise w={382} h={787} t={t} o={0.6} />
      </PhoneHeld>

      {/* left hand gripping the phone: fingers along left edge, torn red knuckles lit by screen */}
      <g transform="translate(705 520) rotate(-6)">
        {/* sleeve edge */}
        <path d="M -40 260 L 40 260 L 30 420 L -30 420 Z" fill="#0B0F14" />
        {/* fingers curling over the phone edge */}
        {[0, 1, 2, 3].map((i) => {
          const y = 20 + i * 92;
          return (
            <g key={i} transform={`translate(18 ${y})`}>
              <rect x={-18} y={-26} width={72} height={52} rx={22} fill="#8A6448" />
              <rect x={-8} y={-18} width={30} height={36} rx={12} fill="#9B7656" opacity={0.55} />
              {/* torn red skin on the knuckles */}
              <path d={`M ${-6 + (i % 2) * 8} ${-10} l 16 6 l -6 10 l -14 -4 Z`} fill="#B3261E" opacity={0.85} />
              <path d={`M ${4 + (i % 2) * 4} ${2} l 10 -2`} stroke="#7A1410" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
            </g>
          );
        })}
        {/* thumb on the near side */}
        <g transform="translate(56 420) rotate(22)">
          <rect x={-16} y={-70} width={36} height={90} rx={18} fill="#8A6448" />
          <path d="M -4 -40 l 18 8 l -8 12" fill="#B3261E" opacity={0.75} />
        </g>
      </g>

      {/* right thumb tapping from below-right edge */}
      <g transform={`translate(1110 ${tap ? 760 : 820}) rotate(18)`} opacity={0.55}>
        <rect x={-18} y={-90} width={40} height={140} rx={20} fill="#7A583E" />
      </g>
    </g>
  );
};

// T11 · POV-CAM · phone playback: rear bench completely empty, but her voice in the audio
export const T11: React.FC<ShotProps> = ({ t, len }) => {
  const scrubbing = t < len * 0.35;
  const progress = scrubbing ? 0.25 + (t / (len * 0.35)) * 0.15 : 0.42;
  return (
    <g transform={push(t, len, 1.0, 1.02)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#020407" />
      <ellipse cx={960} cy={760} rx={420} ry={520} fill="#7FE8FF" opacity={0.06} />

      <PhoneHeld x={660} y={180} w={520} rot={-3}>
        <DashcamRearEmpty w={473} h={976} t={t} />
        <DashcamHud w={473} h={976} t={t} stamp="23:31:20" rec={false} progress={progress} />
        {/* playback UI chrome */}
        <g transform="translate(0 0)">
          <rect x={0} y={0} width={473} height={46} fill="#040A12" opacity={0.7} />
          <polygon points="26,14 26,32 42,23" fill="#EAF4FF" opacity={0.9} />
          <text x={56} y={30} fontFamily="ui-monospace, Consolas, monospace" fontSize={18} fill="#CFE6FF" opacity={0.9}>PHÁT LẠI</text>
        </g>
        {/* "audio only" hint: a small waveform at the moment her voice appears */}
        {!scrubbing ? (
          <g transform="translate(120 860)" opacity={0.5 + 0.3 * Math.sin(t / 5)}>
            {Array.from({ length: 18 }).map((_, i) => {
              const h = 6 + Math.abs(Math.sin(t / 4 + i * 0.9)) * 22;
              return <rect key={i} x={i * 14} y={-h / 2} width={6} height={h} rx={3} fill="#CFE6FF" />;
            })}
          </g>
        ) : null}
        <VideoNoise w={473} h={976} t={t} o={0.85} />
      </PhoneHeld>

      {/* fingers holding the phone at edges, lit cold */}
      <g opacity={0.7}>
        <path d="M 650 600 q -40 40 -30 120 l 30 0 q -6 -70 18 -104 Z" fill="#6E523D" />
        <path d="M 1192 620 q 36 50 22 130 l -30 0 q 8 -70 -10 -112 Z" fill="#6E523D" />
        <path d="M 700 1180 q 80 30 180 20 l -10 40 q -110 8 -190 -24 Z" fill="#5E4634" />
      </g>
    </g>
  );
};

// T12 · POV-CAM · the crash footage: red bike, living woman, Hùng still clean (pre 23:34:06)
export const T12: React.FC<ShotProps> = ({ t, len }) => {
  const impact = t > len * 0.55;
  const stamp = impact ? '23:31:40' : '23:31:08';
  return (
    <g transform={push(t, len, impact ? 1.02 : 1.0, impact ? 1.08 : 1.03)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#020407" />
      <ellipse cx={960} cy={760} rx={440} ry={540} fill="#7FE8FF" opacity={0.05} />

      <PhoneHeld x={640} y={140} w={560} rot={-2}>
        <rect width={509} height={1050} fill="#050A11" />
        {!impact ? (
          <g>
            {/* dashcam forward view: road, rain, headlights flaring, red bicycle crossing left */}
            <rect x={0} y={0} width={509} height={620} fill="#071320" />
            <rect x={0} y={420} width={509} height={220} fill="#081420" />
            <path d="M 255 420 L 60 620 L 450 620 Z" fill="#0A1C2C" opacity={0.7} />
            {/* headlight flare on wet road */}
            <ellipse cx={255} cy={560} rx={200} ry={40} fill="#F2B33D" opacity={0.16} />
            <ellipse cx={255} cy={540} rx={120} ry={22} fill="#FFE7B8" opacity={0.12} />
            {/* red bicycle crossing from left - the only red in frame */}
            <g transform={`translate(${140 + t * 1.8} 500) rotate(${-18 - t * 0.15})`} opacity={0.95}>
              <circle cx={-46} cy={0} r={28} fill="none" stroke="#C0392B" strokeWidth={6} />
              <circle cx={46} cy={0} r={28} fill="none" stroke="#C0392B" strokeWidth={6} />
              <path d="M -46 0 L 0 -34 L 46 0 L 0 10 Z" fill="none" stroke="#C0392B" strokeWidth={6} strokeLinejoin="round" />
              <line x1={0} y1={-34} x2={-6} y2={-52} stroke="#C0392B" strokeWidth={5} />
              <rect x={-18} y={-58} width={36} height={6} rx={3} fill="#C0392B" />
            </g>
            {/* woman thrown toward drain mouth at roadside, living, dark jacket */}
            <g transform={`translate(${320 + t * 0.9} ${460 - Math.min(t, 40) * 0.6}) rotate(${20 + t * 0.3})`} opacity={0.9}>
              <ellipse cx={0} cy={0} rx={18} ry={26} fill="#1A2430" />
              <circle cx={-4} cy={-30} r={10} fill="#8A6448" />
              <path d="M -14 -34 q 10 -14 24 0 q -4 10 -18 8 Z" fill="#111820" />
              <rect x={-10} y={18} width={8} height={28} rx={4} fill="#1A2430" transform="rotate(30)" />
              <rect x={6} y={16} width={8} height={26} rx={4} fill="#1A2430" transform="rotate(-20)" />
            </g>
            {/* drain mouth at roadside */}
            <rect x={360} y={585} width={90} height={18} rx={3} fill="#04080E" />
            <rect x={360} y={585} width={90} height={4} fill="#16283A" opacity={0.6} />
            {/* rain streaks across lens */}
            {Array.from({ length: 40 }).map((_, i) => {
              const x = ((i * 67 + t * 18) % 520);
              const y = ((i * 143 + t * 120) % 640);
              return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 26} stroke="#CFE6FF" strokeWidth={1.4} opacity={0.12} />;
            })}
          </g>
        ) : (
          <g>
            {/* after impact: wet road, open driver door, her hand gripping trouser leg, Hùng pulling away */}
            <rect x={0} y={0} width={509} height={620} fill="#060C14" />
            <rect x={0} y={360} width={509} height={300} fill="#071018" />
            <ellipse cx={260} cy={520} rx={220} ry={50} fill="#0A1824" />
            {/* drain mouth */}
            <rect x={40} y={500} width={120} height={22} rx={3} fill="#03060A" />
            <rect x={40} y={500} width={120} height={4} fill="#16283A" opacity={0.5} />
            {/* open driver door edge */}
            <path d="M 360 180 L 500 260 L 500 640 L 320 640 Z" fill="#0A1220" stroke="#1D2A3E" strokeWidth={3} />
            {/* Hùng's leg pulling away - no wounds, clean */}
            <g transform={`translate(${300 - Math.min((t - len * 0.55) * 1.2, 40)} 520)`}>
              <path d="M 0 0 L 120 -20 L 140 30 L 10 50 Z" fill="#1A2230" />
              <rect x={110} y={-22} width={50} height={54} rx={8} fill="#20242C" />
            </g>
            {/* her hand gripping his trouser leg, pale, fingers wrapped */}
            <g transform="translate(280 505)">
              <path d="M -10 -8 q 16 -18 40 -6 q 12 10 4 24 q -18 14 -40 2 q -10 -10 -4 -20 Z" fill="#7A8896" />
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={-2 + i * 10} y={-18} width={8} height={26} rx={4} fill="#8694A2" transform={`rotate(${-10 + i * 6} ${2 + i * 10} -5)`} />
              ))}
            </g>
            {/* rain on road */}
            {Array.from({ length: 30 }).map((_, i) => {
              const x = ((i * 71 + t * 14) % 520);
              const y = ((i * 157 + t * 90) % 640);
              return <line key={i} x1={x} y1={y} x2={x - 4} y2={y + 18} stroke="#CFE6FF" strokeWidth={1.2} opacity={0.1} />;
            })}
          </g>
        )}
        <DashcamHud w={509} h={1050} t={t} stamp={stamp} rec={false} progress={impact ? 0.62 : 0.18} />
        <VideoNoise w={509} h={1050} t={t} o={0.9} />
      </PhoneHeld>

      <g opacity={0.65}>
        <path d="M 630 620 q -36 40 -26 120 l 30 0 q -6 -70 16 -104 Z" fill="#6E523D" />
        <path d="M 1210 640 q 34 50 20 130 l -30 0 q 8 -70 -10 -112 Z" fill="#6E523D" />
      </g>
    </g>
  );
};

// T13 · 3P · cabin: Hùng stares at phone, woman calm in mirror behind him
export const T13: React.FC<ShotProps> = ({ t, len }) => {
  const hung = basePose;
  return (
    <g transform={push(t, len, 1.0, 1.02)}>
      <rect x={420} y={-420} width={1080} height={1920} fill="#04080E" />
      {/* dark rear window suggestion */}
      <rect x={470} y={-300} width={980} height={520} rx={24} fill="#06101A" stroke="#16283A" strokeWidth={3} />
      {Array.from({ length: 24 }).map((_, i) => {
        const x = 490 + ((i * 157) % 940);
        const y = -290 + ((i * 211 + t * 8) % 500);
        return <rect key={i} x={x} y={y} width={2} height={10 + (i % 3) * 8} rx={1} fill="#CFE6FF" opacity={0.1} />;
      })}
      {/* empty rear bench */}
      <path d="M 470 380 q 490 -40 980 0 l 0 170 l -980 0 Z" fill="#080E17" />

      {/* mirror above/behind with the woman, calm, watching */}
      <BigMirror t={t} occupant="woman" x={760} y={-180} w={420} h={210} />

      {/* Hùng in driver seat, slumped forward staring down at phone in his hands */}
      <g transform="translate(0 40)">
        <DriverAtWheel
          t={t}
          pose={{ ...hung, x: 980, y: 760, scale: 3.3, yaw: 0.05, look: 0.7, expr: 'neutral', armL: { a: 22, b: 55 }, armR: { a: 20, b: 55 } }}
          look={{ ...CHARACTERS.hung.look, browStraight: true }}
          light={{ x: -0.2, y: 0.6, rim: 0.18, shade: 0.3, warm: '#7FE8FF' }}
          torn
        />
        {/* phone in his hands, blue-white light on his face/chest */}
        <g transform="translate(910 980) rotate(-8)">
          <rect width={120} height={210} rx={14} fill="#0A0E14" stroke="#1A2636" strokeWidth={3} />
          <rect x={8} y={8} width={104} height={194} rx={10} fill="#7FE8FF" opacity={0.85} />
          <rect x={8} y={8} width={104} height={194} rx={10} fill="#0C2234" opacity={0.35} />
        </g>
        <ellipse cx={960} cy={900} rx={180} ry={140} fill="#7FE8FF" opacity={0.08} />
      </g>
      <rect x={420} y={1280} width={1080} height={700} fill="#060A10" />
    </g>
  );
};

// T02 · 3P · from behind: the taxi's tail on a road that runs away from the camera
export const T02: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.0, 1.03)}>
    <RoadV t={t} rain={0.9} speed={0.55} lamps={4} />
    {/* headlight beams, thrown left across the wet lane */}
    <g opacity={0.45}>
      <path d="M 700 1050 L 260 960 L 180 1070 L 690 1080 Z" fill={TV.amber} opacity={0.1} />
      <path d="M 706 1076 L 340 1010 L 300 1080 L 700 1090 Z" fill="#FFE7B8" opacity={0.07} />
    </g>
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
  T07,
  T08,
  T09: T09,
  T10,
  T11,
  T12,
  T13,
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
