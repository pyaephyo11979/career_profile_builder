from django.test import SimpleTestCase

from parser.services.profile_export import ResumeProfileExporter


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

    def test_export_returns_github_and_linkedin_payloads(self):
        result = self.exporter.export(self.sample)
        self.assertIn("github_readme", result)
        self.assertIn("linkedin_profile", result)

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
