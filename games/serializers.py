from rest_framework import serializers
from .models import Transcript

class TranscriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transcript
        fields = ['user_name', 'messages', 'created_at', 'updated_at']
