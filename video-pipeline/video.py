#!/usr/bin/env python
"""video.py — one command surface for the whole vertical-video pipeline.

    python video.py doctor
    python video.py new my-story --title "MY STORY"
    python video.py build my-story
    python video.py review my-story
    python video.py render my-story --preview

Stages are independent on purpose: run one, inspect it, then run the next.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

from pipeline.common import ROOT, node, npm, out_dir, pub_dir, rel, require_slug
from pipeline import pack as pack_mod
from pipeline import scaffold
from pipeline.doctor import run_doctor
from pipeline.review import review as run_review
from pipeline.score import build_music, build_sfx
from pipeline.subs import generate as generate_subs
from pipeline.timeline import build_timeline
from pipeline.validate import validate_project
from pipeline.voice import build_voice


def _node(script: str, args: list[str]) -> None:
    cmd = [node(), str(ROOT / "scripts" / script), *[str(a) for a in args]]
    r = subprocess.run(cmd, cwd=str(ROOT))
    if r.returncode != 0:
        raise SystemExit(f"{script} failed ({r.returncode})")


def _voice(slug: str, force: bool = False, only: str | None = None) -> None:
    print(f"== voice {slug}")
    build_voice(slug, force=force, only=only)


def _subs(slug: str) -> None:
    print(f"== captions {slug}")
    generate_subs(slug)


def _timeline(slug: str) -> None:
    print(f"== timeline {slug}")
    build_timeline(slug)


def _audio(slug: str, force: bool = False, remote: bool | None = None) -> None:
    print(f"== audio {slug}")
    build_music(slug, force=force)
    build_sfx(slug, force=force, remote=remote)


def _stills(slug: str, mid: bool = False, scale: float = 1.0) -> None:
    print(f"== stills {slug}")
    args = [slug]
    if mid:
        args.append("--mid")
    if scale != 1.0:
        args.append(f"--scale={scale}")
    _node("stills.mjs", args)


def _review(slug: str, strict: bool = False) -> bool:
    print(f"== review {slug}")
    ok, _ = run_review(slug, strict=strict)
    return ok


def _render(slug: str, preview: bool = False, scale: float | None = None, crf: int | None = None, frames: str | None = None, out: str | None = None, concurrency: int = 4) -> None:
    print(f"== render {slug}{' (preview)' if preview else ''}")
    args = [slug]
    if preview:
        args.append("--preview")
    if scale is not None:
        args.append(f"--scale={scale}")
    if crf is not None:
        args.append(f"--crf={crf}")
    if frames:
        args.append(f"--frames={frames}")
    if out:
        args.append(f"--out={out}")
    args.append(f"--concurrency={concurrency}")
    _node("render.mjs", args)


def cmd_doctor(_: argparse.Namespace) -> int:
    return 0 if run_doctor() else 1


def cmd_new(a: argparse.Namespace) -> int:
    scaffold.new(a.slug, title=a.title, force=a.force)
    return 0


def cmd_list(_: argparse.Namespace) -> int:
    scaffold.list_episodes()
    return 0


def cmd_validate(a: argparse.Namespace) -> int:
    project = require_slug(a.slug)
    issues = validate_project(project)
    fails = [i for i in issues if i["level"] == "FAIL"]
    for i in issues:
        print(f"  [{i['level']}] {i['code']} {i.get('shot', '')}: {i['msg']}" + (f" -> {i['fix']}" if i.get("fix") else ""))
    print(f"validate: {'OK' if not fails else 'FAIL'} — {len(fails)} fail, {len(issues) - len(fails)} warn")
    return 0 if not fails else 1


def cmd_timeline(a: argparse.Namespace) -> int:
    _timeline(a.slug)
    return 0


def cmd_subs(a: argparse.Namespace) -> int:
    _subs(a.slug)
    return 0


def cmd_voice(a: argparse.Namespace) -> int:
    _voice(a.slug, force=a.force, only=a.only)
    return 0


def cmd_audio(a: argparse.Namespace) -> int:
    _audio(a.slug, force=a.force, remote=True if a.remote else (False if a.no_remote else None))
    return 0


def cmd_sfx_search(a: argparse.Namespace) -> int:
    from pipeline.sfx_api import search

    for s in search(a.query, a.limit):
        print(f"  {s['id']:>12}  {s.get('duration', 0):6.1f}s  {s.get('name', '')}")
        if s.get("description"):
            print(f"                {s['description'][:96]}")
    return 0


def cmd_stills(a: argparse.Namespace) -> int:
    _stills(a.slug, mid=a.mid, scale=a.scale)
    return 0


def cmd_frame(a: argparse.Namespace) -> int:
    args = [a.slug, a.frame]
    if a.out:
        args.append(f"--out={a.out}")
    if a.scale != 1.0:
        args.append(f"--scale={a.scale}")
    _node("frame.mjs", args)
    return 0


def cmd_review(a: argparse.Namespace) -> int:
    return 0 if _review(a.slug, strict=a.strict) else 1


def cmd_render(a: argparse.Namespace) -> int:
    _render(a.slug, preview=a.preview, scale=a.scale, crf=a.crf, frames=a.frames, out=a.out, concurrency=a.concurrency)
    return 0


def cmd_build(a: argparse.Namespace) -> int:
    slug = a.slug
    require_slug(slug)
    _voice(slug, force=a.force)
    _subs(slug)
    _timeline(slug)
    _audio(slug, force=a.force, remote=True if a.remote else (False if a.no_remote else None))
    _stills(slug, mid=a.mid)
    ok = _review(slug, strict=False)
    if not ok and not a.force:
        print("build stopped: review has FAIL issues. Fix them, or re-run with --force to render anyway.")
        return 1
    if not a.no_render:
        _render(slug, preview=a.preview, concurrency=a.concurrency)
    print(f"build: done -> {out_dir(slug)}")
    return 0


def cmd_pack(a: argparse.Namespace) -> int:
    pack_mod.pack(Path(a.out) if a.out else None)
    return 0


def cmd_clone(a: argparse.Namespace) -> int:
    pack_mod.clone(Path(a.dest), install=not a.no_install)
    return 0


def cmd_clean(a: argparse.Namespace) -> int:
    d = out_dir(a.slug)
    if d.exists():
        shutil.rmtree(d)
        print(f"clean: removed {rel(d)}")
    else:
        print(f"clean: nothing at {rel(d)}")
    if a.media:
        for p in (pub_dir(a.slug) / "lines").glob("*"):
            p.unlink()
        for name in ("voice.wav", "music.wav", "sfx.wav", "lines.json", "words.json"):
            p = pub_dir(a.slug) / name
            if p.exists():
                p.unlink()
        print(f"clean: removed generated media in {rel(pub_dir(a.slug))}")
    return 0


def cmd_studio(_: argparse.Namespace) -> int:
    r = subprocess.run([npm(), "run", "studio"], cwd=str(ROOT))
    return r.returncode


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="video.py", description="Vertical story pipeline: script -> voice -> captions -> stills -> review -> MP4.")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("doctor", help="check runtime, ffmpeg, fonts, Remotion").set_defaults(fn=cmd_doctor)

    n = sub.add_parser("new", help="create an episode from the templates")
    n.add_argument("slug")
    n.add_argument("--title", default=None)
    n.add_argument("--force", action="store_true")
    n.set_defaults(fn=cmd_new)

    sub.add_parser("list", help="list episodes").set_defaults(fn=cmd_list)

    v = sub.add_parser("validate", help="static checks on project.json")
    v.add_argument("slug")
    v.set_defaults(fn=cmd_validate)

    t = sub.add_parser("timeline", help="project.json -> timeline.json")
    t.add_argument("slug")
    t.set_defaults(fn=cmd_timeline)

    s = sub.add_parser("subs", help="generate captions.json + SRT/VTT/ASS")
    s.add_argument("slug")
    s.set_defaults(fn=cmd_subs)

    vo = sub.add_parser("voice", help="edge-tts lines -> voice.wav + word timings")
    vo.add_argument("slug")
    vo.add_argument("--force", action="store_true")
    vo.add_argument("--only", default=None, help="re-synthesise one line id")
    vo.set_defaults(fn=cmd_voice)

    au = sub.add_parser("audio", help="procedural music + sfx")
    au.add_argument("slug")
    au.add_argument("--force", action="store_true")
    au.add_argument("--remote", action="store_true", help="mix Lots of Sounds samples from sfxApi.cues")
    au.add_argument("--no-remote", action="store_true", help="ignore sfxApi even if enabled")
    au.set_defaults(fn=cmd_audio)

    ss = sub.add_parser("sfx-search", help="search the Lots of Sounds free samples")
    ss.add_argument("query")
    ss.add_argument("--limit", type=int, default=8)
    ss.set_defaults(fn=cmd_sfx_search)

    st = sub.add_parser("stills", help="render the storyboard stills")
    st.add_argument("slug")
    st.add_argument("--mid", action="store_true", help="also render a mid-shot frame for motion checks")
    st.add_argument("--scale", type=float, default=1.0)
    st.set_defaults(fn=cmd_stills)

    fr = sub.add_parser("frame", help="render one frame")
    fr.add_argument("slug")
    fr.add_argument("frame", type=int)
    fr.add_argument("--out", default=None)
    fr.add_argument("--scale", type=float, default=1.0)
    fr.set_defaults(fn=cmd_frame)

    rv = sub.add_parser("review", help="check stills/audio/video and write the report")
    rv.add_argument("slug")
    rv.add_argument("--strict", action="store_true", help="treat warnings as failure")
    rv.set_defaults(fn=cmd_review)

    rd = sub.add_parser("render", help="render the MP4")
    rd.add_argument("slug")
    rd.add_argument("--preview", action="store_true", help="half-size fast render")
    rd.add_argument("--scale", type=float, default=None)
    rd.add_argument("--crf", type=int, default=None)
    rd.add_argument("--frames", default=None, help="a-b")
    rd.add_argument("--out", default=None)
    rd.add_argument("--concurrency", type=int, default=4)
    rd.set_defaults(fn=cmd_render)

    b = sub.add_parser("build", help="voice -> subs -> timeline -> audio -> stills -> review -> render")
    b.add_argument("slug")
    b.add_argument("--force", action="store_true")
    b.add_argument("--mid", action="store_true")
    b.add_argument("--preview", action="store_true")
    b.add_argument("--no-render", action="store_true")
    b.add_argument("--remote", action="store_true")
    b.add_argument("--no-remote", action="store_true")
    b.add_argument("--concurrency", type=int, default=4)
    b.set_defaults(fn=cmd_build)

    pk = sub.add_parser("pack", help="zip the skill without node_modules/renders")
    pk.add_argument("--out", default=None)
    pk.set_defaults(fn=cmd_pack)

    cl = sub.add_parser("clone", help="copy the skill somewhere else and npm install")
    cl.add_argument("dest")
    cl.add_argument("--no-install", action="store_true")
    cl.set_defaults(fn=cmd_clone)

    cn = sub.add_parser("clean", help="remove out/<slug> (and optionally generated media)")
    cn.add_argument("slug")
    cn.add_argument("--media", action="store_true")
    cn.set_defaults(fn=cmd_clean)

    sub.add_parser("studio", help="open Remotion Studio").set_defaults(fn=cmd_studio)

    a = p.parse_args(argv)
    try:
        return int(a.fn(a))
    except KeyboardInterrupt:
        print("\nstopped")
        return 130
    except SystemExit as e:
        if isinstance(e.code, str):
            print(e.code)
            return 1
        return int(e.code or 0)


if __name__ == "__main__":
    sys.exit(main())
