from django.core.management.base import BaseCommand
from api.models import Category


class Command(BaseCommand):
    help = 'Seed categories for the application'

    def handle(self, *args, **options):
        # Service Issues
        SERVICE_CATEGORIES = [
            {'name': 'Counseling', 'priority': 'MEDIUM'},
            {'name': 'Dormitory', 'priority': 'MEDIUM'},
            {'name': 'Electricity', 'priority': 'HIGH'},
            {'name': 'Study Hours', 'priority': 'MEDIUM'},
            {'name': 'Classroom facilities', 'priority': 'HIGH'},
            {'name': 'Orderliness', 'priority': 'LOW'},
            {'name': 'Transportation', 'priority': 'MEDIUM'},
            {'name': 'School Documents', 'priority': 'HIGH'},
            {'name': 'Parking', 'priority': 'LOW'},
            {'name': 'Field Trips', 'priority': 'MEDIUM'},
            {'name': 'Restroom', 'priority': 'MEDIUM'},
            {'name': 'Canteen', 'priority': 'LOW'},
            {'name': 'Hygiene', 'priority': 'MEDIUM'},
            {'name': 'Internet Services', 'priority': 'HIGH'},
            {'name': 'Safety measures', 'priority': 'HIGH'},
            {'name': 'Security', 'priority': 'HIGH'},
            {'name': 'Other', 'priority': 'LOW'},
        ]

        # Academic Issues
        ACADEMIC_CATEGORIES = [
            {'name': 'Classroom environment', 'priority': 'MEDIUM'},
            {'name': 'Curriculum', 'priority': 'HIGH'},
            {'name': 'Class schedule', 'priority': 'MEDIUM'},
            {'name': 'Laboratories/Practice Sites', 'priority': 'HIGH'},
            {'name': 'Teaching Facilities', 'priority': 'HIGH'},
            {'name': 'Instructors', 'priority': 'MEDIUM'},
            {'name': "Instructor's pedagogy", 'priority': 'MEDIUM'},
            {'name': "Instructor's Attitude", 'priority': 'MEDIUM'},
            {'name': 'Academic results', 'priority': 'HIGH'},
            {'name': 'Other', 'priority': 'LOW'},
        ]

        # Seed Service Categories
        for cat in SERVICE_CATEGORIES:
            Category.objects.update_or_create(
                name=cat['name'],
                defaults={
                    'description': f"Service issue: {cat['name']}",
                    'issue_type': Category.IssueType.SERVICE,
                    'priority_level': cat['priority'],
                    'is_active': True,
                }
            )

        # Seed Academic Categories
        for cat in ACADEMIC_CATEGORIES:
            Category.objects.update_or_create(
                name=cat['name'],
                defaults={
                    'description': f"Academic issue: {cat['name']}",
                    'issue_type': Category.IssueType.ACADEMIC,
                    'priority_level': cat['priority'],
                    'is_active': True,
                }
            )

        self.stdout.write(self.style.SUCCESS('✅ Categories seeded successfully!'))