import re
from typing import List

from .section_splitter import HEADERS

BULLETS= ['•', '-', '*', '‣', '◦', '▪', '_', '·']
HEADER_VARIANTS = {variant.lower() for values in HEADERS.values() for variant in values}
BROKEN_HEADER_RE = re.compile(r"^(?:[A-Za-z]\s+){2,}[A-Za-z]$")
NAME_TOKEN_RE = re.compile(r"^[A-Za-z][A-Za-z'.-]{0,18}$")


def _looks_like_header(line: str) -> bool:
    normalized = line.strip().lower().rstrip(":")
    return normalized in HEADER_VARIANTS


def _can_merge_name_lines(cur: str, nxt: str) -> bool:
    if _looks_like_header(cur) or _looks_like_header(nxt):
        return False
    cur_tokens = cur.split()
    nxt_tokens = nxt.split()
    if len(cur_tokens) != 1 or len(nxt_tokens) != 1:
        return False
    return bool(NAME_TOKEN_RE.match(cur_tokens[0]) and NAME_TOKEN_RE.match(nxt_tokens[0]))

def preprocess(raw_text: str) -> List[str]:
    if not raw_text:
        return []
    
    text = raw_text.replace('\r','\n')
    for b in BULLETS:
        text = text.replace(b, '-')

    text=re.sub(r"[ \t]+", " ", text)
    text=re.sub(r"\n{3,}", "\n\n", text)

    lines = [ln.strip() for ln in text.split("\n")]
    lines = [ln for ln in lines if ln]

    def _unsplit(line: str) -> str:
        if BROKEN_HEADER_RE.match(line):
            return line.replace(" ", "")
        return line

    lines = [_unsplit(ln) for ln in lines]

    joined: list[str] = []
    i=0
    while i < len(lines):
        cur = lines[i]
        nxt = lines[i+1] if i+1 < len(lines) else ""
        if cur and nxt and _can_merge_name_lines(cur, nxt):
            joined.append(cur + " " +nxt)
            i += 2
        else:
            joined.append(cur)
            i += 1
    return joined
