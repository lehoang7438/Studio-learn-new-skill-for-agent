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

## Quy trình 5 tầng + 7 cổng

```
1 Ý TƯỞNG      logline 1 câu + twist + lựa chọn A/B ở cuối
2 KỊCH BẢN     5–9 cảnh, mỗi cảnh 1 ý, dur giây, key image
3 LỜI THOẠI    tiếng Việt, 1–2 câu/cảnh, khớp độ dài cảnh
4 HÌNH ẢNH     shots.tsx (scene) + stills + caption cues
5 VIDEO        audio → timeline.json → Remotion → MP4 + music/SFX
─────────────────────────────────────────────────────────────
   REVIEW      contract + stills + audio + caption + motion → PASS mới render
```

Không bỏ qua tầng 4: **luôn render stills và xem contact sheet** trước khi render MP4.

| Cổng | Chặn gì | Chi tiết |
|---|---|---|
| **G0** Setup / style lock | Sai cỡ, sai `renderer`, đổi rig giữa chừng | `reference/continuity.md` §6 |
| **G1** Body lock sheet | Silhouette trôi, mắt/tóc sai | `reference/character-ref.md` §1, §4 |
| **G2** Scene lock / empty set | Set và nhân vật sáng khác hướng | `reference/continuity.md` §3 |
| **G3** Continuity strip | Tay/chân/đạo cụ đổi giữa các cảnh | `reference/continuity.md` §4 |
| **G4** Contract + review | Field không ăn, metrics trùng, caption/audio lỗi | `python video.py contract <slug>` → `review` |
| **G5** Audio / mix | Timeline thiếu audio, mix lệch | `reference/qa.md` D/E — audio trước timeline |
| **G6** Render / pack | Sai khung hình, thiếu attribution | `reference/qa.md` E, `pack` |

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
python video.py audio <slug>             # music.wav + sfx.wav (phải có TRƯỚC timeline)
python video.py timeline <slug>          # timeline.json (nhúng caption + audio)
python video.py stills <slug> --mid      # ảnh từng cảnh + frame giữa để bắt cảnh "chết"
python video.py contract <slug>          # static check kiến trúc nhân vật — chạy trước review
python video.py review <slug>            # PASS/FAIL + report.html + contact-sheet.png
python video.py render <slug>            # MP4 cuối
# hoặc một lệnh (thứ tự build: voice → subs → audio → timeline → stills → review → render):
python video.py build <slug> --mid
```

Thứ tự **audio trước timeline** để phim có nhạc/SFX ngay lần build đầu. `build` dừng lại nếu review có
FAIL, trừ khi `--ignore-review` (chỉ bỏ qua FAIL review). `--force-media` chỉ regenerate cache
voice/audio. `--force` vẫn là cờ legacy = **cả hai**. `voice --only Lx` tự regenerate đúng line đó và
giữ word timing các line khác; cache tự invalidate theo hash của text/voice/DSP params.

## Định dạng project.json (nguồn sự thật)

| Khối | Vai trò |
|---|---|
| `slug`, `composition`, `title`, `logline` | định danh + tiêu đề |
| `fps`, `width`, `height` | engine cố định 30fps; `fps` khác 30 chỉ bị WARN (không có tác dụng) / 1080 / 1920 |
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
không có word-timing ngầm, nên không bị trôi tiếng. **`timeline.total` là số FRAME, không phải giây**;
cần giây thì dùng `totalSeconds`.

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
- Nhân vật phẳng nhận **một hướng sáng/cảnh** (`light={{x,y,rim,shade,warm}}`): viền sáng ở phía
  được chiếu, mảng bóng mờ ở phía khuất; viền mỏng hơn bóng, terminator mềm. Dùng chung light này cho
  set + nhân vật + prop (SceneLock). Chi tiết: `reference/character-ref.md` §6B, `reference/continuity.md` §3.
- Buồng lái chỉ đọc ra “xe” khi có **trần võng + gương treo từ trần + trụ A mỏng + gạt mưa nằm ngang**.
  Set dọc dựng riêng (`engine/taxi.tsx` → `CabinV`), không cắt từ set ngang ra.
- Chi tiết: `reference/style.md`. Set xe đêm & nhân vật kinh dị: `reference/set-xe-va-ma.md`.

## Nhân vật & ảnh tham chiếu

Khi nhân vật phải **trông như ảnh**: ảnh là hợp đồng, không phải cảm hứng.

1. Đọc ảnh → 5–7 màu (hex) + tỉ lệ + 3 chi tiết nhận dạng.
2. Viết **một** `CharSpec` trong `src/engine/character.tsx` (`renderer`, `look`, `palette`, `ref`) —
   `renderer` là field bắt buộc, không đổi giữa các cảnh.
3. Dựng `<CharacterSheet spec={...} refImage={...} />` — 4 góc nhìn + bảng màu + ảnh gốc cạnh bên.
4. So sheet với ảnh; khớp mắt/tóc/áo/quần/tỉ lệ mới dựng shot.
5. Mọi shot dùng `CHARACTERS.<id>.look` với đúng renderer đã khoá (`<FlatHero>` hoặc `<Hero>`);
   không viết màu tay hay toạ độ đạo cụ trong shot.

`FlatHero` (`src/engine/flat.tsx`) là rig thứ hai: cùng `Pose`, nhưng vẽ kiểu phẳng — khối tô kín,
không viền, tay áo ngắn, mắt tròn, tóc rối. `Hero` cũ vẫn dùng cho phim chalkboard.

- Quy trình đầy đủ + bảng lỗi: `reference/character-ref.md`.
- Ví dụ chạy được: `ref-nhan-vat` (sheet + 4 cảnh) và `chuyen-pha-sau` (nhân vật đó bước vào
  đúng vũ trụ của `chuyen-pha`: boong phà, HUD 6/7, ghế thứ bảy).
- Ảnh tham chiếu để trong `public/<slug>/ref/`; xoá trước khi phát hành nếu không có quyền.

### Khoá toàn bộ cơ thể

`Hero` và `FlatHero` **không cùng hình học**: đùi 72/88, chân 140/172, vai 42/68, hông 17/24, và mỗi
rig chỉ nghe một tập field `Look`. Khoá `renderer` trong spec cho toàn phim; số đo chỉ có một nguồn ở
`src/engine/metrics.ts` (`BODY_METRICS`, `jointsFor`, `handAnchors`, `FLAT_LEG_LEN`…), còn field được hỗ
trợ nằm ở `src/engine/look.ts` (`LOOK_SUPPORT`, `unsupportedLookFields`). Tay lấy màu từ `look`,
đạo cụ đặt từ `handAnchors` (mẫu: `DriverAtWheel`) — cấm hex/tọa độ cứng trong shot. Chạy
`python video.py contract <slug>` rồi so dải 4 ngữ cảnh. Chi tiết: `reference/continuity.md`.

## Cổng review

`python video.py review <slug>` trả `PASS`/`FAIL` và ghi `out/<slug>/review/`:

- caption có tràn `maxWidth` / đè HUD / đè dock không (`caption.width` — check có thật);
- cảnh có đứng yên bất thường không: so **frame key với frame `key + max(12, len/3)`**, 64x64
  (không phải frame 0);
- cảnh tối có còn nhìn thấy chủ thể (độ sáng/độ tương phản tối thiểu);
- giọng có dài hơn cảnh (dung sai 1.6s) không;
- từ nhấn có thực sự được tô màu, không tô rải rác không (`caption.accent_overapplied` — check có thật);
- timeline/audio/caption có khớp số cảnh không (`timeline.shots`, `timeline.audio_missing`);
- mix có lệch loudness/true peak không (`mix.lufs`, `mix.tp`). Giọng normalize -15 LUFS; -14 LUFS chỉ là
  ngưỡng khuyến nghị khi lên kênh, **không có lệnh `master`**.

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
| `video.py` | CLI: doctor/new/voice/subs/audio/timeline/stills/contract/review/render/pack |
| `pipeline/timeline.py` | project.json → timeline.json |
| `pipeline/voice.py` | edge-tts + retry + DSP |
| `pipeline/subs.py` | caption + SRT/VTT/ASS |
| `pipeline/score.py` | nhạc/SFX procedural + mix remote |
| `pipeline/review.py` | cổng test lỗi |
| `src/engine/firstPerson.tsx` | style pack: Cabin, NightSea, Hud, Caption, EyesInDark, ChoiceCard… |
| `src/engine/metrics.ts` | một nguồn số đo cơ thể: `BODY_METRICS.rig/flat`, `jointsFor`, `handAnchors`, `toWorld`, `handL/handR`, `HEAD`, `FLAT_LEG_LEN`… |
| `src/engine/look.ts` | `LOOK_SUPPORT`: field của `Look` được `rig`/`flat` tôn trọng + `unsupportedLookFields` |
| `src/engine/rig.tsx` | rig stick-figure (`Hero`): cast `LOOKS`, pose, walk, prop gắn tay (import metrics từ `metrics.ts`) |
| `src/engine/flat.tsx` | rig phẳng (`FlatHero`): cùng `Pose`, khối tô kín, tay áo, mắt tròn (metrics riêng, không giống `Hero`) |
| `src/engine/character.tsx` | `CHARACTERS` (spec khoá theo ảnh) + `CharacterSheet` 4 góc nhìn |
| `src/engine/taxi.tsx` | set xe đêm dọc: `CabinV` (trần + gương treo + trụ A mỏng), `RoadV`, `Mirror`/`BigMirror`, `WomanInGlass`, `GripHand`, `Clock` |
| `src/episodes/chuyen-xe/` | phim 9 phút, 33 cảnh, 9:16 (1080x1920) — ví dụ dài nhất |
| `src/episodes/chuyen-pha/` | ví dụ đầy đủ 9 cảnh, 42s |
| `src/episodes/storyboard-mau/` | storyboard test: mặt cận, toàn thân, bối cảnh, POV |
| `src/episodes/ref-nhan-vat/` | nhân vật dựng từ ảnh tham chiếu: sheet 4 góc + 5 khung hình |
| `src/episodes/chuyen-pha-sau/` | epilogue nối vào chuyen-pha, dùng nhân vật của sheet (19s) |
| `QUY-TRINH.md` | quy trình tiếng Việt, từng bước |
| `reference/style.md` | visual DNA + thông số |
| `reference/character-ref.md` | khoá nhân vật theo ảnh: palette, spec, sheet, checklist, prompt, hai rig |
| `reference/continuity.md` | Body Lock, HandSpec/PropAnchor, SceneLock, ContinuitySheet, cổng G0..G4 |
| `reference/set-xe-va-ma.md` | set xe đêm dọc + nhân vật kinh dị: trần/gương/trụ A, mắt đỏ, máu loang, tay cầm vô lăng, bẫy kỹ thuật |
| `reference/qa.md` | checklist review |
| `reference/prompt-pack.md` | prompt tạo ảnh/nền/storyboard |

## Không làm

- Không sửa `node_modules/`, `out/` bằng tay.
- Không nhét caption vào `shots.tsx` — caption luôn đi qua `project.json → captions.json → CaptionLayer`.
  Nếu tập **không có** phụ đề: để `captions: []` trong project.json **và** truyền `captions: []` vào
  `defineEpisode`, vì `CaptionLayer` vẫn đọc `timeline.captions` khi prop là `undefined`.
- Không gõ hex cho tay hay toạ độ cứng cho đạo cụ trong `shots.tsx` — dùng `look`/`handAnchors`.
- Không dùng pitch/volume trong edge-tts request (dịch vụ trả `NoAudioReceived`).
- Không copy `node_modules` khi pack/clone.
