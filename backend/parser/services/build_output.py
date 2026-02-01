from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Dict, Any, List, Sequence

from .section_splitter import split_sections
from .extract_contact import extract_contact
from .extract_skills import extract_skills
from .extract_education import extract_education
from .extract_experience import extract_experience
from .extract_projects import extract_projects
from .resume_health import score_resume


SectionSplitter = Callable[[Sequence[str]], Dict[str, List[str]]]
ContactExtractor = Callable[[Sequence[str]], Dict[str, Any]]
SectionExtractor = Callable[[Sequence[str]], Any]
ProjectExtractor = Callable[[Sequence[str]], List[Dict[str, Any]]]


@dataclass(slots=True)
class ResumeParser:
    """Composes the individual extraction steps into a single pipeline."""

    section_splitter: SectionSplitter = split_sections
    contact_extractor: ContactExtractor = extract_contact
    skills_extractor: Callable[[Sequence[str], Sequence[str] | None], Dict[str, Any]] = extract_skills
    education_extractor: SectionExtractor = extract_education
    experience_extractor: SectionExtractor = extract_experience
    projects_extractor: ProjectExtractor = extract_projects
    health_scorer: Callable[[Dict[str, Any]], Dict[str, Any]] = score_resume
    _sections: Dict[str, List[str]] = field(init=False, default_factory=dict)

    def parse(self, lines: Sequence[str]) -> Dict[str, Any]:
        normalized_lines = list(lines)
        self._sections = self.section_splitter(normalized_lines)

        contact = self.contact_extractor(normalized_lines)
        skills_section_lines = self._sections.get("skills")
        skills = self.skills_extractor(normalized_lines, skills_section_lines)

        education = self.education_extractor(self._sections.get("education", []))
        experience = self.experience_extractor(self._sections.get("experience", []))
        projects = self.projects_extractor(self._sections.get("projects", []))

        profile: Dict[str, Any] = {
            "contact": {
                "name": contact.get("name"),
                "email": contact.get("email"),
                "phone": contact.get("phone"),
                "links": contact.get("links"),
            },
            "sections_found": [*self._sections.keys()],
            "skills": skills,
            "education": education,
            "experience": experience,
            "projects": projects,
            "confidence": contact.get("confidence", {}),
        }

        profile["resume_health"] = self.health_scorer(profile)
        return profile


def parse_resume(lines: List[str]) -> Dict[str, Any]:
    """Backwards-compatible functional facade for callers."""
    parser = ResumeParser()
    return parser.parse(lines)
