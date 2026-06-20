from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.permissions import HasResourcePermission
from django.contrib.auth import get_user_model
from django.core.cache import cache
from api.models import Ticket

User = get_user_model()


class AdminDashboardView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [HasResourcePermission]
    resource = 'ticket'

    def get(self, request):
        cache_key = "admin_dashboard_stats"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        # 1. Current queue stats
        open_cases_count = Ticket.objects.filter(
            status__in=[Ticket.Status.SUBMITTED, Ticket.Status.IN_PROGRESS]
        ).count()

        high_priority_open_count = Ticket.objects.filter(
            status__in=[Ticket.Status.SUBMITTED, Ticket.Status.IN_PROGRESS],
            priority=Ticket.Priority.HIGH
        ).count()

        staff_admin_count = User.objects.filter(
            role__in=[User.Role.STAFF, User.Role.ADMIN],
            is_active=True
        ).count()

        # 2. Overview breakdown
        in_progress_count = Ticket.objects.filter(
            status=Ticket.Status.IN_PROGRESS
        ).count()

        # 3. Pipeline breakdown
        pipeline_submitted = Ticket.objects.filter(
            status=Ticket.Status.SUBMITTED
        ).count()

        pipeline_resolved = Ticket.objects.filter(
            status=Ticket.Status.RESOLVED
        ).count()

        data = {
            "current_queue": {
                "open_cases": open_cases_count,
                "high_priority": high_priority_open_count,
                "staff_admin_users": staff_admin_count
            },
            "overview": {
                "submitted": open_cases_count,  # "Submitted" in overview refers to open cases waiting for a final resolution
                "in_progress": in_progress_count,
                "high_priority": high_priority_open_count
            },
            "pipeline": {
                "submitted": pipeline_submitted,
                "in_progress": in_progress_count,
                "resolved": pipeline_resolved
            }
        }

        # Cache response for 30 seconds to prevent query spamming
        cache.set(cache_key, data, timeout=30)
        return Response(data, status=status.HTTP_200_OK)
