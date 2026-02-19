from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict

from rest_framework.exceptions import ValidationError

from parser.services.build_output import ResumeParser
from parser.services.extract_text import extract_text
from parser.services.preprocess import preprocess
from parser.services.profile_export import ResumeProfileExporter


@dataclass(slots=True)
class ResumeWorkflowService:
    parser: ResumeParser = field(default_factory=ResumeParser)
    exporter: ResumeProfileExporter = field(default_factory=ResumeProfileExporter)

    def process_upload(self, upload) -> Dict[str, Any]:
        raw_text = self._extract_raw_text(upload)
        lines = preprocess(raw_text)
        parsed_data = self.parser.parse(lines)
        profile_exports = self.exporter.export(parsed_data)

        return {
            "raw_text": raw_text,
            "parsed_data": parsed_data,
            "profile_exports": profile_exports,
        }

    def build_exports(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.exporter.export(parsed_data)

    def _extract_raw_text(self, upload) -> str:
        try:
            file_bytes = upload.read()
            if not file_bytes:
                raise ValidationError({"file": "Uploaded document is empty."})
            return extract_text(upload.name, file_bytes)
        except ValidationError:
            raise
        except ValueError as exc:
            raise ValidationError({"file": str(exc)}) from exc
        except Exception as exc:
            raise ValidationError({"file": "Unable to read the uploaded file."}) from exc
