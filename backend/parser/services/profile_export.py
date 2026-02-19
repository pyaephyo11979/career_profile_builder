from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass(slots=True)
class ResumeProfileExporter:
    """Builds platform-specific profile text from parsed resume data."""

    def export(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "github_readme": self.build_github_readme(parsed_data),
            "linkedin_profile": self.build_linkedin_profile(parsed_data),
        }

    def build_github_readme(self, parsed_data: Dict[str, Any]) -> str:
        contact = parsed_data.get("contact", {})
        name = contact.get("name") or "Your Name"
        email = contact.get("email")
        links = contact.get("links") or {}
        skills = parsed_data.get("skills", {}).get("categories", {})
        experience = parsed_data.get("experience", [])
        projects = parsed_data.get("projects", [])

        lines: List[str] = [
            f"# {name}",
            "",
            "## About Me",
            "I build reliable software products and focus on delivering measurable impact.",
            "",
            "## Contact",
        ]

        if email:
            lines.append(f"- Email: {email}")
        if links.get("linkedin"):
            lines.append(f"- LinkedIn: {links['linkedin']}")
        if links.get("github"):
            lines.append(f"- GitHub: {links['github']}")
        for url in links.get("other", []):
            lines.append(f"- Portfolio/Other: {url}")

        lines.extend(["", "## Skills"])
        for category, values in skills.items():
            if values:
                readable = category.replace("_", " ").title()
                lines.append(f"- **{readable}**: {', '.join(values)}")

        if experience:
            lines.extend(["", "## Experience"])
            for item in experience:
                title = item.get("title") or "Role"
                company = item.get("company") or "Company"
                lines.append(f"### {title} - {company}")
                for highlight in item.get("highlights", [])[:3]:
                    lines.append(f"- {highlight}")
                lines.append("")

        if projects:
            lines.extend(["## Projects"])
            for project in projects:
                name = project.get("name") or "Project"
                summary = project.get("summary") or ""
                lines.append(f"### {name}")
                if summary:
                    lines.append(summary)
                for highlight in project.get("highlights", [])[:3]:
                    lines.append(f"- {highlight}")
                if project.get("links"):
                    lines.append(f"- Link: {project['links'][0]}")
                lines.append("")

        return "\n".join(lines).strip()

    def build_linkedin_profile(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        contact = parsed_data.get("contact", {})
        skills = parsed_data.get("skills", {}).get("categories", {})
        experience = parsed_data.get("experience", [])
        projects = parsed_data.get("projects", [])
        education = parsed_data.get("education", [])

        top_skills = self._flatten_top_skills(skills)
        latest_role = self._latest_role(experience)

        headline = self._build_headline(latest_role, top_skills)
        about = self._build_about(latest_role, top_skills, projects)

        return {
            "name": contact.get("name"),
            "headline": headline,
            "about": about,
            "experience": self._linkedin_experience(experience),
            "projects": self._linkedin_projects(projects),
            "education": self._linkedin_education(education),
            "skills": top_skills,
        }

    def _flatten_top_skills(self, categories: Dict[str, List[str]], limit: int = 12) -> List[str]:
        flattened: List[str] = []
        for values in categories.values():
            for skill in values:
                if skill not in flattened:
                    flattened.append(skill)
                if len(flattened) >= limit:
                    return flattened
        return flattened

    def _latest_role(self, experience: List[Dict[str, Any]]) -> Dict[str, Any]:
        return experience[0] if experience else {}

    def _build_headline(self, latest_role: Dict[str, Any], skills: List[str]) -> str:
        title = latest_role.get("title")
        company = latest_role.get("company")
        core_skills = " | ".join(skills[:3]) if skills else "Software Engineering"

        if title and company:
            return f"{title} at {company} | {core_skills}"
        if title:
            return f"{title} | {core_skills}"
        return f"Software Professional | {core_skills}"

    def _build_about(
        self,
        latest_role: Dict[str, Any],
        skills: List[str],
        projects: List[Dict[str, Any]],
    ) -> str:
        role = latest_role.get("title") or "software professional"
        highlights = latest_role.get("highlights", [])
        project_names = [p.get("name") for p in projects if p.get("name")]
        skill_text = ", ".join(skills[:8]) if skills else "modern software tools"

        lines = [
            f"I am a {role} focused on building high-quality products and practical solutions.",
            f"My core toolkit includes {skill_text}.",
        ]

        if highlights:
            lines.append(f"Recent impact: {highlights[0]}")
        if project_names:
            lines.append(f"Highlighted projects include: {', '.join(project_names[:3])}.")

        lines.append("I enjoy collaborating across teams and continuously improving delivery quality.")
        return " ".join(lines)

    def _linkedin_experience(self, experience: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ready: List[Dict[str, Any]] = []
        for item in experience:
            ready.append(
                {
                    "title": item.get("title"),
                    "company": item.get("company"),
                    "start_date": item.get("start_date"),
                    "end_date": item.get("end_date") or "Present",
                    "location": item.get("location"),
                    "description_bullets": item.get("highlights", [])[:5],
                }
            )
        return ready

    def _linkedin_projects(self, projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ready: List[Dict[str, Any]] = []
        for item in projects:
            ready.append(
                {
                    "name": item.get("name"),
                    "description": item.get("summary"),
                    "highlights": item.get("highlights", [])[:3],
                    "url": (item.get("links") or [None])[0],
                }
            )
        return ready

    def _linkedin_education(self, education: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ready: List[Dict[str, Any]] = []
        for item in education:
            ready.append(
                {
                    "school": item.get("school"),
                    "degree": item.get("degree"),
                    "field": item.get("field"),
                    "start_year": item.get("start_year"),
                    "end_year": item.get("end_year"),
                }
            )
        return ready
