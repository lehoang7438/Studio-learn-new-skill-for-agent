"""Build timeline.json (the file the Remotion engine reads) from project.json.

The cut is deterministic: shots play in order, each for its own `dur`. Lines are placed at
absolute seconds. No word-timing guesswork, so a cut never drifts when the voice changes.
"""
from __future__ import annotations

from pathlib import Path

from .common import FPS, composition_of, ep_dir, load_json, load_project, out_dir, pub_dir, save_json


def _cue(cue: str, starts: dict[str, int], line_starts: dict[str, int], total: int, fps: int) -> int:
    cue = str(cue).strip()
    if cue.startswith("f:"):
        return int(round(float(cue[2:])))
    if cue.startswith("s:"):
        return int(round(float(cue[2:]) * fps))
    if cue == "end":
        return total
    if cue.startswith("end-"):
        return total - int(cue[4:])
    if cue.startswith("end+"):
        return total + int(cue[4:])
    base, _, off = cue.partition("+")
    off_f = int(off) if off else 0
    if base in starts:
        return starts[base] + off_f
    if base in line_starts:
        return line_starts[base] + off_f
    raise ValueError(f"bad cue '{cue}' (use s:4.2, f:120, S3+10, L2+5, end-30)")


def build_timeline(slug: str, quiet: bool = False) -> dict:
    project = load_project(slug)
    fps = int(project.get("fps", FPS))
    shots = project.get("shots", [])
    if not shots:
        raise SystemExit(f"{slug}: project.json has no shots")

    segments = []
    shot_meta = []
    cursor = 0
    starts: dict[str, int] = {}
    for s in shots:
        dur = float(s.get("dur", 0))
        if dur <= 0:
            raise SystemExit(f"{slug}: shot {s.get('id')} has dur <= 0")
        a = cursor
        b = cursor + max(1, int(round(dur * fps)))
        starts[str(s["id"])] = a
        segments.append({"shot": s["id"], "a": a, "b": b, "t0": 0, "t1": b - a, "line": ""})
        shot_meta.append(s)
        cursor = b

    total = cursor
    lines = project.get("lines", [])
    line_starts: dict[str, int] = {}
    for line in lines:
        at = float(line.get("at", 0))
        line_starts[str(line.get("id"))] = int(round(at * fps))

    # captions: the spoken words inside each span (for the storyboard)
    for seg in segments:
        inside = [l for l in lines if l.get("shot") == seg["shot"]]
        seg["line"] = " ".join(str(l.get("text", "")) for l in inside)

    fx = []
    for f in project.get("fx", []):
        try:
            frame = _cue(f.get("at", "f:0"), starts, line_starts, total, fps)
        except ValueError as e:
            raise SystemExit(f"{slug}: fx {f}: {e}")
        entry = {k: v for k, v in f.items() if k != "at"}
        entry["f"] = max(0, min(total - 1, frame))
        fx.append(entry)

    meta = {str(s["id"]): s for s in shot_meta}
    out_shots = []
    for seg in segments:
        m = meta[seg["shot"]]
        length = seg["b"] - seg["a"]
        key = int(m.get("key", length // 2))
        out_shots.append(
            {
                "id": seg["shot"],
                "size": m.get("size", ""),
                "key": max(0, min(length - 1, key)),
                "len": length,
                "first": seg["a"],
                "line": seg["line"],
                "caption": m.get("caption", ""),
                "note": m.get("note", ""),
                "scene": m.get("scene", ""),
            }
        )

    audio = {"voice": f"{slug}/voice.wav", "voiceVol": 1.0}
    if (pub_dir(slug) / "sfx.wav").exists():
        audio["sfx"] = f"{slug}/sfx.wav"
        audio["sfxVol"] = float(project.get("audio", {}).get("sfxVol", 1.0))
    if (pub_dir(slug) / "music.wav").exists():
        audio["music"] = f"{slug}/music.wav"
        audio["musicVol"] = float(project.get("audio", {}).get("musicVol", 0.16))
    if not (pub_dir(slug) / "voice.wav").exists():
        audio.pop("voice")
        audio.pop("voiceVol")

    timeline = {
        "slug": slug,
        "composition": composition_of(project),
        "title": project.get("title", slug),
        "fps": fps,
        "total": total,
        "segments": segments,
        "shots": out_shots,
        "fx": fx,
        "audio": audio,
        "captions": [],
    }
    caps = load_json(ep_dir(slug) / "captions.json", []) or []
    if not caps:
        # no generated track yet: one cue per line, so a still/render is never captionless
        caps = [
            {
                "start": float(l.get("at", 0)),
                "end": min(total / fps, float(l.get("at", 0)) + 2.4),
                "text": str(l.get("text", "")),
                "accent": None,
                "color": None,
                "y": project.get("subtitles", {}).get("y", 900),
                "size": project.get("subtitles", {}).get("size", 100),
            }
            for l in lines
            if str(l.get("text", "")).strip()
        ]
    timeline["captions"] = [
        {
            "a": max(0, int(round(float(c.get("start", 0)) * fps))),
            "b": min(total, int(round(float(c.get("end", 0)) * fps))),
            "text": str(c.get("text", "")),
            "accent": c.get("accent"),
            "color": c.get("color"),
            "y": c.get("y", project.get("subtitles", {}).get("y", 900)),
            "size": c.get("size", project.get("subtitles", {}).get("size", 100)),
            "underline": bool(c.get("underline", False)),
        }
        for c in caps
        if str(c.get("text", "")).strip()
    ]
    save_json(ep_dir(slug) / "timeline.json", timeline)
    # keep a copy in out/ so the review gate and a shared folder are self-contained
    save_json(out_dir(slug, create=True) / "timeline.json", timeline)
    if not quiet:
        print(f"timeline: {total} frames ({total / fps:.2f}s), {len(segments)} shots, {len(fx)} fx")
        for s in segments:
            m = meta[s["shot"]]
            print(f"  {s['shot']:4s} {s['a']:5d}-{s['b']:5d} {s['b'] - s['a']:4d}f  {str(m.get('caption', ''))[:48]}")
    return timeline
