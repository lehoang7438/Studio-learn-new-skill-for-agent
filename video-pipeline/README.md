# video-pipeline

Một pipeline video dọc tự chứa: **ý tưởng → kịch bản → lời thoại → storyboard/ảnh → MP4 9:16**, có cổng review tự động.
Mọi khung hình được vẽ bằng code (Remotion + SVG), nên không cần stock footage, không cần timeline editor, và clone đi đâu cũng chạy.

- Đầu ra: **1080x1920, 30fps, H.264/AAC**
- Tham chiếu: video thriller phà 89.6s — POV đêm, HUD, mưa, caption all-caps, thẻ A/B
- Python: voice/caption/audio/review. Node: Remotion render. Không có dependency ẩn.

---

## Cài đặt

```powershell
npm install
python video.py doctor
```

Yêu cầu: Python 3.10+ (numpy, Pillow, edge-tts), Node 20+, ffmpeg/ffprobe trên PATH.
Fonts đã đóng gói trong `public/fonts/` (Anton, Be Vietnam Pro, JetBrains Mono) — không tải mạng.

## Dùng nhanh

```powershell
python video.py new tap-01 --title "TẬP 01"
# sửa src/episodes/tap-01/project.json + shots.tsx
python video.py build tap-01 --mid
```

`build` = voice → subs → timeline → audio → stills → review → render.
Nếu review FAIL, build dừng trước khi render (dùng `--force` để bỏ qua).

---

## Cấu trúc

```
video-pipeline/
├── video.py                 CLI
├── SKILL.md                 hướng dẫn cho agent (OpenCode skill)
├── QUY-TRINH.md             quy trình tiếng Việt
├── README.md                tài liệu kỹ thuật (file này)
├── pipeline/                Python
│   ├── common.py            paths, npm/ffmpeg, json helpers
│   ├── timeline.py          project.json -> timeline.json
│   ├── voice.py             edge-tts + retry + pitch/volume/DSP
│   ├── subs.py              caption + SRT/VTT/ASS
│   ├── score.py             nhạc/SFX procedural + mix remote
│   ├── sfx_api.py           Lots of Sounds sample API
│   ├── validate.py          kiểm tra tĩnh
│   ├── review.py            cổng test lỗi
│   ├── doctor.py            kiểm tra môi trường
│   ├── scaffold.py          `new`
│   └── pack.py              `pack` / `clone`
├── scripts/                 Node
│   ├── lib.mjs              bundle + select composition
│   ├── stills.mjs           ảnh storyboard (+ mid frame)
│   ├── frame.mjs            1 frame bất kỳ
│   └── render.mjs           render MP4
├── src/
│   ├── engine/              engine SVG + style pack
│   │   ├── episode.tsx      Timeline, Episode, Board, ShotFrame
│   │   ├── firstPerson.tsx  Cabin, NightSea, Hud, Caption, EyesInDark, ChoiceCard…
│   │   ├── anim.ts          push, clamp, lerp, flicker
│   │   ├── kit.tsx          defs dùng chung
│   │   └── light.tsx        SetDefs, LightPool
│   ├── episodes/
│   │   ├── index.ts         registry
│   │   ├── chuyen-pha/      demo 9 cảnh, 42s
│   │   ├── storyboard-mau/  storyboard test 9 cảnh
│   │   └── ref-nhan-vat/    nhân vật từ ảnh tham chiếu, 5 cảnh
│   └── index.ts             Remotion root (register compositions)
├── templates/               project.json, shots.tsx, index.tsx cho `new`
├── public/
│   ├── fonts/               5 font bundled
│   └── <slug>/              voice.wav, music.wav, sfx.wav, sfx-src/
├── reference/               style.md, qa.md, prompt-pack.md
└── out/                     board/, review/, <slug>.mp4
```

---

## Mô hình dữ liệu

### project.json (nguồn sự thật)

Người viết sửa file này. Các trường chính:

```jsonc
{
  "slug": "chuyen-pha",
  "composition": "ChuyenPha",
  "title": "CHUYẾN PHÀ 21:40",
  "fps": 30, "width": 1080, "height": 1920,
  "voice": { "roles": { "narrator": { "id": "vi-VN-NamMinhNeural", "rate": "-4%" } } },
  "audio": { "music": true, "sfx": true, "musicVol": 0.16, "sfxVol": 1 },
  "subtitles": { "size": 100, "maxWidth": 900, "accentColor": "#FFD24A" },
  "shots":    [ { "id": "S1", "dur": 4.5, "key": 60, "scene": "cabin" } ],
  "captions": [ { "id": "C1", "shot": "S1", "start": 0.55, "end": 2.35, "text": "21:40.", "y": 900 } ],
  "lines":    [ { "id": "L1", "shot": "S1", "who": "narrator", "at": 0.7, "text": "Chuyến phà cuối cùng trong đêm." } ],
  "endCard":  { "shot": "S9", "a": "BẬT ĐÈN", "b": "ĐỂ TỐI", "prompt": "BÌNH LUẬN  A  HOẶC  B" },
  "fx":       [ { "at": "s:19.0", "kind": "flash", "color": "#FFE9B0", "o": 0.16 } ]
}
```

**Thời gian là giây tuyệt đối.** Không có word-timing ngầm: caption và line đặt đúng giây,
`dur` của cảnh chỉ quyết định timeline. Vì vậy sửa lời không làm trôi caption.

### timeline.json (hợp đồng Python ↔ Remotion)

```ts
type Timeline = {
  slug: string; title: string; fps: number; total: number; // total = tổng giây
  segments: { shot: string; a: number; b: number; t0: number; t1: number }[]; // a,b = frame
  shots: { id: string; size: string; key: number; len: number; first: number }[];
  fx: { f: number; kind: 'flash' | 'shake'; color?: string; o?: number }[];
  audio: { voice?: string; music?: string; sfx?: string; musicVol?: number; sfxVol?: number };
  captions: CaptionCue[];
};
```

`<Id>` = video đầy đủ (audio + caption + grade). `<Id>Board` = storyboard: frame i là cảnh i ở `key`, caption hiện ngay (`instant`).

### Hệ toạ độ

World là **1920x1080** (giữ nguyên mọi set cũ). Canvas dọc 1080x1920 hiển thị cửa sổ world
`x 420..1500`, `y -420..1500`. `ShotFrame` bọc `translate(-420 420)`:

```
canvas x = world x - 420
canvas y = world y + 420
```

Caption cũng viết theo world và được `CaptionLayer` dịch tương tự. Nghĩa là `y=900` trong caption
nằm ở canvas y=1320 (dưới giữa khung).

---

## Caption

`pipeline/subs.py` sinh `captions.json`; `timeline.py` nhúng vào timeline; `CaptionLayer` vẽ.

- Mỗi từ là một `<text>` riêng → đo được, canh được, tô riêng được.
- `cue.accent` khớp **theo cụm** (có thể nhiều từ) → tô màu accent, gạch chân liền mạch.
- Nền luôn trắng; `cue.color` chỉ là màu nhấn.
- Tự co chữ theo `maxWidth`; viền đen + shadow; `instant` cho storyboard (không fade).
- Vị trí `y` do từng cue quyết định, không cố định.

Phụ đề rời: `out/<slug>/subtitles.srt|.vtt|.ass` (ASS giữ đúng font, cỡ, màu accent và vị trí `y` của từng cue).

---

## Âm thanh

| Lớp | Cách làm |
|---|---|
| Voice | `voice.engine` chọn `edge-tts` (mặc định) hoặc `vieneu`; mỗi line một file trong `public/<slug>/lines/`; ghép theo `at` |
| Pitch/volume | xử lý cục bộ (phase-vocoder + gain), nên hai engine cho cùng một chất line |
| Role DSP | `loa` (band-pass + drive), `echo`, `reverb`, `glass`, `double` |
| Music | numpy procedural, khớp độ dài video |
| SFX | numpy procedural, hoặc mẫu CC0 từ Lots of Sounds (`--remote`) |

### Voice engine

| `voice.engine` | Cần gì | `roles.*.id` | Ghi chú |
|---|---|---|---|
| `edge-tts` | mạng | `vi-VN-NamMinhNeural`, `vi-VN-HoaiMyNeural` | retry 12 lần backoff |
| `vieneu` | `pip install vieneu` (~1 GB model lần đầu) | preset: `Hải Đăng`, `Mai Anh`, `Adam bựa`, `Thùy Dung`… | 48 kHz, clone `ref_audio` 3–8s, `[cười]` `[thở dài]`, CPU RTF ≈ 0.5 |

Cache tách theo engine: `lines/L1.wav` (edge) và `lines/L1.vieneu.wav` (VieNeu) — đổi engine không
dùng lại nhầm file. Voice được chuẩn hoá EBU R128 hai pass về **-15 LUFS / -1.5 dBTP**
(`audio.voiceLufs` để đổi target). Nguồn VieNeu: https://github.com/pnnbao97/VieNeu-TTS (Apache 2.0).

`python video.py audio <slug> --remote --force` tải mẫu, cache vào `public/<slug>/sfx-src/`,
ghi `ATTRIBUTION.md` + `index.json`, rồi mix theo `sfxApi.cues`.

---

## Review gate

`python video.py review <slug>` → `out/<slug>/review/{review.html,review.json,contact-sheet.png}`.

Kiểm tra:

1. **Caption**: tràn `maxWidth`, đè vùng HUD, đè dock/end-card, chữ quá nhỏ.
2. **Motion**: so frame 0 với frame giữa ở 64x64 — cảnh gần như đứng yên bị cảnh báo (bỏ qua cảnh choice).
3. **Ánh sáng**: cảnh tối phải còn chủ thể nhìn thấy.
4. **Accent**: pixel vàng/đỏ có thực sự xuất hiện trong ảnh.
5. **Voice**: độ dài line vượt cảnh quá 1.6s.
6. **Cấu trúc**: số cảnh, timeline, audio, caption khớp nhau.

`--strict` biến warning thành fail. Chi tiết ngưỡng: `reference/qa.md`.

---

## CLI

| Lệnh | Việc |
|---|---|
| `doctor` | kiểm tra môi trường |
| `new <slug>` | tạo episode từ templates |
| `list` | liệt kê episode |
| `validate <slug>` | kiểm tra tĩnh project.json |
| `timeline <slug>` | sinh timeline.json |
| `subs <slug>` | sinh caption + SRT/VTT/ASS |
| `voice <slug> [--only Lx]` | tổng hợp giọng |
| `audio <slug> [--remote]` | nhạc + SFX |
| `sfx-search "<q>"` | tìm mẫu Lots of Sounds |
| `stills <slug> [--mid]` | ảnh storyboard |
| `frame <slug> <n>` | 1 frame |
| `review <slug> [--strict]` | cổng test lỗi |
| `render <slug> [--preview]` | MP4 |
| `build <slug>` | cả chuỗi |
| `pack` / `clone <dest>` | đóng gói / nhân bản |
| `clean <slug> [--media]` | xoá output |
| `studio` | mở Remotion Studio (port 3430) |

---

## Thêm một cảnh / thành phần mới

1. Thêm `S<n>` vào `shots[]` (dur, key, note).
2. Viết `export const S<n>` trong `shots.tsx`, dùng thành phần có sẵn trong `src/engine`.
3. Đăng ký trong `index.tsx` của episode.
4. Thêm caption cue + line nếu cần.
5. `python video.py stills <slug> --mid` → `review`.

Thành phần mới: đặt trong `src/engine/firstPerson.tsx` (hoặc file riêng), export qua `src/engine/index.ts`.
Giữ nguyên tắc: **hàm thuần của `t`**, không random, không đọc thời gian thực.

---

## Tính di động

- `pack` bỏ `node_modules`, `out`, `.mp4/.wav/.mp3`, `__pycache__`.
- `clone` copy sạch rồi `npm install`.
- Không có media bắt buộc ngoài fonts; nhạc/SFX sinh bằng numpy.
- `public/<slug>/sfx-src/*.mp3` là cache tuỳ chọn, có thể xoá — pipeline vẫn chạy procedural.

Dùng như OpenCode skill:

```powershell
New-Item -ItemType Junction -Path .opencode\skills\video-pipeline -Target D:\tools\video-pipeline
```

Skill ID lấy theo tên folder: `video-pipeline`.

---

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân / cách sửa |
|---|---|
| `NoAudioReceived` | edge-tts từ chối pitch/volume — chỉ gửi `rate`; pipeline đã xử lý cục bộ |
| voice fail lẻ tẻ | dịch vụ chập chờn; chạy lại `voice`, file cũ được giữ |
| caption tràn | giảm `size`, rút chữ, tăng `maxWidth` |
| chữ không hiện | cue sai `shot`, hoặc `start/end` ngoài cảnh |
| accent không màu | `accent` không khớp chính xác từ (dấu/hoa) |
| stills trắng | `composition` trong project.json không khớp `defineEpisode` id |
| render chậm | dùng `--preview` để duyệt, `--concurrency` cao hơn khi máy khoẻ |
| review FAIL oan | xem `review.json`, kiểm tra ngưỡng trong `reference/qa.md` |

---

## Ghi công

Engine SVG ban đầu từ `studio-nosleep/Stickman-studio` (đã lược bỏ media, giữ engine).
Style pack `firstPerson.tsx` viết cho pipeline này, dựa trên phân tích video tham chiếu 89.6s.
SFX tuỳ chọn: [Lots of Sounds](https://www.lotsofsounds.com) sample API (CC0 — kiểm tra license trước khi đăng).
