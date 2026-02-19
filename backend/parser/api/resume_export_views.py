from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from parser.models import Resume
from parser.services.resume_workflow import ResumeWorkflowService


class ResumeExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.workflow = ResumeWorkflowService()

    def get(self, request, pk: int):
        resume = get_object_or_404(Resume, pk=pk, user=request.user)
        exports = self.workflow.build_exports(resume.parsed_data)
        return Response(
            {
                "resume_id": resume.id,
                "profile_exports": exports,
            }
        )
