from rest_framework import serializers
from api.models import StaffRole, Permission, User

class PermissionSerializer(serializers.ModelSerialzier):
    codename = serializers.ReadOnlyField()
    action = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model  = Permission
        fields = [
            'id',
            'resource',
            'action',
            'description',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
        
class StaffRoleListSerializer(serializers.ModelSerializer):
    permission_count = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model  = StaffRole
        fields = [
            'id',
            'name',
            'description',
            'permission_count',
            'user_count',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
        
    def get_permission_count(self, obj):
        return obj.permissions.count()

    def get_user_count(self, obj):
        return obj.users.count()
    
    
class StaffRoleDetailSerializer(serializers.ModelSerializer):
    permissions    = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all(),
        source='permissions',
        write_only=True,
        required=False,
    )
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model  = StaffRole
        fields = [
            'id',
            'name',
            'description',
            'permissions',      # read
            'permission_ids',   # write
            'user_count',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_count(self, obj):
        return obj.users.count()

# ── Staff User ────────────────────────────────────────────────────────────────

class StaffUserSerializer(serializers.ModelSerializer):
    """
    For role=STAFF users.
    staff_role is required — it defines what they can do in the system.
    """
    role_display    = serializers.CharField(source='get_role_display', read_only=True)
    staff_role_info = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'role_display',
            'staff_role',       # write: FK id
            'staff_role_info',  # read: full role + permissions
            'is_active',
            'google_picture_url',
            'created_at',
            'last_login',
        ]
        read_only_fields = [
            'id', 'role', 'role_display',
            'google_picture_url', 'created_at', 'last_login',
        ]

    def get_staff_role_info(self, obj):
        if obj.staff_role:
            return {
                'id':          obj.staff_role.id,
                'name':        obj.staff_role.name,
                'permissions': [
                    {
                        'codename': p.codename,
                        'resource': p.resource,
                        'action':   p.action,
                    }
                    for p in obj.staff_role.permissions.all()
                ],
            }
        return None

    def validate_staff_role(self, value):
        if not value:
            raise serializers.ValidationError(
                "Staff users must have a role assigned."
            )
        return value


# ── Admin User ────────────────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    """
    For role=ADMIN users.
    No staff_role needed — admins have full system access via is_staff=True.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model  = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'role_display',
            'is_staff',
            'is_active',
            'google_picture_url',
            'created_at',
            'last_login',
        ]
        read_only_fields = [
            'id', 'role', 'role_display',
            'google_picture_url', 'created_at', 'last_login',
        ]


# ── Shared User List (Admin Panel Overview) ───────────────────────────────────

class UserListSerializer(serializers.ModelSerializer):
    """
    Lightweight — used when listing ALL staff + admin users together.
    e.g. an admin panel user management table.
    """
    role_display    = serializers.CharField(source='get_role_display', read_only=True)
    staff_role_name = serializers.CharField(
        source='staff_role.name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model  = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'role_display',
            'staff_role_name',  # None for admins
            'is_active',
            'created_at',
            'last_login',
        ]
        read_only_fields = ['id', 'created_at', 'last_login']