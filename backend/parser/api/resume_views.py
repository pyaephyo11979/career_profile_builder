from rest_framework import generics, permissions
from parser.models import Resume
from .serializers import ResumeCreateSerializer

class ResumeListView(generics.ListAPIView):
    serializer_class = ResumeCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user).order_by("-created_at")

class ResumeDetailView(generics.RetrieveAPIView):
    serializer_class = ResumeCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # ✅ prevents accessing other users' resumes
        return Resume.objects.filter(user=self.request.user)
