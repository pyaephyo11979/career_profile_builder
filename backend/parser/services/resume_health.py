import re
from typing import Any, Dict, List

NUMBERS_RE = re.compile(r"\b\d+(?:\.\d+)?%?\b")


def score_resume(profile: Dict[str, Any]) -> Dict[str, Any]:
    data = _unwrap_profile(profile)
    score = 0
    warnings: List[str] = []
    strengths: List[str] = []
    suggestions: List[str] = []

    contact = data.get("contact", {}) if isinstance(data.get("contact"), dict) else {}
    skills_categories = _skills_categories(data.get("skills"))
    education = data.get("education") if isinstance(data.get("education"), list) else []
    experience = data.get("experience") if isinstance(data.get("experience"), list) else []

    if contact.get("name"):
        score += 5
        strengths.append("Name detected")
    else:
        warnings.append("Missing name")
        suggestions.append("Include your full name at the top of the resume.")

    if contact.get("email"):
        score += 12
        strengths.append("Email detected")
    else:
        warnings.append("Missing email")
        suggestions.append("Add a professional email address.")

    if contact.get("phone"):
        score += 6
        strengths.append("Phone number detected")
    else:
        warnings.append("Missing phone number")
        suggestions.append("Add a reachable phone number.")

    total_skills = sum(len(values) for values in skills_categories.values())
    if total_skills >= 8:
        score += 20
        strengths.append("Skills section looks strong")
    elif total_skills > 0:
        score += 10
        warnings.append("Skills list is short")
        suggestions.append("Add more relevant skills (tools, frameworks, databases).")
    else:
        warnings.append("Skills not detected")
        suggestions.append("Add a Skills section with clear keywords (e.g., React, Django, MySQL).")

    if _has_meaningful_entries(education):
        score += 15
        strengths.append("Education detected")
    else:
        warnings.append("Education not detected")
        suggestions.append("Add Education details (school, degree, years).")

    if _has_meaningful_entries(experience):
        score += 20
        strengths.append("Experience detected")
        highlights_text = " ".join(
            " ".join(item.get("highlights", [])) for item in experience if isinstance(item, dict)
        )
        if NUMBERS_RE.search(highlights_text):
            score += 10
            strengths.append("Includes quantified achievements")
        else:
            warnings.append("Experience lacks quantified impact")
            suggestions.append("Add numbers to achievements (%, time saved, users, revenue, bugs fixed).")
    else:
        warnings.append("Experience not detected")
        suggestions.append("Add any internship, volunteering, freelance, or project experience with bullet points.")

    links = _normalize_links(contact.get("links"))
    if links.get("github") or links.get("linkedin"):
        score += 12
        strengths.append("Professional links detected")
    else:
        warnings.append("No GitHub/LinkedIn detected")
        suggestions.append("Add GitHub and/or LinkedIn links to improve credibility.")

    return {
        "score": min(score, 100),
        "strengths": strengths[:5],
        "warnings": warnings[:5],
        "suggestions": suggestions[:5],
    }


def _unwrap_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(profile, dict):
        return {}
    parsed = profile.get("parsed_data")
    if isinstance(parsed, dict):
        return parsed
    return profile


def _skills_categories(skills: Any) -> Dict[str, List[Any]]:
    if not isinstance(skills, dict):
        return {}
    categories = skills.get("categories")
    if isinstance(categories, dict):
        normalized: Dict[str, List[Any]] = {}
        for key, values in categories.items():
            if isinstance(values, list):
                normalized[key] = [v for v in values if v]
            elif values:
                normalized[key] = [values]
            else:
                normalized[key] = []
        return normalized
    return {}


def _has_meaningful_entries(entries: List[Any]) -> bool:
    for item in entries:
        if isinstance(item, dict):
            if any(value for value in item.values()):
                return True
        elif item:
            return True
    return False


def _normalize_links(raw_links: Any) -> Dict[str, Any]:
    normalized = {"github": None, "linkedin": None, "other": []}
    candidates: List[str] = []

    if isinstance(raw_links, dict):
        for key in ("github", "linkedin"):
            value = raw_links.get(key)
            if isinstance(value, str) and value.strip():
                normalized[key] = value.strip()
                candidates.append(value.strip())
        other = raw_links.get("other")
        if isinstance(other, list):
            candidates.extend([str(link).strip() for link in other if str(link).strip()])
        elif isinstance(other, str) and other.strip():
            candidates.append(other.strip())
    elif isinstance(raw_links, list):
        candidates.extend([str(link).strip() for link in raw_links if str(link).strip()])
    elif isinstance(raw_links, str) and raw_links.strip():
        candidates.append(raw_links.strip())

    for candidate in candidates:
        lowered = candidate.lower()
        if normalized["github"] is None and "github.com" in lowered:
            normalized["github"] = candidate
        elif normalized["linkedin"] is None and "linkedin.com" in lowered:
            normalized["linkedin"] = candidate
        else:
            normalized["other"].append(candidate)

    normalized["other"] = list(dict.fromkeys(normalized["other"]))
    return normalized
