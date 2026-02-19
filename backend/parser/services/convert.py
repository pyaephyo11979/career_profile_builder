from __future__ import annotations
from typing import Any, Dict, List
from parser.services.build_output import ResumeParser
from parser.services.profile_export import ResumeProfileExporter

class ResumeConverter:
    def __init__(self):
        self.parser = ResumeParser()
        self.exporter = ResumeProfileExporter()

    def convert(self, lines: List[str]) -> Dict[str, Any]:
        return self.parser.parse(lines)

    def convert_to_github_readme(self, lines: List[str]) -> str:
        parsed_data = self.convert(lines)
        return self.exporter.build_github_readme(parsed_data)

    def convert_to_linkedin_profile(self, lines: List[str]) -> Dict[str, Any]:
        parsed_data = self.convert(lines)
        return self.exporter.build_linkedin_profile(parsed_data)
