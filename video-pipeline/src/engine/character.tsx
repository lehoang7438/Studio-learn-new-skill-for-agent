import React from 'react';
import { staticFile } from 'remotion';
import { clamp } from './anim';
import { FONT } from './fonts';
import { basePose, Look, Pose } from './rig';
import { FLAT_LEG_LEN, FlatHero, FLAT_METRICS } from './flat';

// Character reference, the drawn way. A reference image is a contract: palette, proportions and the
// two or three shapes that make a face recognisable. `CharSpec` is that contract written down once;
// `CharacterSheet` draws it back in four views so it can be held next to the image before a single
// shot is built. Every shot imports the same spec, so the character cannot drift between scenes.

export type Swatch = { hex: string; use: string };

export type CharSpec = {
  id: string;
  name: string;
  /** One line printed on the sheet: who this is, and what must never change. */
  note?: string;
  look: Look;
  /** 5–7 colours read off the reference image, with the part they belong to. */
  palette: Swatch[];
  /** Where the reference image lives (public/<slug>/ref/...), for the side-by-side check. */
  ref?: string;
};

/** The flat-vector cast, read off the two reference frames: warm skin, orange tee with short sleeves,
 *  bare arms, denim legs, cream shoes, deep teal walls; and the night passenger with wire glasses. */
export const CHARACTERS: Record<string, CharSpec> = {
  nam: {
    id: 'nam',
    name: 'NAM',
    note: '17 tuổi · tóc rối · mắt tròn · áo thun cam · quần bò',
    look: {
      skin: '#DFAE83',
      skinShade: '#C68F63',
      hand: '#DFAE83',
      arm: '#DFAE83',
      jacket: '#C8702B',
      jacketShade: '#A8581F',
      accent: '#E8A03A',
      limb: '#33414F',
      leg: '#33414F',
      line: '#2A1C1A',
      shoe: '#DDD2B8',
      face: '#2B1D1B',
      hair: '#3A2520',
      extra: 'messy',
      eyes: 'round',
      sleeve: 0.46,
    },
    palette: [
      { hex: '#DFAE83', use: 'da' },
      { hex: '#C68F63', use: 'da · bóng' },
      { hex: '#3A2520', use: 'tóc' },
      { hex: '#C8702B', use: 'áo thun' },
      { hex: '#33414F', use: 'quần bò' },
      { hex: '#E8E0CE', use: 'giày' },
    ],
    ref: 'ref-nhan-vat/ref/ref-01.png',
  },
  ong: {
    id: 'ong',
    name: 'ÔNG KHÁCH',
    note: '60 tuổi · kính gọng mảnh · tóc bạc rẽ ngôi · áo khoác tối · ghế 5',
    look: {
      skin: '#D6C2AB',
      skinShade: '#B49B80',
      hand: '#D6C2AB',
      arm: '#D6C2AB',
      jacket: '#2C3547',
      jacketShade: '#1E2533',
      accent: '#7E93B8',
      limb: '#2C3547',
      leg: '#2C3547',
      line: '#151A24',
      shoe: '#1A1F2A',
      face: '#2A2018',
      hair: '#8F8F96',
      extra: 'slick',
      eyes: 'round',
      glassesStyle: 'clear',
      headR: 56,
      longFace: true,
    },
    palette: [
      { hex: '#D6C2AB', use: 'da' },
      { hex: '#8F8F96', use: 'tóc bạc' },
      { hex: '#1B2230', use: 'gọng kính' },
      { hex: '#2C3547', use: 'áo khoác' },
      { hex: '#DAD6CA', use: 'cổ áo' },
      { hex: '#C9CDD6', use: 'ghế · HUD' },
    ],
    ref: 'ref-nhan-vat/ref/ref-02.png',
  },
  /** Chuyến xe: the driver. Same flat body as the reference cast — round eyes, thick brows, short
   *  black hair — but the palette is night: black jacket, no warm accent, a cut on the right brow. */
  hung: {
    id: 'hung',
    name: 'HÙNG',
    note: '35 tuổi · tóc đen cắt sát · áo khoác đen · mắt mệt · sẹo trán phải',
    look: {
      skin: '#C08A63',
      skinShade: '#A67150',
      hand: '#C08A63',
      arm: '#C08A63',
      jacket: '#181C24',
      jacketShade: '#0D1117',
      accent: '#2C3444',
      limb: '#10141A',
      leg: '#0E1218',
      line: '#05070A',
      shoe: '#0B0F14',
      face: '#0A0E15',
      hair: '#12151C',
      extra: 'short',
      eyes: 'round',
      brow: 1,
      browStraight: true,
      armLen: 1.35,
      sleeve: 0,
    },
    palette: [
      { hex: '#C08A63', use: 'da' },
      { hex: '#A67150', use: 'da · bóng' },
      { hex: '#12151C', use: 'tóc' },
      { hex: '#181C24', use: 'áo khoác' },
      { hex: '#0E1218', use: 'quần' },
      { hex: '#0B0F14', use: 'giày' },
    ],
  },
};

/** Four views, a palette and the proportions: the page you hold next to the reference image. */
export const CharacterSheet: React.FC<{
  spec: CharSpec;
  t?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  bg?: string;
  /** Ảnh tham chiếu (đường dẫn trong public/) in ngay trên bảng, để đối chiếu bằng mắt. */
  refImage?: string;
  /** Vùng cắt của ảnh tham chiếu trong file gốc: x y w h. */
  refCrop?: [number, number, number, number];
}> = ({ spec, t = 0, x = 420, y = -400, w = 1080, h = 1880, bg = '#14171C', refImage, refCrop = [50, 20, 360, 470] }) => {
  const S = spec.look;
  const inner = w - 88;
  const colW = inner / 4;
  const ground = 1150;
  const figTop = 330;
  const scale = 1.5;
  const hipY = ground - FLAT_LEG_LEN * scale;
  const blink = t % 96 > 91 ? 1 : 0;
  const colX = (i: number) => 44 + colW * (i + 0.5);

  const view = (i: number, yaw: number, extra: Partial<Pose> = {}, s = scale, hip = hipY) => ({
    ...basePose,
    x: colX(i),
    y: hip,
    scale: s,
    yaw,
    expr: 'neutral' as const,
    blink,
    headTilt: i === 1 ? 2 : i === 2 ? -2 : 0,
    armL: { a: 12, b: -8 },
    armR: { a: 12, b: -8 },
    legL: { a: -6, b: 0 },
    legR: { a: 6, b: 0 },
    ...extra,
  });

  // the close-up is clipped to its own column, so a huge head never spills into the palette
  const clipId = `charSheetClip-${spec.id}`;
  const closeScale = 3.3;
  const closeHip = 760 + 176 * closeScale;

  const label = (i: number, text: string) => (
    <text
      key={`l${i}`}
      x={colX(i)}
      y={figTop - 34}
      textAnchor="middle"
      fontFamily={FONT.ui}
      fontSize={19}
      letterSpacing={3}
      fill="#7C8794"
    >
      {text}
    </text>
  );

  const swW = (inner - 5 * 12) / 6;

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={clipId}>
          <rect x={colX(3) - colW / 2} y={figTop} width={colW} height={ground - figTop} />
        </clipPath>
      </defs>

      {/* the page */}
      <rect x={0} y={0} width={w} height={h} fill={bg} />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`g${i}`} x1={0} y1={260 + i * 130} x2={w} y2={260 + i * 130} stroke="#FFFFFF" strokeWidth={1} opacity={0.035} />
      ))}
      <rect x={0} y={0} width={w} height={8} fill={S.jacket} />

      <text x={44} y={54} fontFamily={FONT.ui} fontSize={19} letterSpacing={4} fill="#7C8794">
        CHARACTER SHEET · KHỚP ẢNH THAM CHIẾU
      </text>
      <text x={44} y={136} fontFamily={FONT.title} fontSize={82} fill="#F4EEE2" letterSpacing={2}>
        {spec.name}
      </text>
      <text x={44} y={186} fontFamily={FONT.body} fontSize={25} fill="#9AA6B4">
        {spec.note}
      </text>
      <line x1={44} y1={222} x2={w - 44} y2={222} stroke="#2A303A" strokeWidth={2} />

      {/* the four views */}
      {label(0, 'MẶT TRƯỚC')}
      {label(1, '3/4')}
      {label(2, 'NGHIÊNG')}
      {label(3, 'CẬN MẶT')}
      <FlatHero pose={view(0, 0)} look={S} shadow={0} light={{ x: -0.55, y: -0.5, rim: 0.45, shade: 0.35, warm: '#FFF4E0' }} />
      <FlatHero pose={view(1, 0.36)} look={S} shadow={0} light={{ x: -0.55, y: -0.5, rim: 0.45, shade: 0.35, warm: '#FFF4E0' }} />
      <FlatHero pose={view(2, 0.95)} look={S} shadow={0} light={{ x: -0.55, y: -0.5, rim: 0.45, shade: 0.35, warm: '#FFF4E0' }} />
      <g clipPath={`url(#${clipId})`}>
        <FlatHero pose={view(3, 0.06, { headTilt: 1 }, closeScale, closeHip)} look={S} shadow={0} light={{ x: -0.55, y: -0.5, rim: 0.45, shade: 0.35, warm: '#FFF4E0' }} />
      </g>
      <line x1={44} y1={ground + 4} x2={w - 44} y2={ground + 4} stroke="#2A303A" strokeWidth={2} />

      {/* the proportions, read off the rig */}
      <g transform={`translate(${44} ${ground + 52})`}>
        <text fontFamily={FONT.ui} fontSize={18} letterSpacing={3} fill="#7C8794">
          TỈ LỆ
        </text>
        <text y={32} fontFamily={FONT.body} fontSize={24} fill="#C9D2DC">
          Đầu ≈ 1/3 chiều cao · vai {FLAT_METRICS.shoulder * 2} · hông {FLAT_METRICS.hip * 2} · đầu{' '}
          {(S.headR ?? FLAT_METRICS.headR) * 2}
        </text>
      </g>

      {/* the palette */}
      <g transform={`translate(${44} ${ground + 150})`}>
        <text fontFamily={FONT.ui} fontSize={18} letterSpacing={3} fill="#7C8794">
          BẢNG MÀU — ĐỌC TỪ ẢNH
        </text>
        {spec.palette.slice(0, 6).map((p, i) => (
          <g key={p.hex} transform={`translate(${i * (swW + 12)} 24)`}>
            <rect width={swW} height={120} rx={10} fill={p.hex} stroke="#000" strokeWidth={2} opacity={0.98} />
            <text y={150} fontFamily={FONT.ui} fontSize={17} fill="#E6EDF5">
              {p.hex}
            </text>
            <text y={176} fontFamily={FONT.body} fontSize={18} fill="#7C8794">
              {p.use}
            </text>
          </g>
        ))}
      </g>

      {/* the reference, next to what we drew: the only honest way to say "it looks like the image" */}
      {refImage ? (
        <g transform="translate(44 1546)">
          <text fontFamily={FONT.ui} fontSize={16} letterSpacing={3} fill="#7C8794">
            ẢNH THAM CHIẾU
          </text>
          <svg x={0} y={14} width={127} height={166} viewBox={`${refCrop[0]} ${refCrop[1]} ${refCrop[2]} ${refCrop[3]}`} preserveAspectRatio="xMidYMid slice">
            <image href={staticFile(refImage)} width={refCrop[2] + refCrop[0]} height={refCrop[3] + refCrop[1]} />
          </svg>
          <rect x={0} y={14} width={127} height={166} rx={8} fill="none" stroke="#2A303A" strokeWidth={2} />
          <g transform="translate(157 20)">
            <text fontFamily={FONT.ui} fontSize={16} letterSpacing={3} fill={S.jacket}>
              ĐỐI CHIẾU
            </text>
            {['mắt tròn, lông mày đậm', 'tóc rối, mái lệch', 'áo thun cam, tay ngắn', 'quần bò xanh, giày kem'].map((line, i) => (
              <g key={line} transform={`translate(0 ${34 + i * 34})`}>
                <text fontFamily={FONT.body} fontWeight={600} fontSize={24} fill={S.jacket}>
                  ✓
                </text>
                <text x={30} fontFamily={FONT.body} fontSize={22} fill="#C9D2DC">
                  {line}
                </text>
              </g>
            ))}
          </g>
        </g>
      ) : null}

      {/* the rule that makes the sheet worth drawing */}
      <g transform={`translate(44 ${h - 96})`}>
        <rect x={0} y={-40} width={inner} height={92} rx={14} fill="#1B2027" stroke={S.jacket} strokeWidth={3} />
        <text x={24} y={-4} fontFamily={FONT.ui} fontSize={18} letterSpacing={3} fill={S.accent}>
          LUẬT
        </text>
        <text x={24} y={32} fontFamily={FONT.body} fontSize={23} fill="#F4EEE2">
          Mọi cảnh import cùng một spec — không đổi màu, không đổi mắt theo cảnh.
        </text>
      </g>

      {spec.ref ? (
        <text x={w - 44} y={54} textAnchor="end" fontFamily={FONT.ui} fontSize={17} fill="#5E6874">
          REF: {spec.ref}
        </text>
      ) : null}

      {/* a slow pulse, so a still of the sheet is never a dead frame */}
      <rect x={0} y={h - 8} width={clamp((t % 120) / 120) * w} height={8} fill={S.accent} opacity={0.85} />
    </g>
  );
};
