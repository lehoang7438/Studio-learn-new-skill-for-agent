# NHẤT QUÁN NHÂN VẬT — Body Lock, HandSpec, PropAnchor, SceneLock

Bài toán thực tế: cùng một người, cảnh **ngoài xe** thì tay là mitten/tròn nét, cảnh **trong xe** lại là
tay 5 ngón cầm vô lăng; sang cảnh cận mặt thì silhouette đổi vì rig khác. Không phải lỗi render — là lỗi
không khoá cơ thể. Tài liệu này là hợp đồng để chặn sự "trôi" đó bằng mắt lẫn bằng static check.

> **Về các type TS bên dưới:** `BodyLock`, `PropAnchor`, `SceneLock` là **khuyến nghị / contract** để code
> hoá. Phần **đã có thật** trong engine: `src/engine/metrics.ts`, `src/engine/look.ts`
> (`LOOK_SUPPORT`, `unsupportedLookFields`, `handSpecFor`, `HandSpec`), `CharSpec.renderer?` và component
> `ContinuitySheet`. Lệnh kiểm tra có thật: `python video.py contract <slug>` và `npm run check:contract`
> (chạy trước `review`).

---

## 0. Nguồn sự thật trong engine

| File | Vai trò |
|---|---|
| `src/engine/metrics.ts` | Một nguồn số đo: `BODY_METRICS.rig`, `BODY_METRICS.flat`, `jointsFor(pose, metrics, armLen)`, `handAnchors(pose, metrics, armLen)`, `toWorld`, `handL`/`handR`, `HEAD`, `turnWidth`, `limbSpread`, `FLAT_LEG_LEN`, `FLAT_METRICS` |
| `src/engine/look.ts` | `LOOK_SUPPORT` (field của `Look` được `rig` hay `flat` tôn trọng) + `unsupportedLookFields(look, renderer)` |
| `src/engine/rig.tsx`, `flat.tsx` | Import lại từ `metrics.ts`; **không** tự định nghĩa lại hằng số |
| `src/engine/taxi.tsx` | `DriverAtWheel` — mẫu đúng: đặt vô lăng từ `handAnchors` |

Hai rig có metrics khác nhau (đùi 72/88, chân 140/172, vai 42/68, hông 17/24) và field được hỗ trợ khác nhau.
Cùng một `Look` mà đổi renderer là đổi hình học — vì vậy `renderer` phải nằm trong hợp đồng nhân vật.

---

## 1. Body Lock — một bản khắc họa cho TOÀN BỘ cơ thể

Body Lock là một object duy nhất chứa metrics + palette + các phần (đầu/tóc/thân/tay/giày) + invariants
(3 dấu nhận dạng, không đổi) + poses + `renderer`. Mọi shot chỉ **dùng lại** nó: không vẽ lại tay, không
vẽ lại chân, không đoán số đo riêng cho cảnh.

```ts
// KHUYẾN NGHỊ / CONTRACT — chưa export sẵn
type Renderer = 'rig' | 'flat';

type BodyLock = {
  id: string;
  renderer: Renderer;              // khoá cứng: đổi rig = đổi nhân vật
  metrics: BodyMetrics;            // lấy từ BODY_METRICS[renderer]
  palette: { skin: string; hand: string; jacket: string; hair: string; shoe: string };
  parts: { head: unknown; hair: unknown; torso: unknown; hand: HandSpec; shoe: unknown };
  invariants: string[];            // vd: ['mắt tròn', 'tóc rối', 'áo cam']
  poses: Record<string, Pose>;
};
```

Luật:

- Một nhân vật = **một `renderer` cho toàn phim**. Không trộn `Hero` và `FlatHero`.
- Không định nghĩa lại `THIGH/SHOULDER/HIP/HEAD` trong shot; dùng `BODY_METRICS` + `jointsFor`.
- Không gõ hex cho tay/chân trong shot; dùng palette của lock.
- `python video.py contract <slug>` bắt các lỗi tĩnh: metrics bị định nghĩa lại, thiếu `metrics.ts`/`look.ts`,
  tay dùng hex cứng, field `Look` không được renderer hỗ trợ.

---

## 2. HandSpec / PropAnchor — tay và đạo cụ

```ts
// ĐÃ EXPORT từ src/engine/look.ts — mọi màu là token lấy từ Look, không phải hex trong shot
type HandSpec = {
  skin: string;         // look.hand
  shade: string;        // look.skinShade
  forearm: string;      // look.arm ?? look.skin
  forearmShade: string; // look.skinShade
  sleeve: string;       // look.jacket
  sleeveShade: string;  // look.jacketShade
  line: string;         // look.line
};
const H = handSpecFor(look); // HAND_FALLBACK chỉ dùng khi caller quên truyền look

// KHUYẾN NGHỊ / CONTRACT — chưa export sẵn
type PropAnchor = {
  prop: 'wheel' | 'cup' | 'phone' | 'handle';
  hand: 'L' | 'R' | 'both';
  at: 'handL' | 'handR';           // từ handAnchors(pose, metrics, armLen)
  offset?: { x: number; y: number; rotate?: number; scale?: number };
};
```

Luật cứng:

- Màu tay lấy từ `look.hand` / `look.skinShade` / `look.jacket`. **Cấm hex** trong `WheelHand`,
  `GripHand`, `PovArm` và trong `shots.tsx`.
- Đạo cụ (vô lăng, ly, điện thoại, tay nắm cửa) đặt **từ `handAnchors`**. Không viết
  `x=760 y=1308 s=1.6` trong shot — pose đổi là đạo cụ bay chỗ.
- `DriverAtWheel` (`engine/taxi.tsx`) là mẫu đúng; copy cấu trúc của nó, không copy toạ độ.
- Bàn chân/bóng đổ dùng `FLAT_LEG_LEN` hoặc `BODY_METRICS`, không gõ `y` riêng cho từng cảnh.

---

## 3. SceneLock — một ánh sáng cho set + nhân vật + prop

```ts
// KHUYẾN NGHỊ / CONTRACT — chưa export sẵn
type SceneLock = {
  id: string;
  light: { x: number; y: number; rim: number; shade: number; warm: string };
  background: unknown;
  ground: { y: number; shadow: number };
  setProps: PropAnchor[];
};
```

Hiện tại set tự gradient, nhân vật tự nhận light riêng → cùng cảnh mà hướng sáng không khớp. SceneLock
buộc **một object light dùng chung** cho cả ba lớp. Dựng set **rỗng** (`empty set`) trước khi đặt nhân vật
vào (cổng G2): nếu set rỗng đã đọc được "ở đâu, lúc nào", thêm nhân vật sẽ không làm sai bố cục.

---

## 4. ContinuitySheet — dải so sánh 4 ngữ cảnh

Xếp cùng một nhân vật cạnh nhau ở:

| 1. Ngoài xe | 2. Trong xe | 3. Cận mặt | 4. Tay cầm đồ |
|---|---|---|---|
| toàn thân, ánh sáng trời | ghế lái, vô lăng, light lạnh | mắt, tóc, lông mày | tay + prop từ `handAnchors` |

Căn theo **hông + đầu** (cùng scale), rồi nhìn đường mắt: nếu mắt/lông mày lệch lên xuống giữa 4 khung
là drift. Component `ContinuitySheet` (**đã export** từ `src/engine`) dựng đúng 4 khung này từ một
`CharSpec`; chưa có lệnh CLI riêng, nên đặt nó vào một shot rồi chụp still như thường.

---

## 5. Lỗi → nguyên nhân → cách chặn

| Lỗi | Nguyên nhân | Cách chặn |
|---|---|---|
| Tay mitten ngoài xe / tay 5 ngón trong xe | Mỗi shot vẽ tay riêng, không có `HandSpec` | Một `HandSpec` trong Body Lock; cấm hex trong shot; `contract` + G3 |
| Nhân vật đổi silhouette giữa cảnh | Trộn `Hero`/`FlatHero`, hoặc metrics định nghĩa lại | Khoá `renderer`; chỉ dùng `BODY_METRICS`; `contract` + G1 |
| Vai/hông lệch dù cùng pose | Gõ lại `SHOULDER/HIP` trong rig hoặc shot | `jointsFor`, `handAnchors` từ `metrics.ts`; G1 |
| Vô lăng/ly/điện thoại "bay" | Toạ độ cứng `x=… y=… s=…` trong shot | `PropAnchor` từ `handAnchors`; mẫu `DriverAtWheel`; G3 |
| Set sáng một phía, nhân vật sáng phía khác | Set gradient riêng, character light riêng | `SceneLock`: một light cho set + nhân vật + prop; G2 |
| Field spec "có mà không ăn" | `Look` dùng field renderer không hỗ trợ | `LOOK_SUPPORT` / `unsupportedLookFields`; `contract` |
| Cùng phim dùng 2 renderer | Copy shot cũ từ episode khác | `renderer` là field bắt buộc của Body Lock; G0 + G4 |

---

## 6. Năm cổng G0..G4

| Cổng | Kiểm tra | Chặn | Artifact / lệnh |
|---|---|---|---|
| **G0** Setup + style lock | Khoá slug, 9:16, 30fps, style, **`renderer`** | Đổi rig giữa chừng, set nhầm cỡ | `project.json` + `python video.py validate <slug>` |
| **G1** Body lock sheet | 4 góc nhìn, metrics/palette/invariants khớp ảnh/tài liệu | Silhouette trôi, mắt/tóc sai | `CharacterSheet` + `reference/character-ref.md` |
| **G2** Scene lock / empty set | Set rỗng đọc được bối cảnh; một light chung | Ánh sáng set ≠ nhân vật, prop lạc đề | SceneLock + stills |
| **G3** Continuity strip | 4 ngữ cảnh cạnh nhau, căn hông + đầu | Tay/chân/đạo cụ đổi giữa cảnh | `ContinuitySheet` (bằng mắt) |
| **G4** Contract + review | `contract` sạch, `review` 0 FAIL | Field không ăn, metrics trùng, caption/audio lỗi | `python video.py contract <slug>` → `python video.py review <slug>` |

G5 (mix/audio) và G6 (render/pack) nằm trong `SKILL.md` và `reference/qa.md`.
