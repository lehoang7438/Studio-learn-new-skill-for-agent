"""Captions, generated from the voice track and styled like the reference short.

The reference does not use a bottom subtitle bar. It cuts to one short phrase at a time:
all caps, auto-sized to the frame, thick black outline, drop shadow, one accent word in
yellow or red, and a coloured underline. Phrase in, phrase out — the cut does the animating.

Outputs:
  src/episodes/<slug>/captions.json   the track the Remotion engine draws
  out/<slug>/captions.json            a copy for review
  out/<slug>/subtitles.srt|.vtt|.ass  for editors and platform upload
"""
from __future__ import annotations

import math
import re
import unicodedata
from pathlib import Path

from .common import ep_dir, load_json, load_project, out_dir, pub_dir, save_json

DEFAULT = {
    "maxChars": 22,
    "maxDur": 3.4,
    "minDur": 0.85,
    "size": 100,
    "maxWidth": 900,
    "y": 900,
    "accentColor": "#FFD24A",
    "warnColor": "#E8402F",
    "numberColor": "#FFD24A",
    "accentWords": [],
    "warnWords": [],
    "uppercase": True,
}


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFC", s).casefold()
    return re.sub(r"[^\w]", "", s)


def _words(text: str) -> list[str]:
    return [w for w in re.split(r"\s+", text.strip()) if w]


def _split_chunks(text: str, max_chars: int) -> list[list[str]]:
    """Greedy word chunks, preferring to break after punctuation."""
    tokens = _words(text)
    chunks: list[list[str]] = []
    cur: list[str] = []
    for w in tokens:
        candidate = " ".join(cur + [w])
        if cur and len(candidate) > max_chars:
            # if the previous word ended a clause, break there; otherwise break now
            chunks.append(cur)
            cur = [w]
        else:
            cur.append(w)
    if cur:
        chunks.append(cur)
    # a one-word chunk that can join its neighbour without overflow
    merged: list[list[str]] = []
    for c in chunks:
        if merged and len(" ".join(merged[-1] + c)) <= max_chars and (len(merged[-1]) == 1 or len(c) == 1):
            merged[-1] += c
        else:
            merged.append(c)
    return merged


def _line_times(line: dict, tokens: list[str], fallback_dur: float) -> list[tuple[float, float]]:
    """Per-token (start, end) in absolute seconds, from edge-tts word boundaries when present."""
    words = line.get("words") or []
    at = float(line.get("at", 0))
    dur = float(line.get("dur", 0)) or fallback_dur
    if words and len(words) >= max(1, len(tokens) - 2):
        out = []
        wi = 0
        for tok in tokens:
            nt = _norm(tok)
            best = None
            for j in range(wi, min(len(words), wi + 4)):
                if _norm(str(words[j].get("w", ""))) == nt:
                    best = j
                    break
            if best is None:
                # fall back to the next boundary
                best = min(wi, len(words) - 1)
            s = float(words[best].get("s", at))
            d = float(words[best].get("d", 0.25))
            out.append((s, s + max(0.12, d)))
            wi = best + 1
        return out
    # proportional fallback
    total_chars = sum(max(1, len(t)) for t in tokens) or 1
    t = at
    out = []
    for tok in tokens:
        d = max(0.18, dur * max(1, len(tok)) / total_chars)
        out.append((t, t + d))
        t += d
    return out


def _accent(tokens: list[str], cfg: dict) -> tuple[str | None, str | None]:
    """First accent or warning phrase in the cue, as written in the caption.

    Entries may be one word or a phrase ("VÔ LĂNG"), so match n-grams longest-first.
    """
    accents = [str(w) for w in cfg.get("accentWords", []) if str(w).strip()]
    warns = [str(w) for w in cfg.get("warnWords", []) if str(w).strip()]
    norm = [_norm(t) for t in tokens]

    def find(phrases: list[str]) -> str | None:
        for phrase in sorted(phrases, key=lambda p: len(_words(p)), reverse=True):
            parts = [_norm(p) for p in _words(phrase)]
            if not parts:
                continue
            for i in range(len(norm) - len(parts) + 1):
                if norm[i : i + len(parts)] == parts:
                    return " ".join(tokens[i : i + len(parts)])
        return None

    hit = find(warns)
    if hit:
        return hit, cfg.get("warnColor", DEFAULT["warnColor"])
    hit = find(accents)
    if hit:
        return hit, cfg.get("numberColor", DEFAULT["numberColor"])
    for tok, n in zip(tokens, norm):
        if re.fullmatch(r"\d+([.,]\d+)?", n or ""):
            return tok, cfg.get("numberColor", DEFAULT["numberColor"])
    return None, None


def generate(slug: str) -> list[dict]:
    project = load_project(slug)
    cfg = {**DEFAULT, **project.get("subtitles", {})}
    fps = int(project.get("fps", 30))
    max_chars = int(cfg["maxChars"])
    max_dur = float(cfg["maxDur"])
    min_dur = float(cfg["minDur"])

    shots = project.get("shots", [])
    shot_start, shot_end = {}, {}
    cur = 0.0
    for s in shots:
        shot_start[str(s["id"])] = cur
        cur += float(s.get("dur", 0))
        shot_end[str(s["id"])] = cur

    explicit = project.get("captions")
    cues: list[dict] = []

    if explicit:
        for i, c in enumerate(explicit):
            text = str(c.get("text", "")).strip()
            if not text:
                continue
            start = float(c.get("start", 0))
            end = float(c.get("end", start + 2))
            toks = _words(text)
            acc = c.get("accent")
            color = c.get("color")
            if acc is None or color is None:
                a2, c2 = _accent(toks, cfg)
                acc = acc or a2
                color = color or c2
            cues.append(
                {
                    "id": c.get("id", f"C{i + 1}"),
                    "start": round(max(0.0, start), 3),
                    "end": round(max(start + 0.4, end), 3),
                    "text": text,
                    "accent": acc,
                    "color": color,
                    "y": c.get("y", cfg["y"]),
                    "size": c.get("size", cfg["size"]),
                    "underline": bool(c.get("underline", bool(acc))),
                    "shot": c.get("shot", ""),
                }
            )
    else:
        lines = project.get("lines", [])
        lines_json = load_json(pub_dir(slug) / "lines.json", []) or []
        by_id = {str(l.get("id")): l for l in lines_json}
        fallback_dur = 2.0
        for line in lines:
            lid = str(line.get("id", ""))
            text = str(line.get("text", "")).strip()
            if not text:
                continue
            lj = by_id.get(lid, {})
            toks = _words(text)
            times = _line_times({**line, **{k: lj.get(k) for k in ("words", "dur", "at") if k in lj}}, toks, fallback_dur)
            chunks = _split_chunks(text, max_chars)
            ti = 0
            for ci, chunk in enumerate(chunks):
                first = ti
                last = ti + len(chunk) - 1
                ti = last + 1
                start = max(0.0, times[first][0] - 0.04)
                end = times[last][1] + 0.24
                # split an over-long chunk in half by words
                if end - start > max_dur and len(chunk) > 2:
                    mid = math.ceil(len(chunk) / 2)
                    parts = [chunk[:mid], chunk[mid:]]
                else:
                    parts = [chunk]
                pfirst = first
                for part in parts:
                    plast = pfirst + len(part) - 1
                    s0 = max(0.0, times[pfirst][0] - 0.04)
                    e0 = times[plast][1] + 0.24
                    if e0 - s0 < min_dur:
                        e0 = s0 + min_dur
                    txt = " ".join(part)
                    acc, color = _accent(part, cfg)
                    shot = str(line.get("shot", ""))
                    cues.append(
                        {
                            "id": f"{lid}-{ci + 1}" if len(parts) > 1 else lid,
                            "start": round(s0, 3),
                            "end": round(e0, 3),
                            "text": txt,
                            "accent": acc,
                            "color": color,
                            "y": cfg["y"],
                            "size": cfg["size"],
                            "underline": bool(acc),
                            "shot": shot,
                        }
                    )
                    pfirst = plast + 1

    # clamp to shots and remove overlaps (the newer cue wins the gap)
    for c in cues:
        sid = str(c.get("shot", ""))
        if sid in shot_end:
            c["start"] = max(c["start"], shot_start[sid])
            c["end"] = min(c["end"], shot_end[sid])
        c["start"] = max(0.0, c["start"])
        c["end"] = max(c["start"] + 0.35, c["end"])
    cues.sort(key=lambda c: (c["start"], c["end"]))
    for i in range(1, len(cues)):
        if cues[i]["start"] < cues[i - 1]["end"]:
            cues[i - 1]["end"] = max(cues[i - 1]["start"] + 0.35, cues[i]["start"] - 0.02)

    save_json(ep_dir(slug) / "captions.json", cues)
    save_json(out_dir(slug, create=True) / "captions.json", cues)
    write_subtitles(slug, cues, cfg)
    print(f"captions: {len(cues)} cues -> src/episodes/{slug}/captions.json")
    for c in cues:
        print(f"  {c['start']:5.2f}-{c['end']:5.2f}  {c['text']}" + (f"   [{c['accent']}]" if c.get("accent") else ""))
    return cues


# ---------------------------------------------------------------- exchange formats

def _stamp(sec: float, sep: str = ",") -> str:
    sec = max(0.0, sec)
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    ms = int(round((sec - math.floor(sec)) * 1000))
    if ms == 1000:
        s += 1
        ms = 0
    return f"{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}"


def write_subtitles(slug: str, cues: list[dict], cfg: dict) -> None:
    d = out_dir(slug, create=True)
    srt = []
    for i, c in enumerate(cues, 1):
        srt.append(f"{i}\n{_stamp(c['start'])} --> {_stamp(c['end'])}\n{c['text']}\n")
    (d / "subtitles.srt").write_text("\n".join(srt), encoding="utf-8")

    vtt = ["WEBVTT", ""]
    for c in cues:
        vtt.append(f"{_stamp(c['start'], '.')} --> {_stamp(c['end'], '.')}\n{c['text']}\n")
    (d / "subtitles.vtt").write_text("\n".join(vtt), encoding="utf-8")

    # ASS for an editor that wants the same look (1080x1920, bottom-anchored)
    def ass_time(sec: float) -> str:
        h = int(sec // 3600)
        m = int((sec % 3600) // 60)
        s = sec % 60
        return f"{h}:{m:02d}:{s:05.2f}"

    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Anton,{int(cfg['size'])},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,{int(cfg['size']*0.14)},4,2,40,40,{int(1920 - cfg['y'])},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    def ass_color(hexstr: str) -> str:
        h = hexstr.lstrip("#")
        return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}&"

    rows = []
    for c in cues:
        text = c["text"].replace("\n", "\\N")
        accent = str(c.get("accent") or "").strip()
        color = c.get("color") or cfg.get("accentColor") or "#FFD24A"
        # Only the accent phrase changes colour, and it gets the same underline as the renderer.
        if accent:
            idx = text.lower().find(accent.lower())
            if idx >= 0:
                run = text[idx : idx + len(accent)]
                text = text[:idx] + f"{{\\c{ass_color(color)}\\u1}}" + run + "{\\c&H00FFFFFF&\\u0}" + text[idx + len(accent) :]
        # Each cue keeps its own vertical placement: world y -> canvas y (y + 420) -> margin from the bottom.
        size = float(c.get("size", cfg.get("size", 100)))
        y = float(c.get("y", cfg.get("y", 900)))
        margin = int(max(40, round(1920 - (y + 420 + size * 0.2))))
        rows.append(
            f"Dialogue: 0,{ass_time(c['start'])},{ass_time(c['end'])},Caption,,0,0,{margin},,{text}"
        )
    (d / "subtitles.ass").write_text(head + "\n".join(rows) + "\n", encoding="utf-8")
