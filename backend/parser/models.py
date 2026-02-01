from django.db import models
from django.contrib.auth.models import User

class Resume(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="resumes")

    file_name = models.CharField(max_length=255)
    raw_text = models.TextField(blank=True)

    parsed_data = models.JSONField()
    resume_health = models.JSONField()

    is_confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.id} - {self.user.username} - {self.file_name}"
