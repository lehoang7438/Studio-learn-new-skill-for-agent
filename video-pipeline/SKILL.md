---
name: Video Pipeline (dọc 9:16)
description: Biến một ý tưởng/quy trình thành video dọc 1080x1920 30fps kiểu Reels/TikTok — kịch bản, lời thoại tiếng Việt, storyboard/ảnh, caption all-caps có gạch chân màu, nhạc/SFX, render MP4, kèm cổng review/test-lỗi. Dùng khi người dùng muốn làm video kể chuyện ngắn, video "ngày thứ N", phim kinh dị một góc nhìn, hoặc cần storyboard + phụ đề theo phong cách video tham chiếu.
---

# Video Pipeline — ý tưởng → kịch bản → lời thoại → hình ảnh → video

Một folder tự chứa, clone đi đâu cũng chạy: Remotion + engine SVG + Python cho voice/caption/audio/review.
Đầu ra chuẩn: **1080x1920, 30fps, H.264/AAC**, tỉ lệ 9:16 cho Reels/TikTok/Shorts.

## Khi nào dùng

- Có một ý tưởng, một quy trình, hay một câu chuyện ngắn cần thành video dọc có lời thoại tiếng Việt.
- Cần storyboard nhanh (stills) trước khi render, để duyệt bố cục và caption.
- Cần phụ đề all-caps, chữ to, viền đen dày, từ nhấn màu vàng/đỏ — đúng "visual DNA" của video tham chiếu.
- Cần kiểm tra lỗi tự động trước khi đăng: caption tràn, cảnh đứng yên, HUD che chữ, tiếng dài hơn cảnh.

## Quy trình 5 tầng + 1 cổng

```
1 Ý TƯỞNG      logline 1 câu + twist + lựa chọn A/B ở cuối
2 KỊCH BẢN     5–9 cảnh, mỗi cảnh 1 ý, dur giây, key image
3 LỜI THOẠI    tiếng Việt, 1–2 câu/cảnh, khớp độ dài cảnh
4 HÌNH ẢNH     shots.tsx (scene) + stills + caption cues
5 VIDEO        timeline.json → Remotion → MP4 + music/SFX
─────────────────────────────────────────────────────────────
   REVIEW      stills + audio + caption + motion → PASS mới render
```

Không bỏ qua tầng 4: **luôn render stills và xem contact sheet** trước khi render MP4.

## Bắt đầu nhanh

```powershell
cd video-pipeline
npm install                 # lần đầu
python video.py doctor      # kiểm tra python/node/ffmpeg/fonts/remotion
python video.py new ten-episode --title "TÊN TẬP"
```

Sau đó sửa `src/episodes/<slug>/project.json` (kịch bản, caption, lines, endCard) và
`src/episodes/<slug>/shots.tsx` (bố cục từng cảnh). Đăng ký trong `src/episodes/index.ts` nếu tạo tay.

Vòng lặp làm việc:

```powershell
python video.py validate <slug>          # kiểm tra tĩnh project.json
python video.py voice <slug>             # edge-tts → public/<slug>/voice.wav + words.json
python video.py subs <slug>              # captions.json + .srt/.vtt/.ass
python video.py timeline <slug>          # timeline.json (nhúng caption + audio)
python video.py audio <slug>             # music.wav + sfx.wav (procedural)
python video.py stills <slug> --mid      # ảnh từng cảnh + frame giữa để bắt cảnh "chết"
python video.py review <slug>            # PASS/FAIL + report.html + contact-sheet.png
python video.py render <slug>            # MP4 cuối
# hoặc một lệnh:
python video.py build <slug> --mid
```

`build` dừng lại nếu review có FAIL (trừ khi `--force`).

## Định dạng project.json (nguồn sự thật)

| Khối | Vai trò |
|---|---|
| `slug`, `composition`, `title`, `logline` | định danh + tiêu đề |
| `fps`, `width`, `height` | mặc định 30 / 1080 / 1920 |
| `voice.roles` | giọng edge-tts: `narrator`, `radio`… kèm `rate`, `pitch`, `volume`, `loa`, `echo` |
| `audio` | `music`, `sfx`, `musicVol`, `sfxVol` |
| `subtitles` | `maxChars`, `maxDur`, `size`, `maxWidth`, `y`, `accentColor`, `warnColor`, `accentWords`, `warnWords` |
| `shots[]` | `id`, `scene`, `size`, `dur` (giây), `key`, `caption`, `accent`, `note` |
| `captions[]` | `id`, `shot`, `start`/`end` (giây tuyệt đối), `text`, `accent`, `y`, `size`, `color` |
| `lines[]` | `id`, `shot`, `who`, `at` (giây tuyệt đối), `text` |
| `endCard` | `shot`, `a`, `b`, `subA`, `subB`, `prompt` |
| `fx[]` | `at` dạng `s:giây`, `kind` = `flash`/`shake` |
| `sfxApi` | `enabled`, `cues[]` lấy mẫu CC0 từ Lots of Sounds |

Quy ước thời gian: **mọi `at`/`start`/`end` là giây tuyệt đối**. `dur` của cảnh cộng dồn thành timeline;
không có word-timing ngầm, nên không bị trôi tiếng.

## Luật caption (bắt buộc)

- Tĩnh, ngắn, **ALL CAPS**, mỗi cue 1 cụm ý; không chạy chữ, không karaoke.
- Nền luôn trắng; `accent` chỉ đổi **màu của từ/cụm được nhấn** (vàng `#FFD24A`, đỏ `#E8402F`).
- Từ nhấn có **gạch chân cùng màu**; nhiều từ nhấn liền nhau dùng **một gạch liền**.
- Viền đen dày + drop shadow; chữ tự co theo `maxWidth` (Anton ~0.48 em/ký tự).
- `y` đổi theo cảnh để không che mặt/chủ thể. Caption ghi theo toạ độ world; `CaptionLayer` tự dịch `translate(-420 420)`.

## Luật hình (visual DNA)

- Góc nhìn thứ nhất trong xe/tàu ban đêm, mưa trên kính, HUD góc trên, đèn bến xa.
- Một ý/cảnh; cắt nhanh 3.5–5s; push-in nhẹ; flash/shake đúng lúc twist.
- 3–4 cảnh đầu là bối cảnh, giữa là twist, cuối là **thẻ chọn A/B** + prompt bình luận.
- Chi tiết: `reference/style.md`.

## Nhân vật & ảnh tham chiếu

Khi nhân vật phải **trông như ảnh**: ảnh là hợp đồng, không phải cảm hứng.

1. Đọc ảnh → 5–7 màu (hex) + tỉ lệ + 3 chi tiết nhận dạng.
2. Viết **một** `CharSpec` trong `src/engine/character.tsx` (`look`, `palette`, `ref`).
3. Dựng `<CharacterSheet spec={...} refImage={...} />` — 4 góc nhìn + bảng màu + ảnh gốc cạnh bên.
4. So sheet với ảnh; khớp mắt/tóc/áo/quần/tỉ lệ mới dựng shot.
5. Mọi shot dùng `CHARACTERS.<id>.look` với `<FlatHero>`; không viết màu tay trong shot.

`FlatHero` (`src/engine/flat.tsx`) là rig thứ hai: cùng `Pose`, nhưng vẽ kiểu phẳng — khối tô kín,
không viền, tay áo ngắn, mắt tròn, tóc rối. `Hero` cũ vẫn dùng cho phim chalkboard.

- Quy trình đầy đủ + bảng lỗi: `reference/character-ref.md`.
- Ví dụ chạy được: `ref-nhan-vat` (sheet + 4 cảnh) và `chuyen-pha-sau` (nhân vật đó bước vào
  đúng vũ trụ của `chuyen-pha`: boong phà, HUD 6/7, ghế thứ bảy).
- Ảnh tham chiếu để trong `public/<slug>/ref/`; xoá trước khi phát hành nếu không có quyền.

## Cổng review

`python video.py review <slug>` trả `PASS`/`FAIL` và ghi `out/<slug>/review/`:

- caption có tràn `maxWidth` / đè HUD / đè dock không;
- cảnh có đứng yên bất thường không (so frame 0 với frame giữa, 64x64);
- cảnh tối có còn nhìn thấy chủ thể (độ sáng/độ tương phản tối thiểu);
- giọng có dài hơn cảnh (dung sai 1.6s) không;
- từ nhấn có thực sự được tô màu trong ảnh không;
- timeline/audio/caption có khớp số cảnh không.

Chi tiết tiêu chí: `reference/qa.md`. `--strict` biến warning thành fail.

## Âm thanh

- Mặc định **procedural** (numpy) → clone không cần thư viện media.
- Giọng cloud: `edge-tts` (`vi-VN-NamMinhNeural` nam, `vi-VN-HoaiMyNeural` nữ), mỗi line một file, có retry;
  chỉ gửi `rate`, còn `pitch`/`volume` xử lý cục bộ (phase-vocoder + gain).
- Giọng local (tuỳ chọn): **VieNeu-TTS v3 Turbo** — `pip install vieneu`, đặt `voice.engine: "vieneu"`,
  `voice.roles.*.id` = tên preset (`"Hải Đăng"`, `"Mai Anh"`, `"Adam bựa"`, `"Thùy Dung"`…).
  48 kHz, 25 giọng, clone từ clip 3–8s (`ref_audio`), chèn `[cười]` `[thở dài]` trong text.
  CPU RTF ≈ 0.5 (lần đầu tải model ~1 GB); cache riêng `lines/L1.vieneu.wav`, không lẫn với edge-tts.
  Nguồn: https://github.com/pnnbao97/VieNeu-TTS (Apache 2.0).
- **Chuẩn hoá độ to**: voice.wav luôn qua EBU R128 hai pass — mặc định **-15 LUFS, -1.5 dBTP**
  (`audio.voiceLufs` để đổi). Nhạc/SFX chỉ là nền (`musicVol` 0.11, `sfxVol` 0.75–0.8), nên lời luôn nổi.
- SFX thật (tuỳ chọn): `python video.py sfx-search "boat horn"` rồi thêm `sfxApi.cues`, chạy
  `python video.py audio <slug> --remote`. Mẫu CC0, có ghi `ATTRIBUTION.md` — kiểm tra license trước khi đăng.

## Đóng gói & tái sử dụng

```powershell
python video.py pack                     # -> ../video-pipeline.zip (bỏ node_modules/out/media)
python video.py clone D:\projects\my-video
```

Clone cần: `npm install` + `python video.py doctor`. Fonts nằm trong `public/fonts/`, không tải mạng.

Để dùng như skill OpenCode trong project khác:

```powershell
# cách 1: junction (Windows) — một nguồn, nhiều project
New-Item -ItemType Junction -Path .opencode\skills\video-pipeline -Target D:\tools\video-pipeline
# cách 2: copy cả folder vào .opencode/skills/video-pipeline
```

## File quan trọng

| File | Nội dung |
|---|---|
| `video.py` | CLI tất cả các bước |
| `pipeline/timeline.py` | project.json → timeline.json |
| `pipeline/voice.py` | edge-tts + retry + DSP |
| `pipeline/subs.py` | caption + SRT/VTT/ASS |
| `pipeline/score.py` | nhạc/SFX procedural + mix remote |
| `pipeline/review.py` | cổng test lỗi |
| `src/engine/firstPerson.tsx` | style pack: Cabin, NightSea, Hud, Caption, EyesInDark, ChoiceCard… |
| `src/engine/rig.tsx` | rig stick-figure (`Hero`): cast `LOOKS`, pose, walk, prop gắn tay |
| `src/engine/flat.tsx` | rig phẳng (`FlatHero`): cùng `Pose`, khối tô kín, tay áo, mắt tròn |
| `src/engine/character.tsx` | `CHARACTERS` (spec khoá theo ảnh) + `CharacterSheet` 4 góc nhìn |
| `src/episodes/chuyen-pha/` | ví dụ đầy đủ 9 cảnh, 42s |
| `src/episodes/storyboard-mau/` | storyboard test: mặt cận, toàn thân, bối cảnh, POV |
| `src/episodes/ref-nhan-vat/` | nhân vật dựng từ ảnh tham chiếu: sheet 4 góc + 5 khung hình |
| `src/episodes/chuyen-pha-sau/` | epilogue nối vào chuyen-pha, dùng nhân vật của sheet (19s) |
| `QUY-TRINH.md` | quy trình tiếng Việt, từng bước |
| `reference/style.md` | visual DNA + thông số |
| `reference/character-ref.md` | khoá nhân vật theo ảnh: palette, spec, sheet, checklist, prompt |
| `reference/qa.md` | checklist review |
| `reference/prompt-pack.md` | prompt tạo ảnh/nền/storyboard |

## Không làm

- Không sửa `node_modules/`, `out/` bằng tay.
- Không nhét caption vào `shots.tsx` — caption luôn đi qua `project.json → captions.json → CaptionLayer`.
- Không dùng pitch/volume trong edge-tts request (dịch vụ trả `NoAudioReceived`).
- Không copy `node_modules` khi pack/clone.
