"""`python video.py doctor` — is this clone ready to make a video?

Checks the runtime, the media tools, the Python audio stack, the bundled fonts and the
Remotion install. Each line is PASS / WARN / FAIL with the exact fix.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from .common import ROOT, ffmpeg, ffprobe, load_json, node, npm, run


def _version(cmd: list[str]) -> str:
    try:
        r = run(cmd, check=False)
        text = (r.stdout or r.stderr or "").strip().splitlines()
        return text[0] if text else ""
    except SystemExit as e:
        return str(e)
    except Exception as e:
        return f"{type(e).__name__}: {e}"


def checks() -> list[dict]:
    out: list[dict] = []

    def add(level: str, name: str, detail: str, fix: str = "") -> None:
        out.append({"level": level, "name": name, "detail": detail, "fix": fix})

    # python
    v = sys.version_info
    add("PASS" if v >= (3, 10) else "FAIL", "python", f"{v.major}.{v.minor}.{v.micro}", "install Python 3.10+")
    for mod, label, fix in (
        ("numpy", "numpy", "pip install numpy"),
        ("PIL", "Pillow", "pip install pillow"),
        ("edge_tts", "edge-tts", "pip install edge-tts"),
    ):
        try:
            m = __import__(mod)
            add("PASS", label, getattr(m, "__version__", "installed"))
        except Exception:
            add("FAIL", label, "not installed", fix)

    # node
    try:
        n = node()
        add("PASS", "node", _version([n, "--version"]), "")
    except SystemExit as e:
        add("FAIL", "node", str(e), "install Node 20+ (winget install OpenJS.NodeJS.LTS)")
    try:
        nm = npm()
        add("PASS", "npm", _version([nm, "--version"]), "")
    except SystemExit as e:
        add("FAIL", "npm", str(e), "comes with Node")
    pkg = ROOT / "node_modules" / "remotion" / "package.json"
    if pkg.exists():
        add("PASS", "remotion", load_json(pkg, {}).get("version", "installed"), "")
    else:
        add("FAIL", "remotion", "node_modules is missing", "run: npm install")

    # ffmpeg
    try:
        f = ffmpeg()
        add("PASS", "ffmpeg", _version([f, "-version"]), "")
    except SystemExit as e:
        add("FAIL", "ffmpeg", str(e), "winget install Gyan.FFmpeg")
    try:
        add("PASS", "ffprobe", _version([ffprobe(), "-version"]), "")
    except SystemExit as e:
        add("FAIL", "ffprobe", str(e), "comes with ffmpeg")

    # bundled assets
    fonts = ROOT / "public" / "fonts"
    need = ["Anton-Regular.ttf", "BeVietnamPro-Regular.ttf", "BeVietnamPro-SemiBold.ttf", "BeVietnamPro-ExtraBold.ttf", "JetBrainsMono.ttf"]
    missing = [n for n in need if not (fonts / n).exists()]
    add("PASS" if not missing else "FAIL", "fonts", "5 bundled fonts" if not missing else f"missing: {', '.join(missing)}", "restore public/fonts from the skill zip")

    # templates / docs
    for rel, label in (
        ("templates/project.json", "template"),
        ("templates/shots.tsx", "template shots"),
        ("SKILL.md", "SKILL.md"),
        ("QUY-TRINH.md", "workflow doc"),
    ):
        add("PASS" if (ROOT / rel).exists() else "WARN", label, rel, "restore it from the skill zip")

    # disk space (Remotion bundles are big)
    try:
        free = shutil.disk_usage(ROOT).free / (1024**3)
        add("PASS" if free > 3 else "WARN", "disk", f"{free:.1f} GB free", "Remotion needs a few GB for bundles and renders")
    except Exception:
        pass

    return out


def run_doctor() -> bool:
    rows = checks()
    width = max(len(r["name"]) for r in rows)
    print(f"video-pipeline doctor — {ROOT}")
    print("-" * 66)
    for r in rows:
        print(f"  {r['level']:4s}  {r['name']:<{width}}  {r['detail']}")
        if r["fix"] and r["level"] != "PASS":
            print(f"        -> {r['fix']}")
    fails = sum(1 for r in rows if r["level"] == "FAIL")
    warns = sum(1 for r in rows if r["level"] == "WARN")
    print("-" * 66)
    print(f"{'READY' if not fails else 'NOT READY'} — {fails} fail, {warns} warn")
    return fails == 0
