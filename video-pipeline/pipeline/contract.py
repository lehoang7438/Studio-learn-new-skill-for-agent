"""Static checks on the character-source contract (regex only, no TS compiler).

These are the architectural promises the episode code relies on: body metrics and the
look palette live in one shared module, `CharSpec` can name a renderer, and shots do
not hard-code skin colours. Kept separate from validate.py so `video.py contract`
can run without loading a project.
"""
from __future__ import annotations

import re
from pathlib import Path

from .common import ROOT

ENGINE = ROOT / "src" / "engine"
EPISODES = ROOT / "src" / "episodes"

METRIC_RE = re.compile(r"\bconst\s+(?=(UPPER_ARM|FORE_ARM|THIGH|SHIN|SHOULDER|HIP|HEAD|LEG_LEN|FLAT_LEG_LEN)\b)")
HEX_RE = re.compile(r"#[0-9a-fA-F]{6}\b")
HAND_HEX = ("#C08A63", "#A67150", "#B47A55", "#C98E68")


def issue(level: str, code: str, msg: str, fix: str = "", shot: str = "") -> dict:
    return {"level": level, "code": code, "msg": msg, "fix": fix, "shot": shot}


def _text(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig") if path.exists() else ""


def _hand_sources(taxi: str) -> str:
    """Only the three hand/arm components — never TaxiSide (user-owned, uncommitted)."""
    parts = []
    for name in ("PovArm", "WheelHand", "GripHand"):
        start = taxi.find(f"export const {name}")
        if start < 0:
            continue
        nxt = taxi.find("export const", start + 1)
        parts.append(taxi[start : nxt if nxt >= 0 else len(taxi)])
    return "\n".join(parts)


def check_contract(slug: str | None = None) -> list[dict]:
    out: list[dict] = []

    # 1. body metrics must be imported, not re-declared in the rigs
    for name in ("rig.tsx", "flat.tsx"):
        found = sorted(set(METRIC_RE.findall(_text(ENGINE / name))))
        if found:
            out.append(
                issue(
                    "FAIL",
                    "contract.metrics_duplicated",
                    f"{name} still declares body metrics ({', '.join(found)})",
                    "import them from engine/metrics.ts instead",
                )
            )

    # 2/3. the shared sources must exist
    if not (ENGINE / "metrics.ts").exists():
        out.append(issue("FAIL", "contract.metrics_source", "src/engine/metrics.ts is missing", "move the shared body metrics there"))
    if not (ENGINE / "look.ts").exists():
        out.append(issue("FAIL", "contract.look_source", "src/engine/look.ts is missing", "move the shared look/palette there"))

    # 4. CharSpec should be able to pick its renderer
    char = _text(ENGINE / "character.tsx")
    spec = re.search(r"\btype\s+CharSpec\s*=\s*\{(.*?)\n\};", char, re.S)
    if not spec or "renderer?" not in spec.group(1):
        out.append(
            issue(
                "WARN",
                "contract.renderer_bind",
                "CharSpec has no 'renderer?' field",
                "add renderer?: 'rig' | 'flat' so a shot can bind its own renderer",
            )
        )

    # 5. shots should use the shared palette, not raw hex literals
    shots = [EPISODES / slug / "shots.tsx"] if slug else sorted(EPISODES.glob("*/shots.tsx"))
    hex_count = sum(len(HEX_RE.findall(_text(p))) for p in shots)
    if hex_count:
        out.append(
            issue(
                "WARN",
                "contract.raw_hex_in_shots",
                f"shots.tsx contains {hex_count} raw hex colour literal(s)",
                "use the palette from the character contract",
            )
        )

    # 6. skin tones must come from the look, not be inline in the hand/arm components
    #    (TaxiSide is intentionally out of scope — it is user-owned work in progress)
    inline = [c for c in HAND_HEX if c.lower() in _hand_sources(_text(ENGINE / "taxi.tsx")).lower()]
    if inline:
        out.append(
            issue(
                "FAIL",
                "contract.hand_palette",
                f"taxi.tsx hand/arm components still hard-code skin colours ({', '.join(inline)})",
                "read them from the shared look palette",
            )
        )

    return out
