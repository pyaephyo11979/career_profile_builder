from rest_framework import serializers
from parser.models import Resume
from parser.services.profile_export import ResumeProfileExporter

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
    profile_exports = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ["id", "file_name", "raw_text", "parsed_data", "resume_health",
                  "is_confirmed", "created_at", "updated_at", "profile_exports"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_profile_exports(self, obj):
        exporter = ResumeProfileExporter()
        return exporter.export(obj.parsed_data)

class ResumeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ["parsed_data", "resume_health", "is_confirmed"]
