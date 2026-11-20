"""`python video.py new <slug>` — create a working episode from the templates.

The new folder is immediately renderable: project.json, shots.tsx, index.tsx, a registered
composition and a first timeline.json. Replace the story, keep the file shape.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from .common import EPISODES, ROOT, TEMPLATES, ensure_dirs, ep_dir, pascal, slugify, total_seconds
from .timeline import build_timeline

HEADER = """// The registry: one import and one entry per episode.
// `python video.py new <slug>` rewrites this file automatically.
"""


def camel(slug: str) -> str:
    parts = [p for p in re.split(r"[-_]", slug) if p]
    if not parts:
        return "episode"
    return parts[0].lower() + "".join(p[:1].upper() + p[1:] for p in parts[1:])


def _export_name(slug: str) -> str:
    p = ep_dir(slug) / "index.tsx"
    if p.exists():
        m = re.search(r"export\s+const\s+(\w+)\s*=\s*defineEpisode", p.read_text(encoding="utf-8"))
        if m:
            return m.group(1)
    return camel(slug)


def register_all() -> str:
    rows = []
    if EPISODES.exists():
        for d in sorted(EPISODES.iterdir(), key=lambda p: p.name):
            if d.is_dir() and (d / "project.json").exists():
                rows.append((d.name, _export_name(d.name)))
    imports = "\n".join(f"import {{ {name} }} from './{slug}';" for slug, name in rows)
    entries = ", ".join(name for _, name in rows)
    text = HEADER + imports + "\n\nexport const EPISODES = [" + entries + "];\n"
    (EPISODES / "index.ts").write_text(text, encoding="utf-8")
    return text


def new(slug: str, title: str | None = None, force: bool = False) -> Path:
    slug = slugify(slug)
    if not slug:
        raise SystemExit("slug is empty")
    d = ep_dir(slug)
    if d.exists() and any(d.iterdir()) and not force:
        raise SystemExit(f"{d} already exists. Use --force to overwrite its template files.")

    project_tpl = TEMPLATES / "project.json"
    shots_tpl = TEMPLATES / "shots.tsx"
    index_tpl = TEMPLATES / "index.tsx"
    for p in (project_tpl, shots_tpl, index_tpl):
        if not p.exists():
            raise SystemExit(f"missing template: {p}")

    comp = pascal(slug)
    name = camel(slug)
    title = title or slug.replace("-", " ").upper()

    project = json.loads(project_tpl.read_text(encoding="utf-8"))
    project["slug"] = slug
    project["composition"] = comp
    project["title"] = title

    ensure_dirs(slug)
    (d / "project.json").write_text(json.dumps(project, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    shots = shots_tpl.read_text(encoding="utf-8")
    (d / "shots.tsx").write_text(shots, encoding="utf-8")
    index = index_tpl.read_text(encoding="utf-8").replace("__CAMEL__", name).replace("__COMP__", comp)
    (d / "index.tsx").write_text(index, encoding="utf-8")

    register_all()
    timeline = build_timeline(slug, quiet=True)
    total = total_seconds(project)
    print(f"new episode: {slug}")
    print(f"  {d}")
    print(f"  composition: {comp} / {comp}Board, {total:.1f}s, {len(timeline['shots'])} shots")
    print("  next: edit project.json + shots.tsx, then")
    print(f"        python video.py build {slug}")
    return d


def list_episodes() -> None:
    from .common import list_episodes as ls, load_project

    rows = []
    for slug in ls():
        try:
            p = load_project(slug)
            rows.append((slug, p.get("title", ""), f"{total_seconds(p):.1f}s", p.get("composition") or pascal(slug)))
        except Exception as e:
            rows.append((slug, f"(bad project: {e})", "", ""))
    if not rows:
        print("no episodes yet — run: python video.py new my-story")
        return
    w = max(len(r[0]) for r in rows)
    print(f"{'slug':<{w}}  {'title':<34}  {'len':>6}  composition")
    for slug, title, dur, comp in rows:
        print(f"{slug:<{w}}  {title[:34]:<34}  {dur:>6}  {comp}")
