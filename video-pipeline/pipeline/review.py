"""The review gate: stills + audio + video checks, a contact sheet, and a shareable report.

`python video.py review <slug>` is the stage that catches the boring failures before export:
a missing caption, a shot that renders black, a line that runs past its cut, a voice track that
is 4 seconds longer than the picture, a silent music bed, a wrong resolution, a frozen shot.
"""
from __future__ import annotations

import base64
import io
import json
import math
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from .common import OUT, ffmpeg, ffprobe, load_json, load_project, out_dir, pub_dir, rel, run, save_json
from .validate import issue, validate_project


# ---------------------------------------------------------------- helpers

def _font(size: int, bold: bool = False):
    names = ["arialbd.ttf", "arial.ttf", "segoeuib.ttf", "segoeui.ttf", "DejaVuSans.ttf"]
    base = Path("C:/Windows/Fonts")
    for n in names:
        p = base / n
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size)
            except Exception:
                pass
    return ImageFont.load_default()


def _luma(a: np.ndarray) -> np.ndarray:
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def _ahash(a: np.ndarray) -> int:
    img = Image.fromarray(a).convert("L").resize((8, 8), Image.Resampling.BOX)
    v = np.asarray(img, dtype=np.float64)
    bits = (v > v.mean()).flatten()
    h = 0
    for b in bits:
        h = (h << 1) | int(b)
    return h


def _hamming(a: int, b: int) -> int:
    return int((a ^ b).bit_count())


def analyze_image(path: Path, scene: str, caption: str, cue_y: float | None = None, cue_size: float | None = None) -> dict:
    img = Image.open(path).convert("RGB")
    a = np.asarray(img)
    h, w = a.shape[:2]
    lum = _luma(a)
    mean = float(lum.mean())
    std = float(lum.std())
    colors = int(len(np.unique((a // 24).reshape(-1, 3), axis=0)))
    bright = float((lum > 232).mean())
    dark = float((lum < 8).mean())
    checks = []
    if (w, h) != (1080, 1920):
        checks.append(issue("FAIL", "still.size", f"still is {w}x{h}, expected 1080x1920", "check studio.config.ts and the composition size"))
    if std < 3.2 or colors < 24:
        checks.append(issue("FAIL", "still.blank", f"still looks blank (std {std:.1f}, {colors} colours)", "the shot may have thrown; open the still and the Remotion log"))
    if mean < 5 and scene not in ("dark", "choice", "black"):
        checks.append(issue("WARN", "still.dark", f"still is almost black (mean {mean:.1f})", "check the set / lights for this shot"))
    # caption visibility: bright glyphs in a band around the cue's own baseline.
    # cues are in world coordinates; the vertical canvas shows world y = canvas y - 420.
    if caption and scene != "choice":
        size = float(cue_size or 100)
        cy = (float(cue_y) if cue_y is not None else 900) + 420
        y0 = max(0, int(cy - size * 1.05))
        y1 = min(h, int(cy + size * 0.2))
        band = a[y0:y1, :]
        r, g, b = band[..., 0], band[..., 1], band[..., 2]
        # the caption is white with an accent word in yellow or red; all three must count
        glyph_mask = ((r > 225) & (g > 225) & (b > 225)) | ((r > 190) & (g > 130) & (b < 130)) | ((r > 160) & (g < 110) & (b < 100))
        glyph = float(glyph_mask.mean())
        if glyph < 0.0035:
            checks.append(issue("FAIL", "caption.missing", f"caption text is not visible around y={int(cy)}", "render the still and check Caption props (text, start, y, size)"))
        else:
            ys, xs = np.where(glyph_mask)
            if xs.size:
                x0, x1 = int(xs.min()), int(xs.max())
                if x0 < 34 or x1 > w - 34:
                    checks.append(issue("WARN", "caption.edge", "caption touches the frame edge", "shorten it or reduce the caption size"))
    # HUD visibility (the dock establishing shot may deliberately have no HUD)
    if scene in ("cabin", "deck", "mirror", "switch"):
        top = lum[80:250, :]
        if float((top > 180).mean()) < 0.002:
            checks.append(issue("WARN", "hud.missing", "HUD readout is not visible in the top band", "check the Hud component and its boot frame"))
    return {
        "width": w,
        "height": h,
        "mean": round(mean, 2),
        "std": round(std, 2),
        "colors": colors,
        "bright": round(bright, 4),
        "dark": round(dark, 4),
        "hash": _ahash(a),
        "sig": np.asarray(Image.fromarray(a).convert("L").resize((64, 64), Image.Resampling.BOX), dtype=np.float64),
        "checks": checks,
    }


def audio_stats(path: Path) -> dict:
    if not path.exists():
        return {"exists": False}
    r = subprocess.run(
        [ffmpeg(), "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
    )
    txt = r.stderr
    summ = txt[txt.rfind("Summary:") :] if "Summary:" in txt else txt[-4000:]
    i = re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", summ)
    p = re.search(r"Peak:\s+(-?[\d.]+|-inf) dBFS", summ)
    lufs = float(i.group(1)) if i and i.group(1) != "-inf" else float("-inf")
    peak = float(p.group(1)) if p and p.group(1) != "-inf" else float("-inf")
    dur = 0.0
    r2 = subprocess.run([ffprobe(), "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    try:
        dur = float(r2.stdout.strip())
    except ValueError:
        pass
    return {"exists": True, "lufs": lufs, "peak": peak, "duration": round(dur, 3), "path": rel(path)}


def video_stats(path: Path) -> dict:
    if not path.exists():
        return {"exists": False}
    r = subprocess.run(
        [ffprobe(), "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
    )
    try:
        data = json.loads(r.stdout)
    except Exception:
        return {"exists": True, "error": "ffprobe failed"}
    v = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), {})
    a = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), {})
    fr = v.get("avg_frame_rate", "0/0")
    try:
        num, den = fr.split("/")
        fps = float(num) / float(den) if float(den) else 0
    except Exception:
        fps = 0
    return {
        "exists": True,
        "duration": float(data.get("format", {}).get("duration", 0) or 0),
        "width": v.get("width"),
        "height": v.get("height"),
        "fps": round(fps, 2),
        "video": v.get("codec_name"),
        "audio": a.get("codec_name"),
        "size": int(data.get("format", {}).get("size", 0) or 0),
    }


def black_spans(path: Path) -> list[dict]:
    r = subprocess.run(
        [ffmpeg(), "-hide_banner", "-nostats", "-i", str(path), "-vf", "blackdetect=d=0.12:pix_th=0.02", "-an", "-f", "null", "-"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
    )
    spans = []
    for m in re.finditer(r"black_start:([\d.]+) black_end:([\d.]+)", r.stderr):
        spans.append({"start": float(m.group(1)), "end": float(m.group(2))})
    return spans


# ---------------------------------------------------------------- contact sheet

def contact_sheet(rows: list[dict], out: Path, title: str) -> Path:
    cols = 4
    tw, th = 270, 480
    label_h = 38
    head = 78
    n = len(rows)
    rows_n = max(1, math.ceil(n / cols))
    W = cols * tw
    H = head + rows_n * (th + label_h)
    sheet = Image.new("RGB", (W, H), (10, 12, 18))
    d = ImageDraw.Draw(sheet)
    d.text((18, 18), title[:64], font=_font(28, True), fill=(244, 238, 226))
    d.text((18, 50), f"{n} shots  ·  review sheet", font=_font(16), fill=(143, 163, 188))
    for i, row in enumerate(rows):
        r, c = divmod(i, cols)
        x, y = c * tw, head + r * (th + label_h)
        p = row.get("still")
        if p and Path(p).exists():
            im = Image.open(p).convert("RGB").resize((tw, th), Image.Resampling.LANCZOS)
            sheet.paste(im, (x, y))
        d.rectangle([x, y, x + tw - 1, y + th + label_h - 1], outline=(32, 44, 62))
        status = row.get("status", "PASS")
        color = {"PASS": (91, 224, 138), "WARN": (242, 179, 61), "FAIL": (232, 64, 47)}.get(status, (143, 163, 188))
        d.rectangle([x, y + th, x + tw, y + th + label_h], fill=(16, 22, 34))
        d.rectangle([x, y + th, x + 6, y + th + label_h], fill=color)
        d.text((x + 14, y + th + 9), f"{row.get('id', '?')}  {status}", font=_font(16, True), fill=color)
        d.text((x + 92, y + th + 10), str(row.get("caption", "")).replace("\n", " ")[:20], font=_font(13), fill=(210, 220, 235))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=92)
    return out


# ---------------------------------------------------------------- report

def _b64(path: Path, width: int = 360) -> str:
    im = Image.open(path).convert("RGB")
    im.thumbnail((width, 2000), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, format="JPEG", quality=82)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def write_report(slug: str, project: dict, rows: list[dict], issues: list[dict], audio: dict, video: dict, sheet: Path) -> Path:
    review_dir = out_dir(slug, create=True) / "review"
    review_dir.mkdir(exist_ok=True)
    counts = {k: sum(1 for i in issues if i["level"] == k) for k in ("FAIL", "WARN")}
    verdict = "FAIL" if counts["FAIL"] else ("WARN" if counts["WARN"] else "PASS")
    data = {
        "slug": slug,
        "title": project.get("title"),
        "verdict": verdict,
        "counts": counts,
        "issues": issues,
        "shots": [{k: v for k, v in r.items() if k != "image"} for r in rows],
        "audio": audio,
        "video": video,
    }
    save_json(review_dir / "review.json", data)

    md = [f"# Review — {project.get('title', slug)}", "", f"**Verdict: {verdict}** · {counts['FAIL']} fail · {counts['WARN']} warn", ""]
    if issues:
        md += ["## Issues", ""]
        for i in issues:
            md.append(f"- **{i['level']}** `{i['code']}` {i.get('shot', '')} — {i['msg']}" + (f" → {i['fix']}" if i.get("fix") else ""))
        md.append("")
    md += ["## Shots", "", "| # | Shot | Status | Caption | Note |", "|---|---|---|---|---|"]
    for r in rows:
        md.append(f"| {r.get('n')} | {r.get('id')} | {r.get('status')} | {str(r.get('caption', '')).replace('|', '/')[:44]} | {str(r.get('note', ''))[:60]} |")
    md += ["", "## Audio", "", f"- voice: {audio.get('voice')}", f"- music: {audio.get('music')}", f"- sfx: {audio.get('sfx')}"]
    if video.get("exists"):
        md += ["", "## Video", "", f"- {video.get('width')}x{video.get('height')} @ {video.get('fps')}fps, {video.get('duration')}s, audio={video.get('audio')}"]
    (review_dir / "review.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    cards = []
    for r in rows:
        p = r.get("still")
        img = f'<img src="{_b64(Path(p))}" alt="{r.get("id")}">' if p and Path(p).exists() else ""
        bullets = "".join(f"<li class='{c['level'].lower()}'>{c['msg']}</li>" for c in r.get("checks", [])) or "<li class='ok'>no shot-level issues</li>"
        cards.append(
            f"""<article class="card {r.get('status','PASS').lower()}">
  <div class="thumb">{img}</div>
  <div class="meta"><div class="row"><b>{r.get('id')}</b><span class="badge {r.get('status','PASS').lower()}">{r.get('status')}</span></div>
  <p class="cap">{str(r.get('caption','')).replace(chr(10), '<br>')}</p>
  <p class="note">{str(r.get('note',''))}</p><ul>{bullets}</ul></div>
</article>"""
        )
    issue_rows = "".join(
        f"<tr><td class='{i['level'].lower()}'>{i['level']}</td><td><code>{i['code']}</code></td><td>{i.get('shot','')}</td><td>{i['msg']}<br><small>{i.get('fix','')}</small></td></tr>"
        for i in issues
    ) or "<tr><td colspan=4>No issues.</td></tr>"
    html = f"""<!doctype html><meta charset="utf-8"><title>Review — {project.get('title', slug)}</title>
<style>
:root{{color-scheme:dark}}body{{margin:0;background:#070a10;color:#f4eee2;font:15px/1.5 "Segoe UI",system-ui,sans-serif}}
header{{padding:28px 32px;border-bottom:1px solid #1d2a3d}}h1{{margin:0;font-size:26px}}h1 small{{color:#8fa3bc;font-weight:400}}
.verdict{{display:inline-block;margin-top:10px;padding:6px 14px;border-radius:999px;font-weight:700}}
.verdict.pass{{background:#123a25;color:#5be08a}}.verdict.warn{{background:#3a2a08;color:#f2b33d}}.verdict.fail{{background:#3a0f0b;color:#ff7a6a}}
.stats{{display:flex;gap:22px;margin-top:14px;color:#8fa3bc}}.stats b{{color:#f4eee2}}
main{{padding:24px 32px;max-width:1500px;margin:auto}}
table{{width:100%;border-collapse:collapse;margin:16px 0 28px}}td,th{{padding:8px 10px;border-bottom:1px solid #1a2638;text-align:left;vertical-align:top}}
td.fail{{color:#ff7a6a}}td.warn{{color:#f2b33d}}code{{color:#8fc4ff}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}}
.card{{background:#0c121d;border:1px solid #1d2a3d;border-radius:14px;overflow:hidden;display:flex;flex-direction:column}}
.card.fail{{border-color:#6b2019}}.card.warn{{border-color:#6b4a12}}
.thumb img{{display:block;width:100%;height:auto}}
.meta{{padding:10px 12px}}.row{{display:flex;justify-content:space-between;align-items:center}}
.badge{{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:700}}.badge.pass{{background:#123a25;color:#5be08a}}.badge.warn{{background:#3a2a08;color:#f2b33d}}.badge.fail{{background:#3a0f0b;color:#ff7a6a}}
.cap{{margin:6px 0;font-weight:600}}.note{{margin:0;color:#8fa3bc;font-size:12px}}
ul{{margin:8px 0 0;padding-left:16px;font-size:12px}}li.fail{{color:#ff7a6a}}li.warn{{color:#f2b33d}}li.ok{{color:#5be08a}}
.sheet img{{max-width:100%;border-radius:12px;border:1px solid #1d2a3d}}
</style>
<header><h1>Review — {project.get('title', slug)} <small>{slug}</small></h1>
<div class="verdict {verdict.lower()}">{verdict}</div>
<div class="stats"><span><b>{counts['FAIL']}</b> fail</span><span><b>{counts['WARN']}</b> warn</span><span><b>{len(rows)}</b> shots</span><span><b>{audio.get('voice',{}).get('duration','–')}</b> s voice</span></div></header>
<main>
<h2>Issues</h2><table><tr><th>Level</th><th>Code</th><th>Shot</th><th>What to fix</th></tr>{issue_rows}</table>
<h2>Contact sheet</h2><p class="sheet"><img src="{_b64(sheet, 1080)}" alt="contact sheet"></p>
<h2>Shots</h2><div class="grid">{''.join(cards)}</div>
</main>"""
    (review_dir / "review.html").write_text(html, encoding="utf-8")
    return review_dir


# ---------------------------------------------------------------- the gate

def review(slug: str, strict: bool = False) -> tuple[bool, Path]:
    project = load_project(slug)
    timeline = load_json(out_dir(slug) / "timeline.json")
    issues = validate_project(project)
    if not timeline:
        issues.append(issue("FAIL", "timeline.missing", "timeline.json is missing", f"run: python video.py timeline {slug}"))
        timeline = {"shots": [], "total": 0, "fps": 30}

    fps = int(timeline.get("fps", project.get("fps", 30)))
    total = float(timeline.get("total", 0)) / fps if fps else 0
    board = out_dir(slug) / "board"
    motion = out_dir(slug) / "review" / "frames"
    rows = []
    prev_hash = None
    for i, shot in enumerate(timeline.get("shots", [])):
        sid = str(shot.get("id"))
        p = board / f"{sid}.png"
        checks = []
        info = {}
        if not p.exists():
            checks.append(issue("FAIL", "still.missing", f"{sid}: no still", f"run: python video.py stills {slug}", sid))
            status = "FAIL"
        else:
            # the board frame is the shot's key frame on the global clock; find the cue drawn there
            frame = int(shot.get("first", 0)) + int(shot.get("key", 0))
            cue = next((c for c in timeline.get("captions", []) if int(c.get("a", 0)) <= frame < int(c.get("b", 0))), None)
            info = analyze_image(
                p,
                str(shot.get("scene", "")),
                str(shot.get("caption", "")),
                cue.get("y") if cue else None,
                cue.get("size") if cue else None,
            )
            checks += info.get("checks", [])
            if prev_hash is not None and _hamming(prev_hash, info["hash"]) <= 2:
                checks.append(issue("WARN", "still.duplicate", f"{sid}: almost identical to the previous shot", "vary the framing, blocking or light", sid))
            prev_hash = info["hash"]
            status = "FAIL" if any(c["level"] == "FAIL" for c in checks) else ("WARN" if checks else "PASS")
        # optional motion frame
        mf = motion / f"{sid}.png"
        if mf.exists():
            frame_m = int(shot.get("first", 0)) + ((int(shot.get("key", 0)) + max(12, int(shot.get("len", 1)) // 3)) % max(1, int(shot.get("len", 1))))
            cue_m = next((c for c in timeline.get("captions", []) if int(c.get("a", 0)) <= frame_m < int(c.get("b", 0))), None)
            mi = analyze_image(
                mf,
                str(shot.get("scene", "")),
                str(shot.get("caption", "")) if cue_m else "",
                cue_m.get("y") if cue_m else None,
                cue_m.get("size") if cue_m else None,
            )
            if info and mi.get("sig") is not None and shot.get("scene") != "choice":
                diff = float(np.abs(info["sig"] - mi["sig"]).mean())
                if diff < 0.75:
                    checks.append(issue("WARN", "shot.static", f"{sid}: key and mid frames are nearly identical (diff {diff:.2f})", "add motion (t-driven pose, camera push, rain, light)", sid))
            checks += [c for c in mi.get("checks", []) if c["code"] in ("still.blank", "caption.missing")]
        issues += checks
        rows.append(
            {
                "n": i + 1,
                "id": sid,
                "caption": shot.get("caption", ""),
                "note": shot.get("note", ""),
                "status": status,
                "still": str(p) if p.exists() else "",
                "motion": str(mf) if mf.exists() else "",
                "checks": checks,
            }
        )

    # ---- audio
    voice_path = pub_dir(slug) / "voice.wav"
    music_path = pub_dir(slug) / "music.wav"
    sfx_path = pub_dir(slug) / "sfx.wav"
    audio = {"voice": audio_stats(voice_path), "music": audio_stats(music_path), "sfx": audio_stats(sfx_path)}
    v = audio["voice"]
    if not v.get("exists"):
        issues.append(issue("FAIL", "audio.voice_missing", "voice.wav is missing", f"run: python video.py voice {slug}"))
    else:
        if total and abs(v["duration"] - total) > 1.6:
            issues.append(
                issue(
                    "WARN",
                    "audio.voice_length",
                    f"voice.wav is {v['duration']:.2f}s but the picture is {total:.2f}s",
                    "re-run `timeline` and `voice`, or adjust shot durations",
                )
            )
        if v["lufs"] < -30:
            issues.append(issue("WARN", "audio.quiet", f"voice is very quiet ({v['lufs']:.1f} LUFS)", "raise role volume or normalize"))
        if v["lufs"] > -8:
            issues.append(issue("WARN", "audio.hot", f"voice is very hot ({v['lufs']:.1f} LUFS)", "lower role volume"))
        if v["peak"] > -0.2:
            issues.append(issue("WARN", "audio.clip", f"voice peak is {v['peak']:.1f} dBFS", "leave at least 1 dB of headroom"))
    if project.get("audio", {}).get("music", True) and not music_path.exists():
        issues.append(issue("WARN", "audio.music_missing", "music.wav is missing", f"run: python video.py audio {slug}"))
    if project.get("audio", {}).get("sfx", True) and not sfx_path.exists():
        issues.append(issue("WARN", "audio.sfx_missing", "sfx.wav is missing", f"run: python video.py audio {slug}"))
    if music_path.exists() and audio["music"].get("lufs", -99) < -45:
        issues.append(issue("WARN", "audio.music_silent", "music bed is effectively silent", "regenerate it with --force or add your own"))

    # ---- lines vs. real voice durations
    lines = load_json(pub_dir(slug) / "lines.json", []) or []
    shot_end = {}
    for shot in timeline.get("shots", []):
        shot_end[str(shot["id"])] = (float(shot["first"]) + float(shot["len"])) / fps
    for line in lines:
        end = float(line.get("at", 0)) + float(line.get("dur", 0))
        sid = str(line.get("shot", ""))
        if sid in shot_end and end > shot_end[sid] + 0.35:
            issues.append(
                issue("WARN", "line.overrun", f"{line.get('id')}: voice ends {end - shot_end[sid]:.2f}s after {sid}", "lengthen the shot, move the line earlier, or shorten the text", sid)
            )

    # ---- video
    mp4 = out_dir(slug) / f"{slug}.mp4"
    video = video_stats(mp4)
    if video.get("exists"):
        if (video.get("width"), video.get("height")) != (1080, 1920):
            issues.append(issue("FAIL", "video.size", f"video is {video.get('width')}x{video.get('height')}", "render at 1080x1920"))
        if abs(float(video.get("fps", 0)) - 30) > 0.2:
            issues.append(issue("WARN", "video.fps", f"video is {video.get('fps')} fps", "the engine and compositions use 30"))
        if not video.get("audio"):
            issues.append(issue("FAIL", "video.audio", "the export has no audio stream", "check the timeline audio block and the render flags"))
        if not str(mp4.name).endswith("-preview.mp4") and total and abs(float(video.get("duration", 0)) - total) > 0.7:
            issues.append(issue("WARN", "video.length", f"video is {video.get('duration')}s, timeline is {total:.2f}s", "re-render; check the composition duration"))
        spans = black_spans(mp4)
        if spans:
            issues.append(issue("WARN", "video.black", f"{len(spans)} black span(s) detected (first at {spans[0]['start']:.2f}s)", "intentional for an end card; otherwise check the shots"))
    else:
        issues.append(issue("PASS", "video.pending", "no MP4 yet — review the stills, then render", f"python video.py render {slug}"))

    # ---- report
    sheet = contact_sheet(rows, out_dir(slug) / "review" / "contact-sheet.png", f"{project.get('title', slug)}")
    review_dir = write_report(slug, project, rows, issues, audio, video, sheet)

    fails = sum(1 for i in issues if i["level"] == "FAIL")
    warns = sum(1 for i in issues if i["level"] == "WARN")
    verdict = "FAIL" if fails or (strict and warns) else ("WARN" if warns else "PASS")
    print(f"review: {verdict} — {fails} fail, {warns} warn, {len(rows)} shots")
    for i in issues:
        if i["level"] in ("FAIL", "WARN"):
            print(f"  [{i['level']}] {i['code']} {i.get('shot', '')}: {i['msg']}")
    print(f"  report: {rel(review_dir / 'review.html')}")
    print(f"  sheet:  {rel(sheet)}")
    return verdict != "FAIL", review_dir
