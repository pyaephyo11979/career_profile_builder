import re
from typing import Any, Dict, List, Tuple

DEGREE_RE = re.compile(
    r"(bachelor|b\.?s\.?|b\.?sc|b\.a|ba|master|m\.?s\.?|m\.?sc|m\.a|ma|mba|phd|diploma|associate|doctorate)",
    re.I,
)
YEAR_RE = re.compile(r"(19\d{2}|20\d{2})")
YEAR_RANGE_RE = re.compile(r"(19\d{2}|20\d{2})\s*[-–—]\s*(19\d{2}|20\d{2}|present|Present)")
PHONE_RE = re.compile(r"\+?\d[\d\s().-]{7,}\d")
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


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

    entries = [e for e in entries if any(v for v in e.values())]
    return entries


def _parse_edu_block(block: List[str]) -> Dict[str, Any]:
    text = " ".join(block)
    text = EMAIL_RE.sub("", text)
    text = PHONE_RE.sub("", text)
    lower_text = text.lower()

    start_year, end_year = _years_from_text(lower_text)
    degree, field = _degree_and_field(text)
    school = _guess_school(block)

    if not (degree or school or start_year or end_year):
        return {}

    return {
        "school": school,
        "degree": degree,
        "field": field,
        "start_year": start_year,
        "end_year": end_year,
    }


def _years_from_text(text: str) -> Tuple[str | None, str | None]:
    range_match = YEAR_RANGE_RE.search(text)
    if range_match:
        return range_match.group(1), range_match.group(2).capitalize()

    years = YEAR_RE.findall(text)
    if len(years) >= 2:
        ordered = sorted(years[:2])
        return ordered[0], ordered[1]
    if len(years) == 1:
        return years[0], years[0]
    return None, None


def _degree_and_field(text: str) -> Tuple[str | None, str | None]:
    degree_match = DEGREE_RE.search(text)
    degree = degree_match.group(0) if degree_match else None

    field = None
    if degree_match:
        after = text[degree_match.end() :]
        field_match = re.search(r"in\s+([^,;•|]+)", after, re.I)
        if field_match:
            field = field_match.group(1).strip()
        else:
            # Try first comma-separated token after degree
            parts = re.split(r"[,•|]", after)
            if parts:
                candidate = parts[0].strip()
                if candidate and not YEAR_RE.search(candidate):
                    field = candidate
    return degree, field


def _guess_school(block: List[str]) -> str | None:
    for ln in block[:3]:
        l = ln.strip()
        lower = l.lower()
        if any(k in lower for k in ["university", "college", "institute", "school", "academy"]):
            return l
    return block[0].strip() if block else None
