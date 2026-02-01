import re
from typing import Dict, Any

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")
URL_RE = re.compile(r"(https?://[^\s]+|www\.[^\s]+)")

def extract_contact(lines: list[str]) -> Dict[str, Any]:
    text = "\n".join(lines)

    email = (EMAIL_RE.search(text).group(0) if EMAIL_RE.search(text) else None)
    phone = (PHONE_RE.search(text).group(0) if PHONE_RE.search(text) else None)
    urls = URL_RE.findall(text)

    links = {"linkedin": None, "github": None, "portfolio": None, "other": []}
    for u in urls:
        lu = u.lower()
        if "linkedin.com" in lu:
            links["linkedin"] = u
        elif "github.com" in lu:
            links["github"] = u
        else:
            links["other"].append(u)

    confidence = {
        "email": 0.99 if email else 0.0,
        "phone": 0.85 if phone else 0.0,
        "links": 0.90 if urls else 0.0,
        "name": 0.0  # set in name step later
    }

    # Name heuristic: first meaningful line that isn't contact info
    name = None
    for ln in lines[:5]:
        l = ln.strip()
        if not l:
            continue
        if email and email in l:
            continue
        if phone and phone in l:
            continue
        if URL_RE.search(l):
            continue
        # likely name: 2-4 words, mostly letters, starts uppercase
        parts = [p for p in re.split(r"\s+", l) if p]
        if 1 < len(parts) <= 4 and all(re.match(r"^[A-Za-z.-]+$", p) for p in parts):
            if all(p[0].isupper() for p in parts if p):
                name = l
                confidence["name"] = 0.6
                break

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "links": links,
        "confidence": confidence
    }
