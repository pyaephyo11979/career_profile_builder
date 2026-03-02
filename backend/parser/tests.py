from django.test import SimpleTestCase

from parser.services.build_output import ResumeParser
from parser.services.extract_experience import extract_experience
from parser.services.preprocess import preprocess
from parser.services.profile_export import ResumeProfileExporter
from parser.services.resume_health import score_resume


class ResumeProfileExporterTests(SimpleTestCase):
    def setUp(self):
        self.exporter = ResumeProfileExporter()
        self.sample = {
            "contact": {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "links": {
                    "linkedin": "https://linkedin.com/in/janedoe",
                    "github": "https://github.com/janedoe",
                    "other": ["https://janedoe.dev"],
                },
            },
            "skills": {
                "categories": {
                    "programming_languages": ["Python", "TypeScript"],
                    "frameworks": ["Django", "React"],
                }
            },
            "experience": [
                {
                    "title": "Software Engineer",
                    "company": "Acme",
                    "highlights": ["Reduced API latency by 40%."],
                }
            ],
            "projects": [
                {
                    "name": "Career Profile Builder",
                    "summary": "Resume parsing platform.",
                    "highlights": ["Added profile exports."],
                    "links": ["https://github.com/janedoe/cpb"],
                }
            ],
            "education": [
                {
                    "school": "ABC University",
                    "degree": "BSc",
                    "field": "Computer Science",
                    "start_year": "2018",
                    "end_year": "2022",
                }
            ],
        }

    def test_export_returns_cv_and_github_payloads(self):
        result = self.exporter.export(self.sample)
        self.assertIn("cv_markdown", result)
        self.assertIn("github_readme", result)

    def test_github_readme_contains_key_sections(self):
        readme = self.exporter.build_github_readme(self.sample)
        self.assertIn("# Jane Doe", readme)
        self.assertIn("## Skills", readme)
        self.assertIn("## Experience", readme)
        self.assertIn("## Projects", readme)

    def test_linkedin_profile_contains_copy_ready_blocks(self):
        linkedin = self.exporter.build_linkedin_profile(self.sample)
        self.assertIn("headline", linkedin)
        self.assertIn("about", linkedin)
        self.assertGreater(len(linkedin["skills"]), 0)
        self.assertEqual(linkedin["experience"][0]["title"], "Software Engineer")


class ResumeExtractionRegressionTests(SimpleTestCase):
    def test_preprocess_merges_split_name_but_not_section_headers(self):
        raw = "Jane\nDoe\nExperience\nProjects\n"
        lines = preprocess(raw)
        self.assertIn("Jane Doe", lines)
        self.assertIn("Experience", lines)
        self.assertIn("Projects", lines)
        self.assertNotIn("Experience Projects", lines)

    def test_experience_parser_handles_role_company_dates_on_same_line(self):
        lines = [
            "Lead Backend Engineer | RocketOps | Jan 2022 - Present | Remote",
            "- Scaled ingestion pipeline to 50M events/day",
        ]
        items = extract_experience(lines)
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "Lead Backend Engineer")
        self.assertEqual(items[0]["company"], "RocketOps")
        self.assertEqual(items[0]["start_date"], "Jan 2022")
        self.assertEqual(items[0]["end_date"].lower(), "present")

    def test_parser_falls_back_to_unknown_section_when_headers_missing(self):
        parser = ResumeParser()
        lines = [
            "Jane Doe",
            "jane@example.com",
            "Software Engineer | ACME Corp",
            "2021 - Present",
            "- Improved page load by 45%",
        ]
        parsed = parser.parse(lines)
        self.assertGreater(len(parsed["experience"]), 0)


class ResumeHealthRegressionTests(SimpleTestCase):
    def test_health_detects_links_when_links_provided_as_list(self):
        payload = {
            "contact": {
                "name": "Jordan Chen",
                "email": "jordan@example.com",
                "phone": "+1 555 222 1111",
                "links": [
                    "https://www.linkedin.com/in/jordanchen",
                    "https://github.com/jordanchen",
                ],
            },
            "skills": {"categories": {"frameworks": ["Django", "React", "FastAPI", "DRF"]}},
            "education": [{"school": "ABC University", "degree": "BSc"}],
            "experience": [{"title": "Engineer", "highlights": ["Improved SLA by 35%"]}],
        }
        health = score_resume(payload)
        self.assertIn("Professional links detected", health["strengths"])
        self.assertNotIn("No GitHub/LinkedIn detected", health["warnings"])
