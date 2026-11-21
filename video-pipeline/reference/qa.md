# QA — CỔNG TEST LỖI

Chạy:

```powershell
python video.py review <slug>           # PASS / WARN / FAIL
python video.py review <slug> --strict  # WARN cũng tính là fail
```

Đọc `out/<slug>/review/review.html` để xem từng cảnh, `review.json` để lấy mã lỗi, `contact-sheet.png` để nhìn tổng thể.

Nguyên tắc: **chỉ render bản cuối khi 0 FAIL**. WARN phải được đọc và quyết định có chấp nhận hay không.

---

## A. Kiểm tra tĩnh (không cần render)

Các mã dưới đây là check `python video.py validate <slug>` có thật. `fps` trong `project.json` **không có
tác dụng**: engine cố định 30fps, validate chỉ WARN nếu đặt khác 30. `timeline.total` là **số FRAME**
(không phải giây); muốn nói giây thì đọc/thêm `totalSeconds`.

| Mã | Mức | Điều kiện | Cách sửa |
|---|---|---|---|
| `project.slug` | FAIL | slug rỗng hoặc sai ký tự | dùng chữ thường, gạch nối |
| `project.size` | FAIL | không phải 1080x1920 | sửa `width`/`height` |
| `project.fps` | WARN | khác 30 (engine vẫn chạy 30) | đặt `fps: 30` cho đúng khai báo |
| `shot.dur` | FAIL | `dur <= 0` | đặt 3.5–5s |
| `shot.id` | FAIL | trùng id | đổi id |
| `caption.shot` | FAIL | `shot` không tồn tại | sửa về id cảnh đúng |
| `caption.range` | FAIL | `end <= start` | đặt lại giây |
| `caption.outside` | WARN | cue nằm ngoài cảnh của nó | dời `start/end` vào cảnh |
| `caption.accent` | WARN | `accent` không có trong `text` | sửa đúng dấu/hoa hoặc bỏ accent |
| `line.shot` | FAIL | `shot` không tồn tại | sửa id |
| `line.who` | FAIL | `who` không có trong `voice.roles` | thêm role hoặc đổi `who` |
| `endCard.shot` | FAIL | không trỏ tới cảnh choice | sửa `endCard.shot` |
| `endCard.scene` | WARN | scene không khớp cảnh choice | sửa `endCard.scene` |
| `fx.at` | FAIL | sai định dạng `s:giây` | dùng `"s:12.5"` |

## B. Kiểm tra ảnh still

Mỗi ảnh là 1080x1920, render từ `<Id>Board` tại frame key.

| Mã | Mức | Ngưỡng | Cách sửa |
|---|---|---|---|
| `still.size` | FAIL | khác 1080x1920 | kiểm tra composition |
| `still.blank` | FAIL | `std < 3.2` hoặc `< 24` màu | cảnh bị lỗi render; xem log Remotion |
| `still.dark` | WARN | `mean < 5` (trừ cảnh `dark`/`choice`/`black`) | tăng `LightPool`, đèn nền |
| `caption.missing` | FAIL | < 0.35% pixel chữ trong dải quanh `y` | kiểm tra `text`, `start/end`, `y`, `size` |
| `caption.width` | WARN | chữ tràn quá `maxWidth` | rút chữ hoặc giảm `size`, tăng `maxWidth` |
| `caption.edge` | WARN | chữ chạm mép (<34 px) | rút chữ hoặc giảm `size` |
| `caption.accent_overapplied` | WARN | tô màu quá nhiều từ / rải rác cả cue | chỉ giữ đúng 1 cụm nhấn trong `accent` |
| `hud.missing` | WARN | không có điểm sáng ở dải y 80–250 | bật `Hud`, kiểm tra `boot` |
| `still.duplicate` | WARN | aHash của 2 cảnh liền nhau lệch ≤ 2 bit | đổi khung/bố cục/ánh sáng |

Dải kiểm tra caption: từ `y - 1.05*size` đến `y + 0.2*size` (toạ độ canvas = world y + 420).
Chữ được tính là hiện nếu có pixel trắng (>225), vàng (>190,>130,<130) hoặc đỏ (>160,<110,<100).

## C. Kiểm tra chuyển động (khi chạy `stills --mid`)

| Mã | Mức | Ngưỡng | Cách sửa |
|---|---|---|---|
| `shot.static` | WARN | khác biệt frame key vs frame `key + max(12, len/3)` < 0.75 (64x64 grayscale) | thêm `push`, mưa, tay, kim, mắt |

Cảnh `choice` được bỏ qua. **Không so với frame 0**: luôn lấy frame key và frame
`key + max(12, len/3)` (đây là "frame mid" của check).

## D. Kiểm tra âm thanh

| Mã | Mức | Ngưỡng | Cách sửa |
|---|---|---|---|
| `timeline.audio_missing` | FAIL | timeline không có đường audio / thiếu file audio | chạy `audio` **trước** `timeline`, rồi sinh lại `timeline` |
| `timeline.shots` | FAIL | số shot trong timeline khác `project.json` | chạy lại `python video.py timeline <slug>` |
| `audio.voice_missing` | FAIL | không có `voice.wav` | `python video.py voice <slug>` |
| `audio.voice_length` | WARN | lệch > 1.6s so với hình | chạy lại `timeline` + `voice`, hoặc chỉnh `dur` |
| `audio.quiet` | WARN | < -30 LUFS | tăng `volume` role |
| `audio.hot` | WARN | > -8 LUFS | giảm `volume` |
| `audio.clip` | WARN | peak > -0.2 dBFS | giảm gain, để headroom ≥1 dB |
| `audio.music_missing` | WARN | thiếu `music.wav` | `python video.py audio <slug>` |
| `audio.sfx_missing` | WARN | thiếu `sfx.wav` | `python video.py audio <slug>` |
| `audio.music_silent` | WARN | music < -45 LUFS | tạo lại với `--force` |
| `line.overrun` | WARN | giọng kết thúc > cảnh + 0.35s | rút câu / dời sớm / tăng `dur` |

## E. Kiểm tra video / bản mix (sau render)

`mix.*` do `review` đo trên bản mix đã tạo (không cần đợi MP4), nhưng nói về bản mix cuối nên xếp ở đây.

| Mã | Mức | Ngưỡng | Cách sửa |
|---|---|---|---|
| `mix.lufs` | WARN | loudness mix lệch ngưỡng | chỉnh `musicVol`/`sfxVol`; giọng vẫn normalize -15 LUFS |
| `mix.tp` | WARN | true peak vượt ngưỡng an toàn | giảm gain, chừa headroom |
| `video.size` | FAIL | khác 1080x1920 | render đúng composition |
| `video.fps` | WARN | lệch 30 quá 0.2 | kiểm tra `fps` |
| `video.audio` | FAIL | không có audio stream | kiểm tra `timeline.audio` + flag render |
| `video.length` | WARN | lệch > 0.7s (bỏ qua bản preview) | render lại |
| `video.black` | WARN | có đoạn đen | chấp nhận nếu là end card |

## F. Duyệt bằng mắt (bắt buộc, không tự động được)

Mở contact sheet và trả lời:

- [ ] Cảnh 1 có đọc được "ở đâu, ai, lúc nào" trong 1 giây?
- [ ] Có cảnh nào trông giống hệt cảnh trước?
- [ ] Chủ thể có bị caption che?
- [ ] Mắt người xem có bị hút đúng chỗ?
- [ ] Twist có nhìn thấy, không cần đọc chữ?
- [ ] Thẻ A/B có đọc được ở cỡ điện thoại?
- [ ] Từ nhấn có đúng 1 cụm/câu, không rải rác?
- [ ] `y` caption có thay đổi giữa các cảnh?
- [ ] Cảnh cuối có đứng yên đủ lâu để chọn?

## G. Quy trình sửa

```
contract FAIL → sửa metrics/look/shot (tay, prop, renderer) → contract → review
review FAIL
  ├─ caption.*   → sửa project.json (size, text, y) → subs → timeline → stills → review
  ├─ still.*     → sửa shots.tsx → stills → review
  ├─ timeline.*  → audio → timeline → review           (audio phải có trước timeline)
  ├─ audio.*     → voice / audio chạy lại → timeline → review
  ├─ line.*      → rút text → voice --only Lx → timeline → review
  └─ video.*     → render lại sau khi các mục trên PASS
```

`voice --only Lx` giờ **an toàn**: tự regenerate đúng line đó và giữ word timing của các line khác,
không làm trôi caption. Cache giọng tự invalidate theo hash của text/voice/DSP params — sửa text/pitch
xong chạy lại là được, không cần xoá tay.

`build` có `--force-media` (chỉ regenerate cache voice/audio) và `--ignore-review` (chỉ bỏ qua FAIL
review). `--force` vẫn là legacy = **cả hai**. Không sửa file trong `out/` — chúng bị ghi đè.

## H. Ngưỡng nên siết khi lên kênh thật

- `--strict` trong CI.
- Thêm kiểm tra: thời lượng 35–60s, số cảnh 7–12, mật độ caption ≤ 1 cue/2s.
- Kiểm tra ảnh chân dung: mắt không bị caption che (dải y 400–700).
- **Xuất bản: đo mix cuối quanh -14 LUFS** (ngưỡng khuyến nghị khi lên kênh — không phải lệnh có sẵn);
  giọng được normalize mặc định **-15 LUFS** (đổi bằng `audio.voiceLufs`). Không có lệnh `master` trong pipeline.

---

## I. Nhất quán nhân vật (bắt buộc bằng mắt)

Static check không thấy được tay/chân đổi dáng. Ghép 4 khung (ngoài xe / trong xe / cận mặt / tay cầm
đồ) rồi trả lời:

- [ ] Cùng `renderer` trong mọi cảnh (không trộn `Hero` và `FlatHero`).
- [ ] Tay: cùng kiểu (mitten/5 ngón), cùng màu, không đổi ngầm giữa ngoài xe và trong xe.
- [ ] Chân/giày: cùng dáng, cùng màu, chạm đất cùng một đường (metrics chung).
- [ ] Silhouette: vai/hông/độ dài tay không đổi giữa các cảnh; đổi pose không đổi tỉ lệ.
- [ ] Đạo cụ (vô lăng/ly/điện thoại/tay nắm cửa) luôn dính tay, không "bay" khi đổi pose.
- [ ] Ánh sáng set và nhân vật cùng hướng (SceneLock).
- [ ] `python video.py contract <slug>` sạch + `review` 0 FAIL.

Chi tiết Body Lock / HandSpec / PropAnchor / SceneLock / các cổng G0..G4:
[`reference/continuity.md`](continuity.md).
