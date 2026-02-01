import re
from typing import List

BULLETS= ['•', '-', '*', '‣', '◦', '▪', '_', '·']

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

    joined: list[str] = []
    i=0
    while i < len(lines):
        cur = lines[i]
        nxt = lines[i+1] if i+1 < len(lines) else ""
        if cur and nxt and len(cur) <=20 and len(nxt) <=20 and cur.isalpha() and nxt.isalpha():
            joined.append(cur + " " +nxt)
            i += 2
        else:
            joined.append(cur)
            i += 1
    return joined