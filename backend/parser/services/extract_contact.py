import re
from typing import Any, Dict, Iterable

from .section_splitter import HEADERS

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")
URL_RE = re.compile(r"(https?://[^\s]+|www\.[^\s]+)")
HEADER_VARIANTS = {variant.lower() for values in HEADERS.values() for variant in values}


def _is_header(line: str) -> bool:
    return line.strip().lower().rstrip(":") in HEADER_VARIANTS


def _head_block(lines: Iterable[str]) -> list[str]:
    """Limit contact extraction to the leading block before the first section header."""
    collected: list[str] = []
    for ln in lines:
        if _is_header(ln):
            break
        collected.append(ln)
        if len(collected) >= 30:
            break
    return collected if collected else list(lines)[:30]


def extract_contact(lines: list[str]) -> Dict[str, Any]:
    scoped_lines = _head_block(lines)
    text = "\n".join(scoped_lines)

    email = EMAIL_RE.search(text)
    phone = PHONE_RE.search(text)
    urls = URL_RE.findall(text)

    email_val = email.group(0) if email else None
    phone_val = phone.group(0) if phone else None

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
        "email": 0.99 if email_val else 0.0,
        "phone": 0.85 if phone_val else 0.0,
        "links": 0.90 if urls else 0.0,
        "name": 0.0,
    }

    name = None
    for ln in scoped_lines[:5]:
        l = ln.strip()
        if not l:
            continue
        if email_val and email_val in l:
            continue
        if phone_val and phone_val in l:
            continue
        if URL_RE.search(l):
            continue
        parts = [p for p in re.split(r"\s+", l) if p]
        if 1 < len(parts) <= 4 and all(re.match(r"^[A-Za-z.-]+$", p) for p in parts):
            if all(p[0].isupper() for p in parts if p):
                name = l
                confidence["name"] = 0.6
                break

    return {
        "name": name,
        "email": email_val,
        "phone": phone_val,
        "links": links,
        "confidence": confidence,
    }
