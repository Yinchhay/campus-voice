import os

from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from api.models import AdminRole, UserRole
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create an admin user and assign the Admin role'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email address')
        parser.add_argument('--password', type=str, help='Admin password')
        parser.add_argument('--username', type=str, help='Admin username')
        parser.add_argument('--first-name', type=str, default='Super', help='First name')
        parser.add_argument('--last-name', type=str, default='Admin', help='Last name')

    def handle(self, *args, **options):
        email = options['email'] or os.environ.get('ADMIN_EMAIL')
        password = options['password'] or os.environ.get('ADMIN_PASSWORD')
        username = options['username'] or os.environ.get('ADMIN_USERNAME', 'admin')
        first_name = options['first_name']
        last_name = options['last_name']

        if not email:
            self.stderr.write(self.style.ERROR(
                'Email is required. Use --email or set ADMIN_EMAIL env variable.'
            ))
            return

        if not password:
            self.stderr.write(self.style.ERROR(
                'Password is required. Use --password or set ADMIN_PASSWORD env variable.'
            ))
            return

        # ── Create user ───────────────────────────────────────────────────────
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'password': make_password(password),
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_active': True,
            },
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {email}'))
        else:
            self.stdout.write(f'Already exists: {email}')

        # ── Assign Admin role ─────────────────────────────────────────────────
        admin_role = AdminRole.objects.filter(name='Admin').first()
        if not admin_role:
            self.stderr.write(self.style.WARNING(
                'Admin role not found. Run "python manage.py seed_rbac" first.'
            ))
            return

        _, assigned = UserRole.objects.get_or_create(
            user=user,
            role=admin_role,
        )

        if assigned:
            self.stdout.write(self.style.SUCCESS('Assigned Admin role'))

        self.stdout.write(self.style.SUCCESS('Done!'))
