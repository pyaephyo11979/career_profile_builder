from rest_framework import generics, permissions
from parser.models import Resume
from .serializers import ResumeUpdateSerializer

class ResumeUpdateView(generics.UpdateAPIView):
    serializer_class = ResumeUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)
