from rest_framework import generics, permissions
from rest_framework.response import Response
from parser.models import Resume
from .serializers import ResumeCreateSerializer, ResumeUpdateSerializer

class ResumeUpdateView(generics.UpdateAPIView):
    serializer_class = ResumeUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(ResumeCreateSerializer(instance).data)
