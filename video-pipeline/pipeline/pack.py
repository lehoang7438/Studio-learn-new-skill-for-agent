"""`python video.py pack` and `python video.py clone` — move the skill without the junk.

A clone must stay small: no node_modules, no renders, no generated voice/SFX. Fonts and
templates travel with it, so `npm install` plus `python video.py doctor` is the whole setup.
"""
from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

from .common import ROOT, npm, run

SKIP_DIRS = {"node_modules", "out", ".git", "__pycache__", ".venv", "venv", ".cache", "dist"}
SKIP_SUFFIX = {".mp4", ".wav", ".mp3", ".zip", ".pyc"}
SKIP_NAMES = {".DS_Store", "Thumbs.db"}


def _ignore(_dir: str, names: list[str]) -> set[str]:
    return {n for n in names if n in SKIP_DIRS or n in SKIP_NAMES or Path(n).suffix.lower() in SKIP_SUFFIX}


def pack(dest: Path | None = None) -> Path:
    dest = Path(dest) if dest else ROOT.parent / "video-pipeline.zip"
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        dest.unlink()
    n = 0
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in ROOT.rglob("*"):
            if p.is_dir() or p == dest:
                continue
            rel = p.relative_to(ROOT)
            if any(part in SKIP_DIRS for part in rel.parts):
                continue
            if p.name in SKIP_NAMES or p.suffix.lower() in SKIP_SUFFIX:
                continue
            # study screenshots live beside an episode; the render does not read them
            if "ref" in rel.parts:
                continue
            z.write(p, Path("video-pipeline") / rel)
            n += 1
    size = dest.stat().st_size / (1024**2)
    print(f"pack: {n} files -> {dest} ({size:.1f} MB)")
    return dest


def clone(dest: Path, install: bool = True) -> Path:
    dest = Path(dest).resolve()
    if dest == ROOT or ROOT in dest.parents:
        raise SystemExit("clone destination must be outside the skill folder")
    if dest.exists() and any(dest.iterdir()):
        raise SystemExit(f"{dest} is not empty")
    shutil.copytree(ROOT, dest, ignore=_ignore)
    (dest / "out").mkdir(exist_ok=True)
    print(f"clone: {dest}")
    if install:
        print("  npm install ...")
        run([npm(), "install", "--no-audit", "--no-fund"], cwd=dest, check=True)
        print("  installed")
    print("  next:")
    print(f"    cd {dest}")
    print("    python video.py doctor")
    print("    python video.py build chuyen-pha")
    return dest
