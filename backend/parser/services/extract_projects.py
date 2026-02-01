from __future__ import annotations

import re
from typing import Any, Dict, List

try:
    from .extract_skills import SKILLS
except ImportError:  # pragma: no cover - defensive
    SKILLS = {}

URL_RE = re.compile(r"(https?://[^\s]+|www\.[^\s]+)", re.I)
_TECH_LOOKUP = {
    value.lower(): value
    for items in SKILLS.values()
    for value in items
}


def extract_projects(lines: List[str] | None) -> List[Dict[str, Any]]:
    if not lines:
        return []

    projects: List[Dict[str, Any]] = []
    current = _blank_project()

    for raw in (*lines, "---END---"):
        line = raw.strip()

        if raw == "---END---":
            _commit(projects, current)
            break

        if not line:
            if _has_data(current):
                _commit(projects, current)
                current = _blank_project()
            continue

        if URL_RE.search(line):
            current["links"].extend(URL_RE.findall(line))
            continue

        if line.startswith(tuple("-*•")):
            detail = line.lstrip("-*• ").strip()
            if detail:
                current["highlights"].append(detail)
                current["tech_stack"].extend(_extract_stack(detail))
            continue

        lowered = line.lower()
        if any(lowered.startswith(prefix) for prefix in ("tech", "stack", "tools", "skills")) and ":" in line:
            current["tech_stack"].extend(_extract_stack(line))
            continue

        if current["name"] is None:
            current["name"] = line.rstrip(":")
            current["tech_stack"].extend(_extract_stack(line))
            continue

        current["summary"] = f"{current['summary']} {line}".strip() if current["summary"] else line
        current["tech_stack"].extend(_extract_stack(line))

    return projects


def _blank_project() -> Dict[str, Any]:
    return {
        "name": None,
        "summary": None,
        "highlights": [],
        "tech_stack": [],
        "links": [],
    }


def _has_data(project: Dict[str, Any]) -> bool:
    return any(
        [
            project["name"],
            project["summary"],
            project["highlights"],
            project["tech_stack"],
            project["links"],
        ]
    )


def _commit(collection: List[Dict[str, Any]], project: Dict[str, Any]) -> None:
    if not _has_data(project):
        return

    project["tech_stack"] = sorted(set(project["tech_stack"]))
    project["links"] = sorted(set(project["links"]))
    collection.append(project)


def _extract_stack(text: str) -> List[str]:
    lower = text.lower()
    found = {display for key, display in _TECH_LOOKUP.items() if key in lower}
    return sorted(found)
