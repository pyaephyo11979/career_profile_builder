import json
import os
import re
from typing import Dict, List

def _load_skills() -> Dict[str, List[str]]:
    here = os.path.dirname(__file__)
    data_path = os.path.join(os.path.dirname(here), "data", "skills.json")
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)

SKILLS = _load_skills()

def _normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip().lower())

def extract_skills(all_lines: list[str], section_lines: list[str] | None = None) -> dict:
    # Prefer skills section if exists; fallback to all lines
    lines = section_lines if section_lines else all_lines
    text = " ".join(lines)
    text_norm = _normalize(text)

    found: Dict[str, List[str]] = {k: [] for k in SKILLS.keys()}

    for cat, items in SKILLS.items():
        for it in items:
            it_norm = _normalize(it)
            # word boundary-ish match
            if re.search(rf"(^|[^a-z0-9]){re.escape(it_norm)}([^a-z0-9]|$)", text_norm):
                found[cat].append(it)

    # dedupe
    for cat in found:
        found[cat] = sorted(list(set(found[cat])))

    confidence = 0.75 if any(found[cat] for cat in found) else 0.0

    return {"categories": found, "confidence": confidence}
