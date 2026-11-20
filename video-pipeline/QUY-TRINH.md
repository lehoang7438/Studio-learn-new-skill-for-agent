# QUY TRÌNH LÀM VIDEO DỌC 9:16

Tài liệu này là quy trình thao tác. Muốn hiểu kiến trúc, đọc `README.md`. Muốn biết tiêu chí đẹp/lỗi, đọc `reference/style.md` và `reference/qa.md`.

Mục tiêu đầu ra: **1080x1920, 30fps, H.264 + AAC, 35–60 giây**, đăng Reels/TikTok/Shorts.

---

## 0. Chuẩn bị (một lần)

```powershell
cd video-pipeline
npm install
python video.py doctor
```

`doctor` phải xanh ở python, numpy, Pillow, edge-tts, node, npm, remotion, ffmpeg, ffprobe, fonts.
Nếu báo `node_modules is missing` → `npm install`. Nếu thiếu ffmpeg → `winget install Gyan.FFmpeg`.

---

## 1. Ý TƯỞNG → LOGLINE

Viết đúng 4 dòng trước khi đụng vào code:

```
NHÂN VẬT:  ai, đang làm gì, trong 1 câu
BỐI CẢNH:  ở đâu, lúc nào (đêm/mưa/xa)
TWIST:     điều bất thường duy nhất
LỰA CHỌN:  A hay B — người xem phải chọn ở giây cuối
```

Ví dụ chuẩn (demo `chuyen-pha`):

- Nhân vật: người lái chuyến phà cuối.
- Bối cảnh: bến phà đêm mưa, 21:40.
- Twist: bán 5 vé nhưng có 6 người lên tàu; trong gương là 7 cái bóng.
- Lựa chọn: **BẬT ĐÈN** (thấy họ) / **ĐỂ TỐI** (không ai thấy mình).

Quy tắc: twist phải nhìn thấy được bằng hình, không cần lời giải thích. Lựa chọn A/B phải cùng hấp dẫn.

---

## 2. KỊCH BẢN → 5–9 CẢNH

Mỗi cảnh là **một ý** và **một hình**. Ghi ra bảng:

| # | Cảnh | Cỡ | Giây | Hình chính | Chức năng |
|---|---|---|---|---|---|
| S1 | cabin | FP/medium | 4.5 | vô lăng, HUD, mưa | thiết lập |
| S2 | dock | FP/wide | 5.0 | 6 bóng dưới ô | gieo nghi vấn |
| S3 | mirror | insert | 4.5 | gương: 7 bóng | twist nhỏ |
| S4 | radio | close | 4.5 | kim tần số, tay vặn | căng |
| S5 | radio-msg | macro | 4.5 | dòng chữ trên đài | twist |
| S6 | deck | FP/wide | 4.5 | họ đã ở trên tàu | đỉnh |
| S7 | switch | close | 4.0 | tay trên công tắc | chuẩn bị chọn |
| S8 | dark | eyes | 4.5 | 7 đôi mắt | sợ |
| S9 | choice | card | 6.0 | A/B | chốt |

Ngân sách thời gian: **3.5–5s/cảnh**, tổng 35–50s. Cảnh cuối 5–6s để người xem kịp chọn.

Tạo folder:

```powershell
python video.py new ten-episode --title "TÊN TẬP"
```

Sửa `src/episodes/ten-episode/project.json`: `logline`, `shots[]`, `endCard`.

---

## 3. LỜI THOẠI → TIẾNG VIỆT, KHỚP GIÂY

Luật:

1. **1–2 câu/cảnh**, không quá 16 từ/câu.
2. Câu nói bắt đầu **0.2–0.6s sau khi cảnh vào** (`at = start cảnh + 0.3`).
3. Câu nói phải kết thúc **trước khi cảnh cắt** ít nhất 0.3s.
4. Giọng `radio` chỉ dùng cho lời phát từ thiết bị; còn lại `narrator`.
5. Không lặp y nguyên caption; lời thoại kể, caption nhấn.

Ước lượng độ dài: tiếng Việt ~**3.2 từ/giây** với rate `-4%`. Một câu 12 từ ≈ 3.7s — vừa một cảnh 4.5s.

Khai báo trong `lines[]`:

```json
{ "id": "L2", "shot": "S2", "who": "narrator", "at": 5.0, "text": "Sáu người đợi dưới mưa. Tôi chỉ có năm vé." }
```

Tổng hợp giọng:

```powershell
python video.py voice ten-episode            # tất cả
python video.py voice ten-episode --only L2  # sửa 1 câu
```

edge-tts hay lỗi mạng (~30%); pipeline đã retry 12 lần với backoff. Nếu vẫn fail, chạy lại lệnh —
file đã có sẽ được giữ, chỉ line thiếu được tạo.

Nếu review báo `line overrun`, **rút ngắn câu** thay vì tăng tốc độ đọc.

---

## 4. HÌNH ẢNH → STORYBOARD + CAPTION

### 4.1. Viết cảnh trong `shots.tsx`

Mỗi cảnh là một function thuần của `t` (giây trong cảnh):

```tsx
export const S2: React.FC<ShotProps> = ({ t, len }) => (
  <g transform={push(t, len, 1.01, 1.05)}>
    <NightSea id="s2" t={t} rain={0.7} fog={0.55} />
    <LightPool x={960} y={700} r={420} o={0.12} />
    <Crowd t={t} n={6} y={706} spread={560} />
    <Cabin t={t} speed={0.3} hands={false} />
    <Hud t={t} boot={1} clock="21:41" fuel={38} km={61} seats={5} />
    <Scanlines o={0.04} />
  </g>
);
```

Bộ dựng có sẵn trong `src/engine`:

| Thành phần | Dùng cho |
|---|---|
| `NightSea` | trời đêm, biển, mưa, sương, trăng, đèn bến |
| `Cabin` | nội thất buồng lái: kính, vô lăng, tay |
| `Hud` | đồng hồ, tốc độ, nhiên liệu, số ghế, đèn |
| `RadioUnit` | mặt đài, kim tần số, tay vặn, dòng chữ |
| `LightSwitch` | công tắc + tay |
| `Crowd` | bóng người đứng |
| `EyesInDark` | các đôi mắt trong bóng tối (`n`, `spread`, `rowGap`, `cx`, `cy`, `size`) |
| `ChoiceCard` | thẻ A/B cuối |
| `push`, `flicker`, `clamp` | chuyển động nhẹ, nhấp nháy |

Luật hình:

- Cảnh đầu phải cho thấy **bối cảnh + nhân vật + mưa/đêm** trong 1 giây đầu.
- Đừng để cảnh đứng yên: luôn có `push()` hoặc chuyển động nhỏ (kim, mưa, tay, mắt).
- Cảnh tối (đèn tắt) vẫn phải có 1 nguồn sáng nhỏ để thấy chủ thể.
- Không đặt chủ thể ở đúng dải caption nếu caption cùng cảnh.

### 4.2. Caption trong `project.json`

```json
{ "id": "C2", "shot": "S2", "start": 4.85, "end": 6.75, "text": "SÁU NGƯỜI ĐỨNG ĐỢI.", "accent": "SÁU", "y": 900 }
```

- `text`: ALL CAPS, 2–5 từ, có dấu chấm cuối nếu là câu.
- `accent`: đúng **một từ hoặc một cụm** có trong text; có thể là cụm nhiều từ (`"CÔNG TẮC"`).
- `color`: chỉ dùng khi muốn đỏ cảnh báo (`#E8402F`); mặc định vàng.
- `y`: 760–1200 tuỳ bố cục; **đổi giữa các cảnh** để không thành một dải đứng.
- `size`: 96–112; chỉ tăng khi câu rất ngắn.
- Một cảnh có thể có 1–2 cue nối tiếp, không chồng lên nhau.

Sinh caption + phụ đề:

```powershell
python video.py subs ten-episode
```

Lệnh này ghi `captions.json` (nhúng vào timeline) và `out/ten-episode/subtitles.srt|.vtt|.ass`.

### 4.3. Duyệt stills

```powershell
python video.py stills ten-episode --mid
```

Xem `out/ten-episode/review/contact-sheet.png` (hoặc từng file trong `out/ten-episode/board/`).
Phải trả lời được: cảnh này là gì, chủ thể ở đâu, caption có đè không, có gì chuyển động.

Bộ storyboard mẫu `storyboard-mau` là chuẩn tham chiếu cho 4 loại khung:
**bối cảnh → toàn thân → cận mặt → POV chi tiết**, rồi mới tới twist và thẻ A/B.

---

## 5. VIDEO → TIMELINE, AUDIO, RENDER

```powershell
python video.py timeline ten-episode
python video.py audio ten-episode
```

- `timeline.json`: cảnh + caption + đường dẫn audio; là hợp đồng giữa Python và Remotion.
- `music.wav` / `sfx.wav`: tổng hợp procedural, khớp đúng độ dài video.

SFX thật (tuỳ chọn):

```powershell
python video.py sfx-search "boat horn" --limit 5
# thêm vào project.json:
# "sfxApi": { "enabled": true, "cues": [ { "id": "fs-...", "at": "s:0.6", "gain": 0.55 } ] }
python video.py audio ten-episode --remote --force
```

Kiểm tra `public/ten-episode/sfx-src/ATTRIBUTION.md` trước khi đăng.

Render:

```powershell
python video.py render ten-episode --preview   # nửa kích thước, nhanh, để duyệt
python video.py render ten-episode             # bản cuối
```

Hoặc một lệnh đầy đủ:

```powershell
python video.py build ten-episode --mid
```

---

## 6. CỔNG REVIEW / TEST LỖI

```powershell
python video.py review ten-episode
```

Đọc `out/ten-episode/review/review.html` (chi tiết) và `contact-sheet.png` (nhìn tổng thể).

**Chỉ render bản cuối khi review PASS.** Quy trình sửa:

| Lỗi | Sửa |
|---|---|
| caption tràn / quá to | giảm `size`, rút chữ, tăng `maxWidth` |
| caption đè HUD/dock | đổi `y`, hoặc dời chủ thể |
| cảnh đứng yên | thêm `push`, mưa, nhấp nháy, chuyển tay |
| cảnh quá tối | tăng `LightPool`, `EyesInDark.o`, đèn nền |
| line overrun | rút câu, hoặc tăng `dur` cảnh |
| accent không tô màu | kiểm tra `accent` khớp từ trong `text` (đúng dấu, đúng hoa) |
| HUD che chữ | đổi `y` caption hoặc giảm HUD |

Sau khi sửa: chạy lại `stills` → `review`. Chỉ khi PASS mới `render`.

---

## 7. Đóng gói / tái sử dụng

```powershell
python video.py pack        # zip sạch (không node_modules, out, media)
python video.py clone D:\projects\video-2
```

Clone: `npm install` rồi `python video.py doctor`. Không copy `node_modules`.

Dùng làm skill trong project khác:

```powershell
New-Item -ItemType Junction -Path .opencode\skills\video-pipeline -Target D:\tools\video-pipeline
```

---

## Checklist trước khi đăng

- [ ] 1080x1920, 30fps, có tiếng, độ dài 35–60s
- [ ] 1 giây đầu đã thấy bối cảnh + nhân vật
- [ ] twist nhìn thấy được, không cần giải thích
- [ ] caption all-caps, không tràn, không đè mặt/HUD, `y` có thay đổi
- [ ] từ nhấn có màu + gạch chân, không quá 1 cụm/câu
- [ ] giọng khớp cảnh, không bị cắt giữa từ
- [ ] cảnh cuối có A/B + prompt bình luận
- [ ] `review` PASS (0 fail)
- [ ] SFX có attribution nếu dùng mẫu ngoài
