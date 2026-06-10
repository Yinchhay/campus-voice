# resolution_serializer.py
from rest_framework import serializers
from api.models import Resolution, ResolutionAttachment
from .attachment_serializers import ResolutionAttachmentSerializer


class ResolutionSerializer(serializers.ModelSerializer):
    resolved_by_info = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model  = Resolution
        fields = [
            'id',
            'note',
            'attachments',
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

    def get_attachments(self, obj):
        return ResolutionAttachmentSerializer(obj.attachments.all(), many=True).data
    
    def create(self, validated_data):
        request    = self.context.get('request')
        resolution = Resolution.objects.create(**validated_data)
        files      = request.FILES.getlist('attachments') if request else []
        for file in files[:3]:
            ResolutionAttachment.objects.create(
                resolution=resolution,
                file=file,
                uploaded_by=request.user,
            )
        return resolution

    def update(self, instance, validated_data):
        request = self.context.get('request')
        instance.note = validated_data.get('note', instance.note)
        instance.save()
        files = request.FILES.getlist('attachments') if request else []
        for file in files:
            current_count = instance.attachments.count()
            if current_count >= 3:
                break
            ResolutionAttachment.objects.create(
                resolution=instance,
                file=file,
                uploaded_by=request.user,
            )
        return instance