import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.exceptions import ValidationError

from parser.models import Resume
from .serializers import ResumeUploadSerializer
from parser.services.extract_text import extract_text
from parser.services.preprocess import preprocess
from parser.services.build_output import ResumeParser


logger = logging.getLogger(__name__)


class ParseResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.parser = ResumeParser()

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upload = serializer.validated_data["file"]
        raw_text = self._extract_raw_text(upload)
        lines = preprocess(raw_text)
        parsed = self.parser.parse(lines)

        resume = Resume.objects.create(
            user=request.user,
            file_name=upload.name,
            raw_text=raw_text,
            parsed_data=parsed,
            resume_health=parsed.get("resume_health", {}),
        )

        payload = {"resume_id": resume.id, **parsed, "raw_text": raw_text}
        return Response(payload, status=status.HTTP_201_CREATED)

    def _extract_raw_text(self, upload):
        try:
            file_bytes = upload.read()
            if not file_bytes:
                raise ValidationError({"file": "Uploaded document is empty."})
            return extract_text(upload.name, file_bytes)
        except ValidationError:
            raise
        except ValueError as exc:
            raise ValidationError({"file": str(exc)}) from exc
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Unexpected failure while extracting resume text")
            raise ValidationError({"file": "Unable to read the uploaded file."}) from exc
