"""Procedural score and sound design, so a clone of this folder needs no media library.

The bed is intentionally restrained: a low drone, a slow pulse, a noise pad and a riser into
the reveal. Replace public/<slug>/music.wav or sfx.wav with your own files any time.
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np

from .common import SR, load_project, pub_dir, total_seconds
from .voice import write_wav


def _t(n: int) -> np.ndarray:
    return np.arange(n, dtype=np.float64) / SR


def _noise(n: int, seed: int = 1) -> np.ndarray:
    return np.random.default_rng(seed).standard_normal(n)


def _lp(x: np.ndarray, cutoff: float, order: float = 2.0) -> np.ndarray:
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(x.size, 1 / SR)
    spec *= 1.0 / (1.0 + (f / max(1.0, cutoff)) ** order)
    return np.fft.irfft(spec, n=x.size)


def _hp(x: np.ndarray, cutoff: float, order: float = 2.0) -> np.ndarray:
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(x.size, 1 / SR)
    spec *= 1.0 - 1.0 / (1.0 + (f / max(1.0, cutoff)) ** order)
    return np.fft.irfft(spec, n=x.size)


def _env(n: int, a: float, d: float, curve: float = 2.0) -> np.ndarray:
    na, nd = max(1, int(a * SR)), max(1, int(d * SR))
    e = np.zeros(n)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na) ** 0.5
    nd = min(nd, n - na)
    if nd > 0:
        e[na : na + nd] = np.linspace(1, 0, nd) ** curve
    return e


def build_music(slug: str, force: bool = False) -> Path:
    project = load_project(slug)
    out = pub_dir(slug, create=True) / "music.wav"
    if out.exists() and not force:
        print(f"music: keeping {out} (use --force to regenerate)")
        return out
    total = total_seconds(project)
    n = int(math.ceil(total * SR))
    t = _t(n)
    y = np.zeros(n)

    # low drone: root + fifth, slowly detuned
    for f, a in ((55, 0.30), (82.5, 0.18), (110, 0.10), (164.8, 0.04)):
        y += a * np.sin(2 * math.pi * (f + 0.06 * np.sin(2 * math.pi * t / 19)) * t)
    y += 0.05 * np.sin(2 * math.pi * 27.5 * t) * (0.6 + 0.4 * np.sin(2 * math.pi * t / 11))

    # noise pad, breathing
    pad = _lp(_noise(n, 7), 900) * (0.35 + 0.25 * np.sin(2 * math.pi * t / 13 - 1.2))
    y += pad * 0.10

    # slow pulse every 2.4 s
    for k in range(int(total / 2.4) + 1):
        s = int(k * 2.4 * SR)
        if s >= n:
            break
        m = min(n - s, int(1.2 * SR))
        tt = _t(m)
        thump = np.sin(2 * math.pi * 44 * tt) * np.exp(-tt * 7) * 0.22
        y[s : s + m] += thump

    # sparse low notes, minor pentatonic
    rng = np.random.default_rng(11)
    for k in range(int(total / 4.0) + 1):
        s = int((k * 4.0 + rng.uniform(-0.4, 0.4)) * SR)
        if s >= n or s < 0:
            continue
        m = min(n - s, int(3.0 * SR))
        f = [110.0, 130.8, 146.8, 164.8, 196.0][int(rng.integers(0, 5))]
        tt = _t(m)
        note = (np.sin(2 * math.pi * f * tt) + 0.4 * np.sin(2 * math.pi * f * 2 * tt)) * np.exp(-tt * 1.6) * 0.05
        y[s : s + m] += note

    # riser into the last 8 seconds
    riser_at = max(0.0, total - 8.0)
    s = int(riser_at * SR)
    m = n - s
    if m > 0:
        tt = _t(m)
        sweep = _hp(_noise(m, 21), 400) * (tt / max(0.01, tt[-1])) ** 2
        y[s:] += sweep * 0.06
        y[s:] += np.sin(2 * math.pi * (180 + 420 * (tt / max(0.01, tt[-1])) ** 2) * tt) * 0.025

    # final hit
    s = max(0, n - int(0.9 * SR))
    m = n - s
    tt = _t(m)
    y[s:] += np.sin(2 * math.pi * 48 * tt) * np.exp(-tt * 4) * 0.30

    write_wav(out, y, peak=0.32)
    print(f"music: {total:.1f}s -> {out}")
    return out


def _place(y: np.ndarray, x: np.ndarray, at: float, gain: float = 1.0) -> None:
    s = int(at * SR)
    if s >= len(y) or s < 0:
        return
    m = min(len(y) - s, len(x))
    y[s : s + m] += x[:m] * gain


def _click() -> np.ndarray:
    n = int(0.035 * SR)
    t = _t(n)
    return (_noise(n, 3) * np.exp(-t * 180) * 0.5 + np.sin(2 * math.pi * 1400 * t) * np.exp(-t * 120) * 0.3)


def _static(dur: float, seed: int) -> np.ndarray:
    n = int(dur * SR)
    x = _hp(_lp(_noise(n, seed), 5200), 420)
    gate = (np.random.default_rng(seed).random(n) > 0.06).astype(float)
    gate = _lp(gate, 40)
    return x * gate * 0.22


def _heartbeat(dur: float) -> np.ndarray:
    n = int(dur * SR)
    y = np.zeros(n)
    for k in range(int(dur / 1.05) + 1):
        s = int(k * 1.05 * SR)
        for off, g in ((0.0, 1.0), (0.26, 0.7)):
            ss = s + int(off * SR)
            m = min(n - ss, int(0.4 * SR))
            if m <= 0:
                continue
            tt = _t(m)
            y[ss : ss + m] += np.sin(2 * math.pi * 52 * tt) * np.exp(-tt * 16) * g * 0.5
    return y


def _cue_seconds(cue, starts: dict[str, float], line_starts: dict[str, float]) -> float:
    if isinstance(cue, (int, float)):
        return float(cue)
    s = str(cue).strip()
    if s.startswith("s:"):
        return float(s[2:])
    if s in starts:
        return starts[s]
    if s in line_starts:
        return line_starts[s]
    return float(s)


def _remote_mix(slug: str, y: np.ndarray, starts: dict[str, float], line_starts: dict[str, float], force: bool) -> np.ndarray:
    from .sfx_api import prepare, write_attribution
    from .voice import decode

    project = load_project(slug)
    cfg = project.get("sfxApi", {}) or {}
    cues = cfg.get("cues", []) or []
    if not cues:
        return y
    used = prepare(slug, cues, force=force)
    for u in used:
        try:
            x = decode(Path(u["file"]))
        except Exception as e:
            print(f"  sfx-api: could not decode {u['file']} ({e})")
            continue
        if u.get("offset"):
            # samples often open with room tone; skip to the first useful hit
            x = x[int(float(u["offset"]) * SR) :]
        if u.get("trim"):
            x = x[: int(float(u["trim"]) * SR)]
        fade = max(0.0, float(u.get("fade", 0.18)))
        f = min(int(fade * SR), max(0, x.size // 2))
        if f > 0:
            x[:f] *= np.linspace(0, 1, f)
            x[-f:] *= np.linspace(1, 0, f)
        at = _cue_seconds(u.get("at", "s:0"), starts, line_starts)
        _place(y, x, at, float(u.get("gain", 0.7)))
    if used:
        p = write_attribution(slug, used)
        print(f"  sfx-api: {len(used)} sample(s) mixed, attribution -> {p}")
    return y


def build_sfx(slug: str, force: bool = False, remote: bool | None = None) -> Path:
    project = load_project(slug)
    out = pub_dir(slug, create=True) / "sfx.wav"
    if out.exists() and not force:
        print(f"sfx: keeping {out} (use --force to regenerate)")
        return out
    total = total_seconds(project)
    n = int(math.ceil(total * SR))
    y = np.zeros(n)

    # rain + engine, the whole ride
    rain = _hp(_lp(_noise(n, 5), 7000), 900)
    rain *= 0.10 * (0.85 + 0.15 * np.sin(2 * math.pi * _t(n) / 17))
    y += rain
    tt = _t(n)
    engine = (np.sin(2 * math.pi * 43 * tt) + 0.5 * np.sin(2 * math.pi * 86 * tt)) * 0.05
    engine *= 0.7 + 0.3 * np.sin(2 * math.pi * tt / 3.1)
    y += engine + _lp(_noise(n, 6), 180) * 0.03

    starts: dict[str, float] = {}
    cursor = 0.0
    for s in project.get("shots", []):
        starts[str(s["id"])] = cursor
        cursor += float(s.get("dur", 0))
    line_starts = {str(l.get("id")): float(l.get("at", 0)) for l in project.get("lines", [])}

    # a soft cut click at every shot, except the first
    for i, s in enumerate(project.get("shots", [])):
        if i == 0:
            continue
        at = starts[str(s["id"])]
        _place(y, _click(), at, 0.35)

    for s in project.get("shots", []):
        sid = str(s["id"])
        at = starts[sid]
        dur = float(s.get("dur", 0))
        scene = str(s.get("scene", ""))
        if scene in ("radio", "radio-msg"):
            _place(y, _static(dur, 31 + len(sid)), at, 0.8 if scene == "radio" else 0.35)
        if scene == "switch":
            _place(y, _click(), at + max(0.0, dur - 0.8), 0.9)
            _place(y, _click(), at + max(0.0, dur - 0.55), 0.5)
        if scene == "dark":
            _place(y, _heartbeat(dur), at, 0.55)
        if scene == "choice":
            _place(y, _heartbeat(2.2), at, 0.35)

    # riser + impact before the reveal shot
    reveal = next((s for s in project.get("shots", []) if s.get("scene") == "dark"), None)
    if reveal:
        at = starts[str(reveal["id"])]
        m = int(2.8 * SR)
        t = _t(m)
        riser = _hp(_noise(m, 41), 500) * (t / t[-1]) ** 2.4
        y[max(0, int((at - 2.8) * SR)) : max(0, int((at - 2.8) * SR)) + m] += riser * 0.22
        # impact
        mi = int(1.0 * SR)
        ti = _t(mi)
        imp = np.sin(2 * math.pi * 46 * ti) * np.exp(-ti * 5) * 0.55 + _lp(_noise(mi, 42), 400) * np.exp(-ti * 9) * 0.3
        _place(y, imp, at, 0.8)

    want_remote = bool((project.get("sfxApi", {}) or {}).get("enabled")) if remote is None else remote
    if want_remote:
        y = _remote_mix(slug, y, starts, line_starts, force)

    write_wav(out, y, peak=0.55)
    print(f"sfx: {total:.1f}s -> {out}")
    return out
