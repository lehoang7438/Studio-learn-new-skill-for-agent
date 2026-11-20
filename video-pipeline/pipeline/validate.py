"""Static checks for project.json: the cheap failures, caught before a single frame renders."""
from __future__ import annotations

import re

from .common import total_seconds

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


def issue(level: str, code: str, msg: str, fix: str = "", shot: str = "") -> dict:
    return {"level": level, "code": code, "msg": msg, "fix": fix, "shot": shot}


def validate_project(project: dict) -> list[dict]:
    out: list[dict] = []
    for key in ("slug", "title", "shots", "lines"):
        if key not in project:
            out.append(issue("FAIL", "schema.missing", f"project.json is missing '{key}'", f"add \"{key}\""))
    if out:
        return out

    shots = project.get("shots", [])
    lines = project.get("lines", [])
    if not shots:
        return [issue("FAIL", "shots.empty", "no shots", "add at least one shot")]

    ids = [str(s.get("id", "")) for s in shots]
    if len(set(ids)) != len(ids):
        out.append(issue("FAIL", "shots.duplicate", "shot ids are not unique", "rename the duplicate ids"))
    for s in shots:
        sid = str(s.get("id", "?"))
        if not sid:
            out.append(issue("FAIL", "shot.id", "a shot has no id", "give every shot an id (S1, S2...)"))
        if float(s.get("dur", 0)) <= 0:
            out.append(issue("FAIL", "shot.dur", f"{sid}: dur must be > 0", "set the shot length in seconds", sid))
        scene = str(s.get("scene", ""))
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
        if "key" in s and not (0 <= int(s.get("key", 0)) < max(1, int(float(s.get("dur", 0)) * int(project.get("fps", 30))))):
            out.append(issue("WARN", "shot.key", f"{sid}: key frame is outside the shot", "keep key inside the shot's frames", sid))

    total = total_seconds(project)
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
        at = float(l.get("at", 0))
        if not text:
            out.append(issue("WARN", "line.empty", f"{lid}: empty text", "write the line or remove it"))
        if not (0 <= at < total):
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
    if end and end.get("shot") and end["shot"] not in ids:
        out.append(issue("FAIL", "endCard.shot", f"endCard points at unknown shot '{end['shot']}'", "point it at the last shot"))

    # line fits inside its shot (after the voice exists, review re-checks with real durations)
    shot_ends = {}
    cur = 0.0
    for s in shots:
        cur += float(s.get("dur", 0))
        shot_ends[str(s.get("id"))] = cur
    for l in lines:
        shot = str(l.get("shot", ""))
        if shot in shot_ends:
            at = float(l.get("at", 0))
            if at > shot_ends[shot] + 0.01:
                out.append(issue("WARN", "line.after_shot", f"{l.get('id')}: starts after {shot} ends", "move the line earlier or lengthen the shot"))
    return out
