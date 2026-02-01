import re
from typing import List, Dict, Any

DEGREE_RE = re.compile(r"(bachelor|b\.?sc|bsc|master|m\.?sc|msc|phd|diploma|associate)", re.I)
YEAR_RE = re.compile(r"(19\d{2}|20\d{2})")

def extract_education(lines: List[str]) -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    if not lines:
        return entries

    block: List[str] = []
    for ln in lines + ["---END---"]:
        if ln == "---END---" or ln.strip() == "":
            if block:
                entries.append(_parse_edu_block(block))
                block = []
            continue
        block.append(ln)

    # Filter out empty items
    entries = [e for e in entries if any(v for v in e.values())]
    return entries

def _parse_edu_block(block: List[str]) -> Dict[str, Any]:
    text = " ".join(block)

    degree = None
    mdeg = DEGREE_RE.search(text)
    if mdeg:
        degree = mdeg.group(0)

    years = YEAR_RE.findall(text)
    start_year = years[0] if len(years) >= 1 else None
    end_year = years[1] if len(years) >= 2 else (years[0] if len(years) == 1 else None)

    school = None
    for ln in block[:3]:
        if any(k in ln.lower() for k in ["university", "college", "institute"]):
            school = ln
            break

    return {
        "school": school,
        "degree": degree,
        "field": None,
        "start_year": start_year,
        "end_year": end_year
    }
