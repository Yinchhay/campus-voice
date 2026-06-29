from django.core.management.base import BaseCommand
from api.models import Permission, AdminRole, UserRole

PREDEFINED_PERMISSIONS = [
    # Ticket
    ('ticket',     'view',   'Can view tickets'),
    ('ticket',     'create', 'Can create tickets'),
    ('ticket',     'update', 'Can update tickets'),
    ('ticket',     'delete', 'Can delete tickets'),
    ('ticket',     'export', 'Can export tickets'),
    
    # Category
    ('category',   'view',   'Can view categories'),
    ('category',   'create', 'Can create categories'),
    ('category',   'update', 'Can update categories'),
    ('category',   'delete', 'Can delete categories'),
    
    # Message
    ('message',    'view',   'Can view messages'),
    ('message',    'create', 'Can send messages'),
    
    # Resolution
    ('resolution', 'view',   'Can view resolutions'),
    ('resolution', 'create', 'Can create resolutions'),
    ('resolution', 'update', 'Can update resolutions'),
    
    # User management
    ('user',       'view',   'Can view users'),
    ('user',       'create', 'Can create users'),
    ('user',       'update', 'Can update users'),
    ('user',       'delete', 'Can delete users'),
    
    # Role management
    ('role',       'view',   'Can view roles'),
    ('role',       'create', 'Can create roles'),
    ('role',       'update', 'Can update roles'),
    ('role',       'delete', 'Can delete roles'),
    
    # Permission management
    ('permission', 'view',   'Can view permissions'),
    
    # Setting management
    ('setting',    'view',   'Can view settings'),
    ('setting',    'create', 'Can create settings'),
    ('setting',    'update', 'Can update settings'),
    ('setting',    'delete', 'Can delete settings'),
    
    # Profanity management
    ('profanity',  'view',   'Can view profanity words'),
    ('profanity',  'create', 'Can add profanity words'),
    ('profanity',  'delete', 'Can delete profanity words'),
    
    # Meeting
    ('meeting',    'view',   'Can view meetings'),
    ('meeting',    'create', 'Can create meeting slots'),
    ('meeting',    'update', 'Can update meeting slots'),
    ('meeting',    'delete', 'Can delete meeting slots'),
    
]


ROLES = [
    {
        'name': 'Admin',
        'description': 'Full access to all features. Bypasses all permission checks.',
        'is_superadmin': True,
        'permissions': [],  # superadmin bypasses checks — no need to assign
    },
    {
        'name': 'Support Staff',
        'description': 'Can manage tickets, send messages, and resolve tickets.',
        'is_superadmin': False,
        'permissions': [
            ('ticket',     'view'),
            ('ticket',     'update'),
            # Communication
            ('message',    'view'),
            ('message',    'create'),
            # Resolution
            ('resolution', 'view'),
            ('resolution', 'create'),
            ('resolution', 'update'),
            # Categories
            ('category',   'view'),
            ('category', 'create'),
            ('category', 'update'),
            ('category', 'delete'),
            # Meetings
            ('meeting',  'view'),
            ('meeting',  'create'),
            ('meeting',  'update'),
            ('meeting',  'delete'),
            # Content moderation
            ('profanity',  'view'),
            ('profanity',  'create'),
            ('profanity',  'delete'),
        ],
    },
    {
        'name': 'Category Manager',
        'description': 'Can manage ticket categories.',
        'is_superadmin': False,
        'permissions': [
            ('category', 'view'),
            ('category', 'create'),
            ('category', 'update'),
            ('category', 'delete'),
            ('ticket',   'view'),
        ],
    },
]

class Command(BaseCommand):
    help = 'Seed RBAC permissions, roles'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting RBAC seeding...'))

        # ── Permissions ───────────────────────────────────────────────────────
        self.stdout.write('\nSeeding permissions...')
        permissions_created = 0
        for resource, action, description in PREDEFINED_PERMISSIONS:
            _, created = Permission.objects.get_or_create(
                resource=resource,
                action=action,
                defaults={'description': description},
            )
            if created:
                permissions_created += 1
                self.stdout.write(f'  + {resource}.{action}')
        self.stdout.write(
            self.style.SUCCESS(f'  {permissions_created} new permissions created')
        )

        # ── Roles ─────────────────────────────────────────────────────────────
        self.stdout.write('\nSeeding roles...')
        for role_data in ROLES:
            role, created = AdminRole.objects.get_or_create(
                name=role_data['name'],
                defaults={
                    'description':  role_data['description'],
                    'is_superadmin': role_data['is_superadmin'],
                },
            )
            status_label = 'Created' if created else 'Already exists'
            self.stdout.write(f'  {status_label}: {role.name}')

            # Assign permissions
            for resource, action in role_data['permissions']:
                perm = Permission.objects.filter(
                    resource=resource, action=action
                ).first()
                if perm:
                    role.permissions.add(perm)

            if role_data['permissions']:
                self.stdout.write(
                    f'    → {len(role_data["permissions"])} permissions assigned'
                )

        self.stdout.write(self.style.SUCCESS('\nRBAC seeding completed!'))