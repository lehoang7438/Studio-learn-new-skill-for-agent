# PROMPT PACK — ảnh tham chiếu & plate

Pipeline vẽ bằng SVG, nên ảnh tạo ra ở đây dùng cho **một trong ba việc**:

1. **Tham chiếu bố cục** để dựng lại bằng component (khuyến nghị — giữ được 100% nhất quán).
2. **Plate nền** (ảnh tĩnh) đặt dưới lớp SVG, khi cần chất liệu thật.
3. **Storyboard gửi duyệt** trước khi làm shot.

Nếu dùng làm plate: lưu vào `public/<slug>/bg/`, gọi bằng `staticFile('<slug>/bg/ten.png')` trong `<image href>`.
Ảnh phải đúng **1080x1920**, tối, ít chi tiết ở vùng caption.

---

## 0. Khối style dùng chung

Dán vào cuối mọi prompt:

```
STYLE: cinematic 2D animation, flat vector shapes with soft gradients, night scene,
deep navy palette (#05080F #0A1730 #122A4A), warm amber practical lights (#F2B33D),
cold moonlight rim (#BFD9FF), heavy rain on glass, subtle film grain, vertical 9:16,
no text, no logos, no watermark, high contrast silhouettes, negative space for captions
NEGATIVE: photorealistic skin, 3D render, blurry, extra fingers, text, watermark, logo,
bright daylight, saturated colors, busy background, lens flare, cartoon outlines
```

Tỉ lệ: **9:16 (1080x1920)**. Seed cố định cho cả bộ (ví dụ 4711) để nhân vật không đổi mặt.

---

## 1. Nhân vật — character sheet

```
Character sheet, one Vietnamese ferry captain, male, late 40s, weathered face,
short grey-black hair, thin moustache, dark navy rain jacket with reflective stripe,
worn captain cap, tired eyes. Full body front, full body side, face close-up,
hands detail. Neutral grey background, even soft light, flat vector illustration,
consistent proportions, same character in all four views.
--ar 3:4 (sheet) / 9:16 (single)
```

Dùng để giữ mặt/tuổi/trang phục nhất quán giữa các cảnh. Khi dựng SVG, chỉ cần 6–8 hình khối
(đầu, mũ, áo, vai, tay) + 3 nét mặt.

## 1B. Khoá theo ảnh tham chiếu (image-to-image)

Khi đã có ảnh nhân vật, **đưa ảnh vào làm reference**, đừng tả lại bằng lời:

```
Use the attached image as the character reference. Keep the exact same character:
same face shape, same eye size and spacing, same hairstyle, same orange tee, same denim jeans,
same cream shoes, same body proportions. Change only the pose and the background.
Scene: <bối cảnh>. Camera: <cỡ cảnh>. Light: <nguồn sáng>.
Flat vector illustration, soft cel shading, no outlines, vertical 9:16.
NEGATIVE: redesign, different hairstyle, different clothes, 3D render, photorealistic,
extra fingers, text, watermark, logo, different eye colour.
Seed: <cố định cho cả bộ>
```

Mỗi lần đổi seed là một lần đổi mặt; ghi seed vào `CharSpec.note`. Quy trình đầy đủ (đọc palette,
viết spec, dựng sheet, checklist 6 điểm): `reference/character-ref.md`.

## 2. Background — bến phà đêm mưa

```
Wide background plate: small ferry dock at 21:40, night, heavy rain, wet concrete,
one amber lamp on a tall pole, distant hills, black water with faint reflections,
six blurred figures with umbrellas waiting at the ramp, no camera, no people in foreground,
empty lower third for captions.
+ STYLE
```

## 3. Cabin POV — cảnh mở

```
First-person view from the driver's seat of a small ferry at night, hands on a worn
steering wheel in the lower third, dashboard with faint amber gauges, rain streaks on
the windshield, wiper shadow, dark sea and dock lights beyond the glass, HUD-free,
cinematic 2D, vertical 9:16.
+ STYLE
```

Lưu ý: **không** đưa HUD vào ảnh — HUD là component `Hud`, để đồng bộ và đọc được.

## 4. Cận mặt — ECU

```
Extreme close-up of the captain's face, half lit by amber dashboard glow, rain reflection
moving across his cheek, eyes looking slightly off-camera, beads of water on his collar,
shallow depth, dark background, vertical 9:16.
+ STYLE
```

Dùng cho cảnh "anh ta nhận ra". Caption phải đặt **dưới** cằm (y ≥ 1050) để không che mắt.

## 5. Toàn thân — full body

```
Full body shot of the captain standing on the wet deck, dark navy rain jacket, cap,
hands at his sides, backlit by a single amber lamp, long shadow, rain, ferry railing
in front, empty space above his head, vertical 9:16.
+ STYLE
```

Kiểm tra: **hai chân tách nhau**, thấy giày, không bị cắt đầu.

## 6. POV chi tiết — vô lăng & tay

```
Top-down close-up of two hands gripping a worn ferry steering wheel, rain water on the
rim, amber gauge glow from below, dark navy sleeves, subtle motion blur, vertical 9:16.
+ STYLE
```

## 7. Radio — insert

```
Close-up of an old marine radio unit on a dark dashboard, amber frequency display
showing 97.7, analog needle, chipped paint, a hand turning the knob, faint static glow,
shallow depth of field, vertical 9:16.
+ STYLE
```

Quan trọng: **không để chữ trên màn hình** trong ảnh — chữ "ĐỪNG MỞ ĐÈN" do `RadioUnit.msg` vẽ,
để đúng font và đúng thời điểm.

## 8. Đám đông — silhouette

```
Six human silhouettes standing under black umbrellas on a lit ferry ramp at night,
backlit by one amber lamp, rain, faces completely in shadow, slight fog,
symmetrical composition, vertical 9:16.
+ STYLE
```

Mẹo đếm: 6 bóng ở cảnh gieo, 7 bóng ở cảnh twist. Đừng để model tự thêm người.

## 9. Bóng tối — những đôi mắt

```
Pitch black frame, seven pairs of small pale eyes opening in darkness, faint blue rim light,
slight fog, no faces, no bodies, minimal composition, vertical 9:16.
+ STYLE
```

Nếu dùng component: `EyesInDark n={7} spread={190} rowGap={210} cy={650} size={1.5}`.

## 10. Thẻ A/B — không dùng ảnh

Thẻ cuối luôn vẽ bằng `ChoiceCard` để chữ sắc nét và đúng brand:
header → câu hỏi → thẻ A (viền hổ phách) → thẻ B (viền xanh) → đếm ngược → prompt.
Không tạo ảnh cho phần này.

---

## 11. Checklist duyệt ảnh

- [ ] Đúng 9:16, không có chữ/watermark
- [ ] Cùng một nhân vật với các cảnh khác (mặt, mũ, áo)
- [ ] Vùng caption (y 760–1200) tương đối trống
- [ ] Có 1 nguồn sáng rõ, phần còn lại tối
- [ ] Không chi tiết thừa ở rìa khung
- [ ] Tay đúng 5 ngón, chân tách rời
- [ ] Mưa/nước có hướng nhất quán

## 12. Chuyển ảnh → SVG

1. Chọn 5–7 mảng màu lớn nhất; vẽ bằng `<path>`/`<rect>` theo thứ tự xa → gần.
2. Bỏ mọi chi tiết nhỏ hơn 20 px; thay bằng texture nhẹ (grain, scanline).
3. Ánh sáng: 1 radial gradient + 1 linear gradient là đủ.
4. Chuyển động: thêm `push()` và 1–2 phần tử động (mưa, kim, mắt).
5. So still với ảnh gốc ở cùng khung; nếu đọc được cùng một cảnh là đạt.
