from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from parser.models import Resume
from .serializers import ResumeUploadSerializer
from parser.services.resume_workflow import ResumeWorkflowService


class ParseResumeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.workflow = ResumeWorkflowService()

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        upload = serializer.validated_data["file"]
        result = self.workflow.process_upload(upload)
        raw_text = result["raw_text"]
        parsed = result["parsed_data"]
        profile_exports = result["profile_exports"]

        resume = Resume.objects.create(
            user=request.user,
            file_name=upload.name,
            raw_text=raw_text,
            parsed_data=parsed,
            resume_health=parsed.get("resume_health", {}),
        )

        payload = {"resume_id": resume.id, **parsed, "raw_text": raw_text, "profile_exports": profile_exports}
        return Response(payload, status=status.HTTP_201_CREATED)
