"""Optional real SFX from the Lots of Sounds sample API.

The pipeline is procedural by default, so a clone with no network still works. This module
adds an opt-in layer: search the free sample catalogue, cache the MP3s inside the episode, and
mix them into sfx.wav at the cue times written in project.json.

    GET https://api.lotsofsounds.com/api/v1/sounds/sample?q=boat+horn&limit=3
    GET https://api.lotsofsounds.com/api/v1/sounds/sample/<id>/stream   -> signed MP3 URL

No API key is needed for the sample endpoint. The samples are published as CC0, but licences
change: keep the attribution file this module writes and check the current terms before you
publish a video.
"""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from .common import load_json, load_project, pub_dir, save_json

API = "https://api.lotsofsounds.com/api/v1"
UA = "video-pipeline/1.0 (+local skill)"
LICENSE_NOTE = (
    "Source: Lots of Sounds sample API (https://www.lotsofsounds.com). "
    "Samples are offered as CC0; verify the current licence on the site before publishing."
)


def _get(url: str, timeout: int = 30) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except (urllib.error.URLError, TimeoutError) as e:
        raise SystemExit(f"sfx-api: request failed ({type(e).__name__})") from e


def search(q: str, limit: int = 5) -> list[dict]:
    url = f"{API}/sounds/sample?" + urllib.parse.urlencode({"q": q, "limit": max(1, min(20, limit))})
    data = json.loads(_get(url))
    return data.get("data", [])


def resolve_stream(sound_id: str) -> str:
    data = json.loads(_get(f"{API}/sounds/sample/{urllib.parse.quote(sound_id)}/stream"))
    url = (data.get("data") or {}).get("stream_url")
    if not url:
        raise RuntimeError(f"no stream_url for {sound_id}: {data}")
    return url


def _safe(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:48] or "sfx"


def fetch(slug: str, sound_id: str, force: bool = False, name: str | None = None) -> Path:
    """Download one sample into public/<slug>/sfx-src/ and return the MP3 path."""
    meta = {s["id"]: s for s in load_json(pub_dir(slug) / "sfx-src" / "index.json", []) or []}
    label = name or (meta.get(sound_id) or {}).get("name", sound_id)
    dest = pub_dir(slug, create=True) / "sfx-src" / f"{_safe(str(sound_id))}-{_safe(label)}.mp3"
    if dest.exists() and not force and dest.stat().st_size > 1000:
        return dest
    url = resolve_stream(sound_id)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(req, timeout=60) as r, open(part, "wb") as f:
        f.write(r.read())
    part.replace(dest)
    return dest


def cache_index(slug: str) -> list[dict]:
    """Search results for every sound used, kept beside the audio for attribution."""
    p = pub_dir(slug) / "sfx-src" / "index.json"
    return load_json(p, []) or []


def _remember(slug: str, row: dict) -> None:
    p = pub_dir(slug) / "sfx-src" / "index.json"
    rows = load_json(p, []) or []
    if not any(r.get("id") == row.get("id") for r in rows):
        rows.append(row)
        save_json(p, rows)


def _remember_pick(slug: str, key: str, sid: str) -> None:
    """Pin a query's pick so a later run resolves the same sample without searching again."""
    p = pub_dir(slug) / "sfx-src" / "index.json"
    rows = load_json(p, []) or []
    if not any(r.get("kind") == "pick" and r.get("key") == key for r in rows):
        rows.append({"kind": "pick", "key": key, "id": sid})
        save_json(p, rows)


def prepare(slug: str, cues: list[dict], force: bool = False) -> list[dict]:
    """Resolve each cue to a local MP3. A cue is {q, at, gain?, trim?, id?}."""
    project = load_project(slug)
    api_cfg = project.get("sfxApi", {}) or {}
    index_rows = load_json(pub_dir(slug) / "sfx-src" / "index.json", []) or []
    by_id = {str(r.get("id")): r for r in index_rows if r.get("id") and r.get("kind") != "pick"}
    picks = {r.get("key"): r.get("id") for r in index_rows if r.get("kind") == "pick"}
    out: list[dict] = []
    for i, cue in enumerate(cues):
        q = str(cue.get("q", "")).strip()
        sid = str(cue.get("id", "")).strip()
        if not q and not sid:
            continue
        row = by_id.get(sid) if sid else None
        if not sid:
            pick = int(cue.get("pick", 0))
            key = f"{q}|{pick}"
            sid = str(picks.get(key) or "").strip()
            if sid:
                row = by_id.get(sid) or row or {"id": sid, "name": sid}
            else:
                limit = int(cue.get("limit", api_cfg.get("limit", 3)))
                results = search(q, limit)
                if not results:
                    print(f"  sfx-api: no sample for '{q}' — keeping the procedural bed")
                    continue
                row = results[pick % len(results)]
                sid = str(row["id"])
                picks[key] = sid
                _remember_pick(slug, key, sid)
        if row is None:
            row = next((r for r in search(q or sid, 5) if r.get("id") == sid), None) or {
                "id": sid,
                "name": str(cue.get("name", sid)),
            }
        path = fetch(slug, sid, force=force, name=str(row.get("name") or "") or None)
        row = {**row, "id": sid, "file": path.name, "license": LICENSE_NOTE}
        _remember(slug, row)
        out.append(
            {
                "id": sid,
                "name": row.get("name", sid),
                "file": str(path),
                "at": cue.get("at", "s:0"),
                "gain": float(cue.get("gain", 0.7)),
                "offset": float(cue.get("offset", 0)) or None,
                "trim": float(cue.get("trim", 0)) or None,
                "fade": float(cue.get("fade", 0.18)),
            }
        )
        print(f"  sfx-api: {sid} {row.get('name', '')} -> {path.name}")
    return out


def write_attribution(slug: str, used: list[dict]) -> Path:
    p = pub_dir(slug, create=True) / "sfx-src" / "ATTRIBUTION.md"
    lines = [
        f"# SFX attribution - {slug}",
        "",
        LICENSE_NOTE,
        "",
        "| id | name | file |",
        "|---|---|---|",
    ]
    for u in used:
        lines.append(f"| {u['id']} | {u.get('name', '')} | {Path(u.get('file', '')).name} |")
    lines += ["", "Full sample metadata is cached in `index.json` next to this file.", ""]
    p.write_text("\n".join(lines), encoding="utf-8")
    return p
