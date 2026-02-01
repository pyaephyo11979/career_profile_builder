import re
from typing import List, Dict, Any

DATE_RANGE_RE = re.compile(
    r"(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}|\d{4})\s*[-–—]\s*(present|"
    r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}|\d{4})",
    re.I
)

def extract_experience(lines: List[str]) -> List[Dict[str, Any]]:
    if not lines:
        return []

    entries: List[Dict[str, Any]] = []
    current: Dict[str, Any] | None = None

    for ln in lines:
        # Start new entry on date range line OR "Company - Title" style line
        if DATE_RANGE_RE.search(ln):
            if current:
                entries.append(current)
            current = {
                "title": None,
                "company": None,
                "start_date": None,
                "end_date": None,
                "location": None,
                "highlights": []
            }
            # Store date raw
            current["date_range_raw"] = ln
            continue

        if current is None:
            # create first entry if we see a likely heading line
            if len(ln) > 5:
                current = {
                    "title": None,
                    "company": None,
                    "start_date": None,
                    "end_date": None,
                    "location": None,
                    "highlights": []
                }

        # Bullet highlights
        if ln.startswith("-"):
            if current:
                current["highlights"].append(ln.lstrip("-").strip())
            continue

        # Try to infer title/company from non-bullet lines early in block
        if current:
            if current["company"] is None and ("|" in ln or " - " in ln or " — " in ln):
                # Split on separators
                for sep in ["|", " — ", " - "]:
                    if sep in ln:
                        left, right = [x.strip() for x in ln.split(sep, 1)]
                        # heuristic: left=title OR company
                        current["title"] = left if len(left.split()) <= 6 else current["title"]
                        current["company"] = right if len(right.split()) <= 8 else current["company"]
                        break
            else:
                # fallback: first non-bullet line as title/company if empty
                if current["title"] is None and len(ln.split()) <= 6:
                    current["title"] = ln
                elif current["company"] is None and len(ln.split()) <= 8:
                    current["company"] = ln

    if current:
        entries.append(current)

    # Cleanup
    for e in entries:
        e.pop("date_range_raw", None)

    # remove empty entries
    entries = [e for e in entries if e.get("title") or e.get("company") or e.get("highlights")]
    return entries
