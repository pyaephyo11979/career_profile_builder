from rest_framework import serializers
from parser.models import Resume

class ResumeUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        name=value.name.lower()
        if not name.endswith(('.pdf', '.doc', '.docx')):
            raise serializers.ValidationError("Unsupported file type. Please upload a PDF or Word document.")
        if value.size > 5 * 1024 * 1024:  # 5 MB limit
            raise serializers.ValidationError("File size exceeds the 5 MB limit.")
        return value
    
class ResumeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ["id", "file_name", "raw_text", "parsed_data", "resume_health",
                  "is_confirmed", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class ResumeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ["parsed_data", "resume_health", "is_confirmed"]