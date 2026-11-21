// Static character-contract gate. No TS compiler needed: this reads the source as text and checks the
// architecture that keeps a character identical from body to fingertips across scenes.
//
//   npm run check:contract
//
// FAIL = the contract is broken (a character can drift). WARN = review by eye.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = path.join(ROOT, 'src', 'engine');
const EPISODES = path.join(ROOT, 'src', 'episodes');

const issues = [];
const fail = (code, msg, fix) => issues.push({ level: 'FAIL', code, msg, fix });
const warn = (code, msg, fix) => issues.push({ level: 'WARN', code, msg, fix });

const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

// 1. source files exist ---------------------------------------------------------------------------
const metricsPath = path.join(ENGINE, 'metrics.ts');
const lookPath = path.join(ENGINE, 'look.ts');
const rigPath = path.join(ENGINE, 'rig.tsx');
const flatPath = path.join(ENGINE, 'flat.tsx');
const characterPath = path.join(ENGINE, 'character.tsx');
const taxiPath = path.join(ENGINE, 'taxi.tsx');

if (!read(metricsPath)) fail('contract.metrics_source', 'Thiếu src/engine/metrics.ts', 'Tạo module chứa BODY_METRICS/jointsFor/handAnchors.');
if (!read(lookPath)) fail('contract.look_source', 'Thiếu src/engine/look.ts', 'Tạo module chứa LOOK_SUPPORT/handSpecFor.');
const metrics = read(metricsPath) ?? '';
const look = read(lookPath) ?? '';

if (!/export\s+const\s+BODY_METRICS/.test(metrics)) fail('contract.metrics_body', 'metrics.ts không export BODY_METRICS', 'Khai báo một bảng số đo duy nhất cho cả hai rig.');
if (!/export\s+const\s+handAnchors/.test(metrics)) fail('contract.hand_anchor', 'metrics.ts không export handAnchors', 'Đạo cụ phải bám vào anchor của tay.');
if (!/export\s+const\s+LOOK_SUPPORT/.test(look)) fail('contract.look_support', 'look.ts không export LOOK_SUPPORT', 'Khai báo field nào được renderer nào tôn trọng.');
if (!/export\s+const\s+handSpecFor/.test(look)) fail('contract.hand_palette_source', 'look.ts không export handSpecFor', 'Màu tay phải lấy từ Look.');

// 2. no duplicated body constants in the renderers ------------------------------------------------
const OWNED = ['UPPER_ARM', 'FORE_ARM', 'THIGH', 'SHIN', 'SHOULDER', 'HIP', 'HEAD', 'LEG_LEN', 'FLAT_LEG_LEN'];
for (const [name, p] of [['rig.tsx', rigPath], ['flat.tsx', flatPath]]) {
  const src = read(p) ?? '';
  for (const c of OWNED) {
    if (new RegExp(`const\\s+(export\\s+)?${c}\\b`).test(src)) {
      fail('contract.metrics_duplicated', `${name} tự định nghĩa const ${c}`, `Import ${c} từ metrics.ts thay vì định nghĩa lại.`);
    }
  }
}

// 3. renderer is bound in the spec ----------------------------------------------------------------
const character = read(characterPath) ?? '';
if (!/renderer\s*\?\s*:/.test(character)) fail('contract.renderer_bind', 'CharSpec không có field renderer?', "Thêm `renderer?: 'rig' | 'flat'` vào CharSpec.");
if (!/handSpecFor|HandSpec/.test(character)) warn('contract.character_hand', 'CharacterSheet không nhắc đến HandSpec', 'Hiện bảng màu tay ngay trên character sheet.');

// 4. every declared character states its renderer -------------------------------------------------
const specBlock = character.slice(character.indexOf('CHARACTERS'), character.indexOf('characterChecklist'));
const specIds = [...specBlock.matchAll(/^\s{2}([a-zA-Z][\w-]*):\s*\{/gm)].map((m) => m[1]);
for (const id of specIds) {
  const start = specBlock.indexOf(`  ${id}: {`);
  const end = specBlock.indexOf('\n  },', start);
  const body = specBlock.slice(start, end < 0 ? undefined : end);
  if (!/renderer\s*:/.test(body)) fail('contract.spec_renderer', `CHARACTERS.${id} chưa khai báo renderer`, "Thêm `renderer: 'flat'` (hoặc 'rig') vào spec.");
}

// 5. hand components must not carry skin/sleeve hex ------------------------------------------------
const SKIN_HEX = ['#C08A63', '#A67150', '#B47A55', '#C98E68'];
const taxi = read(taxiPath) ?? '';
for (const component of ['PovArm', 'WheelHand', 'GripHand']) {
  const start = taxi.indexOf(`export const ${component}`);
  if (start < 0) { warn('contract.hand_component', `Không tìm thấy ${component}`, 'Kiểm tra lại tên component.'); continue; }
  const next = taxi.indexOf('\nexport const ', start + 10);
  const body = taxi.slice(start, next < 0 ? undefined : next);
  const hit = SKIN_HEX.filter((h) => body.includes(h));
  if (hit.length) fail('contract.hand_palette', `${component} còn hex cứng: ${hit.join(', ')}`, 'Dùng handSpecFor(look) / prop `hand`.');
  if (!/handSpecFor\(look\)/.test(body) && !/hand\s*\?\?/.test(body)) {
    fail('contract.hand_palette_source', `${component} không lấy palette từ Look`, 'Thêm prop look/hand và gọi handSpecFor.');
  }
}

// 6. shots should not position hands by magic numbers or paint them with raw hex ------------------
let shotFiles = [];
try {
  for (const slug of fs.readdirSync(EPISODES)) {
    const p = path.join(EPISODES, slug, 'shots.tsx');
    if (fs.existsSync(p)) shotFiles.push(p);
  }
} catch { /* no episodes dir */ }
for (const p of shotFiles) {
  const src = read(p);
  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!/(WheelHand|GripHand|PovArm|FlatHero|Hero)\b/.test(line)) return;
    if (/fill="#|stroke="#/.test(line)) warn('contract.raw_hex_in_shots', `${rel(p)}:${i + 1} tô màu trực tiếp trong shot`, 'Đưa màu vào Look/HandSpec.');
    if (/<WheelHand[^>]*\bx=\{\d{3,}\}\s+y=\{\d{3,}\}/.test(line)) {
      warn('contract.hand_anchor', `${rel(p)}:${i + 1} đặt tay bằng x/y cứng`, 'Dùng handAnchors(pose)/flatHandR(pose).');
    }
  });
}

// report ------------------------------------------------------------------------------------------
const fails = issues.filter((i) => i.level === 'FAIL').length;
const warns = issues.length - fails;
for (const i of issues) console.log(`[${i.level}] ${i.code} — ${i.msg}\n         fix: ${i.fix}`);
console.log(`\nCharacter contract: ${fails} fail, ${warns} warn.`);
process.exit(fails ? 1 : 0);
