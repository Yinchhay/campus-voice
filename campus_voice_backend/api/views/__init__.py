from .public.health_views import api_health


# Auth
from .public.auth.auth_views import GoogleAuthView
from .public.auth.user_views import GetMeView
from .public.auth.token_views import RefreshTokenView

# Categories
from .public.category_views import CategoryListView

# Tickets
from .public.ticket.ticket_views import TicketListView, TicketDetailView

# Messages
from .public.message.message_views import MessageView

# Resolution
from .public.resolution.resolution_views import ResolutionView


# Admin
from .admin.admin_login_views import AdminLoginView
from .admin.admin_getme_views import AdminGetMeView
from .admin.admin_user_views import AdminUserListView, AdminUserDetailView
from .admin.admin_role_views import AdminRoleListView, AdminRoleDetailView, AdminPermissionListView, AdminUserRoleView, AdminRolePermissionsView
from .admin.admin_category_views import AdminCategoryListView, AdminCategoryDetailView
from .admin.admin_ticket_views import AdminTicketListView, AdminTicketDetailView
from .admin.admin_message_views import AdminMessageView
from .admin.admin_resolution_views import AdminResolutionView


__all__ = [

    # Health Check
    'api_health',
    
    # Public Auth
    'GoogleAuthView', 
    'RefreshTokenView',
    
    # Public User
    'GetMeView',
    
    # Public Category
    'CategoryListView',
    
    # Public Tickets
    'TicketListView',
    'TicketDetailView',
    
    # Public Message
    'MessageView',
    
    # Public Resolution
    'ResolutionView',
    
    
    # Admin
    'AdminLoginView',
    'AdminGetMeView',
    
    # Admin User Management
    'AdminUserListView',
    'AdminUserDetailView',

    # Admin User Role and Permission
    'AdminRoleListView',
    'AdminRoleDetailView',
    'AdminPermissionListView',
    'AdminUserRoleView',
    'AdminRolePermissionsView',
    
    # Admin Category
    'AdminCategoryListView',
    'AdminCategoryDetailView',

    # Admin Ticket
    'AdminTicketListView',
    'AdminTicketDetailView',
    
    # Admin Message
    'AdminMessageView',
    
    # Admin Resolution
    'AdminResolutionView',

]
