"""Static checks for project.json: the cheap failures, caught before a single frame renders."""
from __future__ import annotations

import re

from .common import FPS, total_seconds
from .contract import check_contract

KNOWN_SCENES = {
    "cabin",
    "dock",
    "deck",
    "mirror",
    "radio",
    "radio-msg",
    "switch",
    "dark",
    "choice",
    "black",
    "insert",
    "character",
    "corridor",
    "closeup",
    # chuyen-xe (16:9): the road set and the dashcam screen
    "wide",
    "screen",
}

VOICE_RE = re.compile(r"^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$")
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
FX_RE = re.compile(r"^(?:(?:f|s):-?\d+(?:\.\d+)?|end(?:-\d+)?|(?!end\+)[A-Za-z][A-Za-z0-9_]*\+\d+)$")


def issue(level: str, code: str, msg: str, fix: str = "", shot: str = "") -> dict:
    return {"level": level, "code": code, "msg": msg, "fix": fix, "shot": shot}


def valid_fx_cue(cue) -> bool:
    """f:n | s:n | end | end-n | S1+10 | L2+5 (mirrors timeline's cue grammar)."""
    return bool(FX_RE.match(str(cue).strip()))


def validate_project(project: dict) -> list[dict]:
    out: list[dict] = []
    for key in ("slug", "title", "shots", "lines"):
        if key not in project:
            out.append(issue("FAIL", "schema.missing", f"project.json is missing '{key}'", f"add \"{key}\""))
    if out:
        return out + check_contract(project.get("slug"))

    shots = project.get("shots", [])
    lines = project.get("lines", [])
    if not shots:
        return [issue("FAIL", "shots.empty", "no shots", "add at least one shot")] + check_contract(project.get("slug"))

    slug = str(project.get("slug", "")).strip()
    if not slug or not SLUG_RE.match(slug):
        out.append(issue("FAIL", "project.slug", f"invalid slug '{slug}'", "use lowercase words joined by single hyphens"))

    try:
        size_ok = int(project.get("width")) == 1080 and int(project.get("height")) == 1920
    except (TypeError, ValueError):
        size_ok = False
    if not size_ok:
        out.append(issue("FAIL", "project.size", f"size is {project.get('width')}x{project.get('height')}, expected 1080x1920", "set width=1080 and height=1920"))

    try:
        project_fps = int(project.get("fps", FPS))
    except (TypeError, ValueError):
        project_fps = None
    if project_fps != FPS:
        out.append(issue("WARN", "project.fps", f"project.fps={project.get('fps')!r} ignored; the engine runs at {FPS}", "set fps to 30"))

    ids = [str(s.get("id", "")) for s in shots]
    if len(set(ids)) != len(ids):
        out.append(issue("FAIL", "shots.duplicate", "shot ids are not unique", "rename the duplicate ids"))
    shot_starts: dict[str, float] = {}
    shot_ends: dict[str, float] = {}
    scene_of: dict[str, str] = {}
    cursor = 0.0
    for s in shots:
        sid = str(s.get("id", "?"))
        if not sid:
            out.append(issue("FAIL", "shot.id", "a shot has no id", "give every shot an id (S1, S2...)"))
        try:
            dur = float(s.get("dur", 0))
            dur_ok = True
        except (TypeError, ValueError):
            dur = 0.0
            dur_ok = False
            out.append(issue("FAIL", "shot.dur", f"{sid}: dur is not a number", "set the shot length in seconds", sid))
        if dur_ok and dur <= 0:
            out.append(issue("FAIL", "shot.dur", f"{sid}: dur must be > 0", "set the shot length in seconds", sid))
        scene = str(s.get("scene", ""))
        scene_of[sid] = scene
        if scene and scene not in KNOWN_SCENES:
            out.append(issue("WARN", "shot.scene", f"{sid}: unknown scene '{scene}'", f"use one of {', '.join(sorted(KNOWN_SCENES))}", sid))
        cap = str(s.get("caption", "") or "")
        for line in cap.split("\n"):
            if len(line) > 30:
                out.append(
                    issue(
                        "WARN",
                        "caption.long",
                        f"{sid}: caption line is {len(line)} chars — it may overflow at 1080px",
                        "split the line with \\n or shorten it (aim <= 26 chars)",
                        sid,
                    )
                )
        if "key" in s:
            try:
                key = int(s.get("key", 0))
                if not (0 <= key < max(1, int(dur * FPS))):
                    out.append(issue("WARN", "shot.key", f"{sid}: key frame is outside the shot", "keep key inside the shot's frames", sid))
            except (TypeError, ValueError):
                out.append(issue("WARN", "shot.key", f"{sid}: key is not an integer", "use a frame number within the shot", sid))
        shot_starts[sid] = cursor
        cursor += dur
        shot_ends[sid] = cursor

    try:
        total = total_seconds(project)
    except (TypeError, ValueError):
        total = 0.0  # shot.dur above already reports the bad value
    if total < 6:
        out.append(issue("WARN", "duration.short", f"episode is only {total:.1f}s", "a Reels teaser is usually 20–60s"))
    if total > 180:
        out.append(issue("WARN", "duration.long", f"episode is {total:.0f}s", "split it into parts or shorten shots"))

    line_ids = [str(l.get("id", "")) for l in lines]
    if len(set(line_ids)) != len(line_ids):
        out.append(issue("FAIL", "lines.duplicate", "line ids are not unique", "rename the duplicate ids"))
    for l in lines:
        lid = str(l.get("id", "?"))
        text = str(l.get("text", "")).strip()
        try:
            at = float(l.get("at", 0))
        except (TypeError, ValueError):
            at = None
            out.append(issue("FAIL", "line.at", f"{lid}: at is not a number", "set at to a number of seconds"))
        if not text:
            out.append(issue("WARN", "line.empty", f"{lid}: empty text", "write the line or remove it"))
        if at is not None and not (0 <= at < total):
            out.append(issue("FAIL", "line.at", f"{lid}: at {at:.2f}s is outside the {total:.2f}s episode", "move the line inside the timeline"))
        shot = str(l.get("shot", ""))
        if shot and shot not in ids:
            out.append(issue("FAIL", "line.shot", f"{lid}: unknown shot '{shot}'", "point the line at an existing shot"))
        if len(text) > 160:
            out.append(issue("WARN", "line.long", f"{lid}: {len(text)} chars is a long breath", "split it into two lines"))
        who = str(l.get("who", ""))
        roles = project.get("voice", {}).get("roles", {})
        if who and who not in roles:
            out.append(issue("FAIL", "line.who", f"{lid}: voice role '{who}' is not defined", f"add it under voice.roles or use {', '.join(roles) or 'narrator'}"))

    # explicit caption cues: range, shot binding and accent must agree with the copy
    for c in project.get("captions", []) or []:
        cid = str(c.get("id", "?"))
        text = str(c.get("text", ""))
        try:
            c_start = float(c.get("start", 0))
            c_end = float(c.get("end", 0))
            range_ok = True
        except (TypeError, ValueError):
            c_start = c_end = 0.0
            range_ok = False
            out.append(issue("FAIL", "caption.range", f"{cid}: start/end is not a number", "set numeric start/end seconds"))
        if range_ok and c_end <= c_start:
            out.append(issue("FAIL", "caption.range", f"{cid}: end {c_end} <= start {c_start}", "make the cue end after it starts"))
        cs = str(c.get("shot", "") or "")
        if cs:
            if cs not in ids:
                out.append(issue("FAIL", "caption.shot", f"{cid}: unknown shot '{cs}'", "point the cue at an existing shot"))
            elif range_ok and (c_start < shot_starts[cs] - 0.01 or c_end > shot_ends[cs] + 0.01):
                out.append(issue("WARN", "caption.outside", f"{cid}: cue {c_start}-{c_end}s is outside {cs}", "move the cue or lengthen the shot"))
        accent = str(c.get("accent", "") or "").strip()
        if accent and accent.casefold() not in text.casefold():
            out.append(issue("WARN", "caption.accent", f"{cid}: accent '{accent}' is not in the cue text", "use a word that actually appears in the text"))

    for f in project.get("fx", []) or []:
        if not valid_fx_cue(f.get("at", "")):
            out.append(issue("FAIL", "fx.at", f"bad fx cue {f.get('at')!r}", "use f:n | s:n | end | end-n | S1+10 | L2+5"))

    engine = str(project.get("voice", {}).get("engine", "edge-tts")).strip().lower()
    for name, role in project.get("voice", {}).get("roles", {}).items():
        vid = str(role.get("id", ""))
        if engine == "vieneu":
            # a VieNeu preset name, not an edge-tts id — nothing to validate offline
            if not vid:
                out.append(issue("WARN", "voice.id", f"voice role '{name}' has no preset voice", "e.g. \"Hải Đăng\", \"Mai Anh\""))
            continue
        if vid and not VOICE_RE.match(vid):
            out.append(issue("WARN", "voice.id", f"voice role '{name}': '{vid}' does not look like an edge-tts voice", "e.g. vi-VN-NamMinhNeural"))
        if not vid:
            out.append(issue("WARN", "voice.id", f"voice role '{name}' has no id", "set id or gender"))

    end = project.get("endCard", {})
    if end and end.get("shot"):
        ecs = str(end["shot"])
        if ecs not in ids:
            out.append(issue("FAIL", "endCard.shot", f"endCard points at unknown shot '{ecs}'", "point it at the last shot"))
        elif scene_of.get(ecs) != "choice":
            out.append(issue("WARN", "endCard.scene", f"endCard shot '{ecs}' is scene '{scene_of.get(ecs)}', not 'choice'", "use the choice end-card scene"))

    # line fits inside its shot (after the voice exists, review re-checks with real durations)
    for l in lines:
        shot = str(l.get("shot", ""))
        if shot in shot_ends:
            try:
                at = float(l.get("at", 0))
            except (TypeError, ValueError):
                continue  # line.at above already reports the bad value
            if at > shot_ends[shot] + 0.01:
                out.append(issue("WARN", "line.after_shot", f"{l.get('id')}: starts after {shot} ends", "move the line earlier or lengthen the shot"))

    out += check_contract(slug)
    return out
