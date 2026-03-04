import json
import os
import re
from typing import Dict, List

def _load_headers() -> Dict[str, List[str]]:
    here = os.path.dirname(__file__)
    data_path = os.path.join(os.path.dirname(here), 'data','section_headers.json')
    with open(data_path, "r",encoding="utf-8") as f:
        return json.load(f)
    
HEADERS = _load_headers()
HEADERS_COMPACT = {
    section: {v.lower() for v in variants} | {re.sub(r"[^a-z]", "", v.lower()) for v in variants}
    for section, variants in HEADERS.items()
}

def _is_header(line: str)-> str | None:
    norm = line.strip().lower().rstrip(":")
    compact = re.sub(r"[^a-z]", "", norm)
    for section, variants in HEADERS_COMPACT.items():
        if norm in variants or compact in variants:
            return section
    return None

def split_sections(lines: List[str])-> Dict[str, List[str]]:
    sections: Dict[str, List[str]] = {}
    current="unknown"
    sections[current] = []

    for line in lines:
        header = _is_header(line)
        if header:
            current = header
            sections.setdefault(current, [])
            continue
        sections.setdefault(current,[]).append(line)
    
    if "unknown" in sections and not sections["unknown"]:
        sections.pop("unknown",None)

    return sections