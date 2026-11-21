"""Voice: one clip per line, role DSP, then a single voice.wav on the episode clock.

Two engines, chosen by `voice.engine` in project.json:
  edge-tts  (default)  cloud, no key: vi-VN-NamMinhNeural (male), vi-VN-HoaiMyNeural (female)
  vieneu               local Vietnamese TTS (VieNeu-TTS v3 Turbo): 25 preset voices, voice cloning,
                       48 kHz, runs on CPU (RTF ~0.5) or GPU. `pip install vieneu`
                       https://github.com/pnnbao97/VieNeu-TTS

A role's `id` is the engine's own voice name: an edge-tts id for edge-tts, or a VieNeu preset
("Hải Đăng", "Mai Anh", "Adam bựa", …) for vieneu. Pitch/volume/loa/echo are applied locally by
the same DSP in both cases, so a line sounds the same whichever engine spoke it.
"""
from __future__ import annotations

import asyncio
import hashlib
import math
import re
import tempfile
import time
import wave
from pathlib import Path

import numpy as np

from .common import SR, ffmpeg, load_project, pub_dir, save_json, total_seconds

VOICES = {
    "male": "vi-VN-NamMinhNeural",
    "female": "vi-VN-HoaiMyNeural",
}

# VieNeu preset voices worth using as the two stock roles (v3 Turbo, 48 kHz).
VIENEU_ROLES = {
    "male": "Hải Đăng",
    "female": "Mai Anh",
}


def decode(path: Path) -> np.ndarray:
    # fast path: our own write_wav output is 16-bit mono at SR — no ffmpeg round-trip.
    try:
        with wave.open(str(path), "rb") as w:
            if w.getnchannels() == 1 and w.getsampwidth() == 2 and w.getframerate() == SR:
                pcm = w.readframes(w.getnframes())
                return np.frombuffer(pcm, dtype="<i2").astype(np.float64) / 32767.0
    except (wave.Error, OSError):
        pass
    import subprocess

    r = subprocess.run(
        [ffmpeg(), "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True,
        check=True,
    )
    return np.frombuffer(r.stdout, dtype=np.float32).astype(np.float64)


def write_wav(path: Path, x: np.ndarray, peak: float = 0.89, gain: float = 1.0) -> None:
    x = np.asarray(x, dtype=np.float64)
    m = float(np.abs(x).max()) if x.size else 0.0
    if m > 0:
        x = x / m * peak
    x = x * gain
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def _voice_key(line: dict, role: dict, engine: str, voice_id: str) -> str:
    """Content fingerprint of a line: any text/voice/DSP change invalidates its wav cache."""
    parts = [
        str(line.get("text", "")).strip(),
        engine,
        voice_id,
        str(role.get("rate", "")),
        str(role.get("pitch", "")),
        str(role.get("volume", "")),
        str(bool(role.get("loa"))),
        str(bool(role.get("glass"))),
        str(role.get("echo", "")),
        str(role.get("reverb", "")),
        str(bool(role.get("double"))),
    ]
    return hashlib.sha256("|".join(parts).encode("utf-8")).hexdigest()


def _spectral_band(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    if x.size == 0:
        return x
    spec = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(x.size, 1 / SR)
    mask = (freqs >= lo) & (freqs <= hi)
    spec *= mask
    return np.fft.irfft(spec, n=x.size)


def _delay(x: np.ndarray, sec: float, gain: float) -> np.ndarray:
    n = int(sec * SR)
    if n <= 0:
        return x
    y = np.copy(x)
    y[n:] += x[:-n] * gain
    return y


def _parse_hz(value) -> float:
    if value is None:
        return 0.0
    s = str(value).strip().lower().replace("hz", "")
    try:
        return float(s)
    except ValueError:
        return 0.0


def _pv_stretch(x: np.ndarray, stretch: float) -> np.ndarray:
    """Phase-vocoder time stretch. Length becomes about `stretch` times longer."""
    n_fft, ha = 2048, 256
    hs = max(1, int(round(ha * stretch)))
    w = np.hanning(n_fft)
    xp = np.pad(x, (n_fft, n_fft))
    frames = 1 + (xp.size - n_fft) // ha
    out = np.zeros(n_fft + (frames - 1) * hs)
    wsum = np.zeros_like(out)
    prev = np.zeros(n_fft // 2 + 1)
    acc = np.zeros(n_fft // 2 + 1)
    expected = 2 * np.pi * np.arange(n_fft // 2 + 1) * ha / n_fft
    for i in range(frames):
        seg = xp[i * ha : i * ha + n_fft] * w
        spec = np.fft.rfft(seg)
        mag = np.abs(spec)
        phase = np.angle(spec)
        if i == 0:
            acc = phase.copy()
        else:
            delta = phase - prev - expected
            delta = (delta + np.pi) % (2 * np.pi) - np.pi
            acc += expected + delta
        prev = phase
        frame = np.fft.irfft(mag * np.exp(1j * acc), n=n_fft) * w
        s = i * hs
        out[s : s + n_fft] += frame
        wsum[s : s + n_fft] += w * w
    return out / np.maximum(wsum, 1e-8)


def _pitch_shift(x: np.ndarray, hz: float, base: float = 150.0) -> np.ndarray:
    """Shift pitch by `hz` while keeping the clip's length. A cheap, dependency-free
    phase-vocoder: stretch by `ratio`, then resample back to the original length."""
    if x.size < 4096 or abs(hz) < 0.25:
        return x
    ratio = max(0.6, min(1.7, (base + hz) / base))
    if abs(ratio - 1.0) < 0.002:
        return x
    stretched = _pv_stretch(x, ratio)
    n = x.size
    idx = np.linspace(0, stretched.size - 1, n)
    return np.interp(idx, np.arange(stretched.size), stretched)


def _dsp(x: np.ndarray, role: dict) -> np.ndarray:
    if x.size == 0:
        return x
    if role.get("loa"):
        x = _spectral_band(x, 280, 3200)
        x = np.tanh(x * 2.2) / 2.2
        x = _delay(x, 0.055, 0.22)
    if role.get("glass"):
        x = _spectral_band(x, 700, 5200)
        x = _delay(x, 0.03, 0.12)
    if role.get("echo"):
        x = _delay(x, 0.17, float(role.get("echo", 0.15)))
    if role.get("reverb"):
        for d, g in ((0.061, 0.16), (0.113, 0.11), (0.191, 0.07), (0.293, 0.04)):
            x = _delay(x, d, g)
    if role.get("double"):
        x = x + np.pad(x, (int(0.021 * SR), 0))[: x.size] * 0.22
    # gentle fades so lines never click
    f = min(int(0.012 * SR), x.size // 2)
    if f > 0:
        x[:f] *= np.linspace(0, 1, f)
        x[-f:] *= np.linspace(1, 0, f)
    return x


async def _synth(text: str, voice: str, out_mp3: Path, role: dict, tries: int = 12) -> list[dict]:
    import edge_tts

    # edge-tts's service now rejects non-zero pitch/volume for some voices (NoAudioReceived),
    # so only `rate` goes over the wire; pitch and gain are applied locally in _dsp/_pitch_shift.
    kwargs = {"rate": role.get("rate", "+0%")}
    last = None
    for attempt in range(1, tries + 1):
        words: list[dict] = []
        try:
            c = edge_tts.Communicate(text, voice, **kwargs)
            with open(out_mp3, "wb") as f:
                async for chunk in c.stream():
                    if chunk["type"] == "audio":
                        f.write(chunk["data"])
                    elif chunk["type"] == "WordBoundary":
                        words.append(
                            {
                                "w": chunk["text"],
                                "s": chunk["offset"] / 10_000_000,
                                "d": chunk["duration"] / 10_000_000,
                            }
                        )
            if out_mp3.exists() and out_mp3.stat().st_size > 800:
                return words
            last = "empty audio"
        except Exception as e:  # edge-tts raises several transport types
            last = f"{type(e).__name__}: {e}"
        # the service drops requests in short bursts; back off far enough to outlast one
        await asyncio.sleep(min(15.0, 1.0 * (1.7 ** (attempt - 1))))
    raise SystemExit(f"edge-tts failed after {tries} tries ({last}). Check the network, or set voice.engine to a local engine.")


def _vieneu_load():
    """Load VieNeu-TTS once per build (model download happens on the first ever run)."""
    try:
        from vieneu import Vieneu
    except ImportError:
        raise SystemExit(
            "voice.engine = 'vieneu' needs the SDK: pip install vieneu  "
            "(https://github.com/pnnbao97/VieNeu-TTS) — or set voice.engine back to 'edge-tts'."
        )
    t0 = time.time()
    print("  vieneu: loading v3 Turbo (first run downloads the model)…")
    tts = Vieneu()
    print(f"  vieneu: ready in {time.time() - t0:.1f}s")
    return tts


def _vieneu_synth(tts, text: str, voice_name: str, out_wav: Path) -> None:
    """One line through VieNeu-TTS, written as a 48 kHz wav; `decode` resamples it to the mix."""
    audio = tts.infer(text, voice=voice_name)
    tts.save(audio, str(out_wav))
    if not out_wav.exists() or out_wav.stat().st_size < 800:
        raise SystemExit(f"vieneu returned no audio for: {text[:60]}")


def _loudness(path: Path, lufs: float = -15.0, tp: float = -1.5) -> None:
    """Two-pass EBU R128 normalisation: the voice bed lands at social-video loudness
    (default -15 LUFS integrated, -1.5 dBTP) instead of however loud the TTS happened to be.
    Pass 1 measures, pass 2 applies a linear gain + limiter, so quiet lines stay quiet."""
    import json
    import subprocess

    chain = f"loudnorm=I={lufs}:TP={tp}:LRA=11"
    probe = subprocess.run(
        [ffmpeg(), "-hide_banner", "-i", str(path), "-af", f"{chain}:print_format=json", "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    m = re.search(r"\{\s*\"input_i\".*?\}", probe.stderr, re.S)
    if m:
        try:
            measured = json.loads(m.group(0))
            v = {k: float(measured[k]) for k in ("input_i", "input_tp", "input_lra", "input_thresh", "target_offset")}
            chain += (
                f":measured_I={v['input_i']}:measured_TP={v['input_tp']}:measured_LRA={v['input_lra']}"
                f":measured_thresh={v['input_thresh']}:offset={v['target_offset']}:linear=true"
            )
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            print(f"  loudness: single pass ({e})")
    else:
        print("  loudness: single pass (no measurement)")
    tmp = path.with_suffix(".norm.wav")
    r = subprocess.run(
        [ffmpeg(), "-v", "error", "-y", "-i", str(path), "-af", chain, "-ar", str(SR), "-ac", "1", str(tmp)],
        capture_output=True,
    )
    if r.returncode == 0 and tmp.exists() and tmp.stat().st_size > 1000:
        tmp.replace(path)
    else:
        tmp.unlink(missing_ok=True)


def build_voice(slug: str, force: bool = False, only: str | None = None) -> dict:
    project = load_project(slug)
    lines = project.get("lines", [])
    if not lines:
        raise SystemExit(f"{slug}: no lines in project.json")
    voice_cfg = project.get("voice", {})
    engine = str(voice_cfg.get("engine", "edge-tts")).strip().lower()
    roles = voice_cfg.get("roles", {})
    lines_dir = pub_dir(slug, create=True) / "lines"
    lines_dir.mkdir(exist_ok=True)
    tts = None

    total = total_seconds(project)
    n_total = int(math.ceil(total * SR)) + SR
    voice = np.zeros(n_total, dtype=np.float64)
    timing = []

    existing = {str(row.get("id")): row for row in (load_json(pub_dir(slug) / "lines.json", []) or [])}

    for line in lines:
        lid = str(line.get("id", f"L{len(timing) + 1}"))
        who = line.get("who", "narrator")
        role = roles.get(who, roles.get("narrator", {}))
        text = str(line.get("text", "")).strip()
        if not text:
            continue
        if engine == "vieneu":
            voice_id = role.get("id") or VIENEU_ROLES.get(role.get("gender", "male"), VIENEU_ROLES["male"])
            wav = lines_dir / f"{lid}.vieneu.wav"
        else:
            voice_id = role.get("id") or VOICES.get(role.get("gender", "male"), VOICES["male"])
            wav = lines_dir / f"{lid}.wav"
        mp3 = lines_dir / f"{lid}.mp3"
        sidecar = lines_dir / f"{lid}.key.json"
        key = _voice_key(line, role, engine, str(voice_id))
        cached = load_json(sidecar, None)
        cached_key = cached.get("key") if isinstance(cached, dict) else cached
        key_changed = cached_key != key
        # `--only` re-synthesises its target but keeps every other line on its cached wav
        need_synth = force or not wav.exists() or key_changed or (only is not None and lid == only)
        if need_synth:
            print(f"  {lid} [{who}] {text[:56]}")
            if engine == "vieneu":
                if tts is None:
                    tts = _vieneu_load()
                _vieneu_synth(tts, text, voice_id, wav)
                words: list[dict] = []
            else:
                words = asyncio.run(_synth(text, voice_id, mp3, role))
            x = decode(wav if engine == "vieneu" else mp3)
            hz = _parse_hz(role.get("pitch"))
            if hz:
                x = _pitch_shift(x, hz)
            vol = str(role.get("volume", "+0%")).replace("%", "").replace("+", "")
            try:
                gain = max(0.2, min(3.0, 1.0 + float(vol) / 100.0))
            except ValueError:
                gain = 1.0
            x = _dsp(x, role)
            write_wav(wav, x, gain=gain)
            save_json(sidecar, {"key": key})
            dur = len(x) / SR
            word_rows = [
                {"w": w["w"], "s": round(float(line.get("at", 0)) + w["s"], 3), "d": round(w["d"], 3)}
                for w in words
            ]
        else:
            x = decode(wav)
            dur = len(x) / SR
            # cached lines keep their word timing (this is what makes --only safe)
            word_rows = list((existing.get(lid) or {}).get("words", []) or [])
        at = float(line.get("at", 0))
        start = int(round(at * SR))
        end = min(n_total, start + len(x))
        if start < n_total:
            voice[start:end] += x[: end - start]
        timing.append(
            {
                "id": lid,
                "who": who,
                "text": text,
                "at": at,
                "dur": round(dur, 3),
                "shot": line.get("shot", ""),
                "words": word_rows,
            }
        )

    target = pub_dir(slug) / "voice.wav"
    write_wav(target, voice, peak=0.89)
    try:
        _loudness(target, float(project.get("audio", {}).get("voiceLufs", -15.0)))
    except Exception as e:  # loudness is a polish, never a hard dependency
        print(f"  loudness: skipped ({e})")
    save_json(pub_dir(slug) / "lines.json", timing)
    all_words = [w for row in timing for w in row["words"]]
    save_json(pub_dir(slug) / "words.json", sorted(all_words, key=lambda w: w["s"]))

    print(f"voice: {len(timing)} lines -> {pub_dir(slug) / 'voice.wav'} ({total:.2f}s bed)")
    return {"lines": timing, "total": total}


def voice_duration(slug: str) -> float:
    import wave

    p = pub_dir(slug) / "voice.wav"
    if not p.exists():
        return 0.0
    with wave.open(str(p), "rb") as w:
        return w.getnframes() / w.getframerate()
