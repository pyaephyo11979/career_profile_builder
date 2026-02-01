import re
from typing import Dict, Any

NUMBERS_RE = re.compile(r"\b\d+(\.\d+)?%?\b")

def score_resume(profile: Dict[str, Any]) -> Dict[str, Any]:
    score = 0
    warnings = []
    strengths = []
    suggestions = []

    # Completeness checks
    contact = profile.get("contact", {})
    skills = profile.get("skills", {}).get("categories", {})
    education = profile.get("education", [])
    experience = profile.get("experience", [])

    # Email
    if contact.get("email"):
        score += 15
        strengths.append("Email detected")
    else:
        warnings.append("Missing email")
        suggestions.append("Add a professional email address.")

    # Skills count
    total_skills = sum(len(v) for v in skills.values()) if isinstance(skills, dict) else 0
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

    # Education
    if education:
        score += 15
        strengths.append("Education detected")
    else:
        warnings.append("Education not detected")
        suggestions.append("Add Education details (school, degree, years).")

    # Experience
    if experience:
        score += 20
        strengths.append("Experience detected")
        # Check quantified achievements
        highlights_text = " ".join(" ".join(e.get("highlights", [])) for e in experience)
        if NUMBERS_RE.search(highlights_text):
            score += 10
            strengths.append("Includes quantified achievements")
        else:
            warnings.append("Experience lacks quantified impact")
            suggestions.append("Add numbers to achievements (%, time saved, users, revenue, bugs fixed).")
    else:
        warnings.append("Experience not detected")
        suggestions.append("Add any internship, volunteering, freelance, or project experience with bullet points.")

    # Links
    links = contact.get("links", {})
    if links and (links.get("github") or links.get("linkedin")):
        score += 10
        strengths.append("Professional links detected")
    else:
        warnings.append("No GitHub/LinkedIn detected")
        suggestions.append("Add GitHub and/or LinkedIn links to improve credibility.")

    score = min(score, 100)

    return {
        "score": score,
        "strengths": strengths[:5],
        "warnings": warnings[:5],
        "suggestions": suggestions[:5]
    }
