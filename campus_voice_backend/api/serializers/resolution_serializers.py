# resolution_serializer.py
from rest_framework import serializers
from api.models import Resolution


class ResolutionSerializer(serializers.ModelSerializer):
    resolved_by_info = serializers.SerializerMethodField()

    class Meta:
        model  = Resolution
        fields = [
            'id',
            'note',
            'attachment',
            'resolved_by_info',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'resolved_by_info', 'created_at', 'updated_at']

    def get_resolved_by_info(self, obj):
        if obj.resolved_by:
            return {
                'name':  obj.resolved_by.get_full_name() or obj.resolved_by.email,
                'email': obj.resolved_by.email,
            }
        return None