import re
from typing import Any, Dict, List

MONTH_RE = r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\w*"
DATE_VALUE_RE = rf"(?:{MONTH_RE}\s+\d{{4}}|\d{{4}})"
DATE_RANGE_RE = re.compile(rf"(?P<start>{DATE_VALUE_RE})\s*[-–—]\s*(?P<end>present|{DATE_VALUE_RE})", re.I)
COMPANY_HINT_RE = re.compile(r"\b(inc|llc|ltd|corp|company|technologies|solutions|systems)\b", re.I)


def extract_experience(lines: List[str]) -> List[Dict[str, Any]]:
    if not lines:
        return []

    entries: List[Dict[str, Any]] = []
    current: Dict[str, Any] | None = None

    for raw_line in lines:
        ln = raw_line.strip()
        if not ln:
            continue

        if ln.startswith("-"):
            if current is None:
                current = _blank_entry()
            bullet = ln.lstrip("-").strip()
            if bullet:
                current["highlights"].append(bullet)
            continue

        date_match = DATE_RANGE_RE.search(ln)
        if date_match:
            if current and _has_data(current):
                entries.append(current)
            current = _blank_entry()
            current["start_date"] = date_match.group("start")
            current["end_date"] = date_match.group("end")

            # Preserve role/company/location text that appears on the same line.
            prefix = ln[:date_match.start()].strip(" -|,")
            suffix = ln[date_match.end():].strip(" -|,")
            role_line = " | ".join([value for value in [prefix, suffix] if value])
            if role_line:
                _apply_role_company_location(current, role_line)
            continue

        if current is None:
            current = _blank_entry()

        if ("|" in ln or " - " in ln or " — " in ln or "," in ln) and (
            current["title"] is None or current["company"] is None or current["location"] is None
        ):
            _apply_role_company_location(current, ln)
            continue

        if current["title"] is None and len(ln.split()) <= 8:
            current["title"] = ln
            continue
        if current["company"] is None and len(ln.split()) <= 10:
            current["company"] = ln
            continue
        if current["location"] is None and len(ln.split()) <= 6:
            current["location"] = ln

    if current and _has_data(current):
        entries.append(current)

    return [entry for entry in entries if _has_data(entry)]


def _blank_entry() -> Dict[str, Any]:
    return {
        "title": None,
        "company": None,
        "start_date": None,
        "end_date": None,
        "location": None,
        "highlights": [],
    }


def _has_data(entry: Dict[str, Any]) -> bool:
    return any([entry.get("title"), entry.get("company"), entry.get("highlights"), entry.get("start_date")])


def _apply_role_company_location(entry: Dict[str, Any], line: str) -> None:
    separator = None
    for candidate in ("|", " — ", " - ", ","):
        if candidate in line:
            separator = candidate
            break
    if separator is None:
        return

    parts = [part.strip() for part in line.split(separator) if part.strip()]
    if not parts:
        return

    first = parts[0]
    second = parts[1] if len(parts) > 1 else None
    third = parts[2] if len(parts) > 2 else None

    if entry["title"] is None:
        if second and COMPANY_HINT_RE.search(first) and not COMPANY_HINT_RE.search(second):
            entry["company"] = first
            entry["title"] = second
        else:
            entry["title"] = first

    if second and entry["company"] is None:
        entry["company"] = second if second != entry["title"] else None

    if third and entry["location"] is None:
        entry["location"] = third
