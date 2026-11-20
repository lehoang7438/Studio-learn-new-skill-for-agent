"""Shared paths, process helpers and project loading for the video pipeline."""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EPISODES = ROOT / "src" / "episodes"
PUBLIC = ROOT / "public"
OUT = ROOT / "out"
TEMPLATES = ROOT / "templates"
REFERENCE = ROOT / "reference"
SR = 44100
FPS = 30

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


# ---------------------------------------------------------------- environment

def which(name: str) -> str | None:
    return shutil.which(name)


def ffmpeg() -> str:
    exe = which("ffmpeg")
    if exe:
        return exe
    candidates = [
        Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft/WinGet/Packages",
    ]
    for base in candidates:
        if base.exists():
            for p in base.glob("Gyan.FFmpeg*/ffmpeg-*/bin/ffmpeg.exe"):
                return str(p)
    raise SystemExit("ffmpeg not found. Install it (winget install Gyan.FFmpeg) or add it to PATH.")


def ffprobe() -> str:
    exe = which("ffprobe")
    if exe:
        return exe
    f = Path(ffmpeg())
    p = f.with_name("ffprobe.exe")
    return str(p) if p.exists() else "ffprobe"


def node() -> str:
    exe = which("node")
    if not exe:
        raise SystemExit("node not found. Install Node 20+.")
    return exe


def npm() -> str:
    # npm.ps1 is blocked by the default Windows execution policy; npm.cmd is not.
    for name in ("npm.cmd", "npm"):
        exe = which(name)
        if exe:
            return exe
    raise SystemExit("npm not found. Install Node 20+.")


def run(cmd: list[str], cwd: Path | None = None, check: bool = True, capture: bool = True) -> subprocess.CompletedProcess:
    r = subprocess.run(
        cmd,
        cwd=str(cwd or ROOT),
        capture_output=capture,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if check and r.returncode != 0:
        tail = (r.stderr or r.stdout or "")[-4000:]
        raise SystemExit(f"command failed ({r.returncode}): {' '.join(cmd)}\n{tail}")
    return r


# ---------------------------------------------------------------- project

def ep_dir(slug: str) -> Path:
    return EPISODES / slug


def pub_dir(slug: str, create: bool = False) -> Path:
    d = PUBLIC / slug
    if create:
        d.mkdir(parents=True, exist_ok=True)
    return d


def out_dir(slug: str, create: bool = False) -> Path:
    d = OUT / slug
    if create:
        d.mkdir(parents=True, exist_ok=True)
    return d


def project_path(slug: str) -> Path:
    return ep_dir(slug) / "project.json"


def load_project(slug: str) -> dict:
    p = project_path(slug)
    if not p.exists():
        raise SystemExit(f"No project at {p}. Run: python video.py new {slug}")
    return json.loads(p.read_text(encoding="utf-8-sig"))


def save_project(slug: str, data: dict) -> None:
    project_path(slug).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_json(p: Path, default=None):
    p = Path(p)
    if not p.exists():
        return default
    return json.loads(p.read_text(encoding="utf-8-sig"))


def save_json(p: Path, data) -> None:
    p = Path(p)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def slugify(text: str) -> str:
    text = text.lower().replace("đ", "d")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def pascal(slug: str) -> str:
    return "".join(w[:1].upper() + w[1:] for w in re.split(r"[-_]", slug) if w)


def composition_of(project: dict) -> str:
    return project.get("composition") or pascal(project["slug"])


def total_seconds(project: dict) -> float:
    return sum(float(s.get("dur", 0)) for s in project.get("shots", []))


def caption_of(shot: dict) -> str:
    return shot.get("caption", "") or ""


def rel(p: Path) -> str:
    try:
        return p.relative_to(ROOT).as_posix()
    except ValueError:
        return p.as_posix()


def ensure_dirs(slug: str) -> None:
    ep_dir(slug).mkdir(parents=True, exist_ok=True)
    pub_dir(slug, create=True)
    (pub_dir(slug) / "lines").mkdir(exist_ok=True)
    out_dir(slug, create=True)


def list_episodes() -> list[str]:
    if not EPISODES.exists():
        return []
    return sorted(p.name for p in EPISODES.iterdir() if p.is_dir() and (p / "project.json").exists())


def require_slug(slug: str) -> dict:
    if not project_path(slug).exists():
        raise SystemExit(f"Unknown episode '{slug}'. Known: {', '.join(list_episodes()) or '(none)'}")
    return load_project(slug)
