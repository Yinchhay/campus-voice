from rest_framework import serializers
from django.contrib.auth import get_user_model
from api.models import AdminRole, UserRole, Permission

User = get_user_model()

# ── Permission ────────────────────────────────────────────────────────────────

class PermissionSerializer(serializers.ModelSerializer):
    codename       = serializers.ReadOnlyField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model  = Permission
        fields = [
            'id',
            'resource',
            'action',
            'action_display',
            'description',
            'codename',
        ]
        read_only_fields = ['id', 'codename']

# ── Staff Role ────────────────────────────────────────────────────────────────

class AdminRoleSerializer(serializers.ModelSerializer):
    """Lightweight — used in lists and nested inside user serializer."""

    class Meta:
        model  = AdminRole
        fields = ['id', 'name', 'description', 'is_superadmin']


class AdminRoleDetailSerializer(serializers.ModelSerializer):
    """Full detail — used for role create/retrieve/update."""
    permissions    = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='permissions'
    )
    user_count = serializers.SerializerMethodField()

    class Meta:
        model  = AdminRole
        fields = [
            'id',
            'name',
            'description',
            'is_superadmin',
            'permissions',      # read
            'permission_ids',   # write
            'user_count',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_count(self, obj):
        return obj.user_assignments.count()


# ── User Role Assignment ──────────────────────────────────────────────────────

class UserRoleSerializer(serializers.ModelSerializer):
    """For listing/assigning roles to a user."""
    role    = AdminRoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(
        queryset=AdminRole.objects.all(),
        write_only=True,
        source='role'
    )
    assigned_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = UserRole
        fields = [
            'id',
            'role',
            'role_id',
            'assigned_at',
            'assigned_by',
            'assigned_by_name',
        ]
        read_only_fields = ['id', 'assigned_at', 'assigned_by', 'assigned_by_name']

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.get_full_name() or obj.assigned_by.email
        return None


# ── Admin User (unified — works for both STAFF and ADMIN) ────────────────────
class AdminUserSerializer(serializers.ModelSerializer):
    """
    Single serializer for all admin-side users (STAFF + ADMIN).
    No distinction needed — permission system handles the difference.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    full_name    = serializers.SerializerMethodField()
    roles        = serializers.SerializerMethodField()
    is_superadmin = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'role_display',
            'is_superadmin',
            'google_picture_url',   # fix: your model stores this directly
            'is_staff',
            'is_active',
            'roles',
            'created_at',
            'last_login',
        ]
        read_only_fields = [
            'id', 'role_display', 'google_picture_url',
            'created_at', 'last_login',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email

    def get_is_superadmin(self, obj):
        # Admin role = superadmin, bypasses all permission checks
        return obj.role == User.Role.ADMIN

    def get_roles(self, obj):
        # fix: was cut off, and referenced social_accounts which doesn't exist
        user_roles = obj.admin_roles.select_related('role').prefetch_related('role__permissions')
        return [
            {
                'id':           ur.role.id,
                'name':         ur.role.name,
                'is_superadmin': ur.role.is_superadmin,
                'permissions':  [
                    {'codename': p.codename, 'resource': p.resource, 'action': p.action}
                    for p in ur.role.permissions.all()
                ],
            }
            for ur in user_roles
        ]

class AdminChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_new_password = serializers.CharField(required=True, min_length=8)

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError({"confirm_new_password": "New passwords do not match."})
        return data