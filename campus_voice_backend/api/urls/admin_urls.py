from django.urls import path
from api.views import (
    AdminLoginView, 
    AdminGetMeView,
    AdminChangePasswordView,
    AdminUserListView,
    AdminUserDetailView,
    AdminRoleListView,
    AdminRoleDetailView,
    AdminPermissionListView,
    AdminUserRoleView,
    AdminRolePermissionsView,
    AdminCategoryListView, 
    AdminCategoryDetailView,
    AdminTicketListView,
    AdminTicketDetailView,
    AdminTicketExportView,
    AdminMessageView,
    AdminResolutionView,
    AdminEmailSettingView,
    AdminMeetingSlotListView,
    AdminMeetingSlotDetailView,
    AdminBookingListView,
    AdminMarkMeetingCompleteView,
    GoogleCalendarConnectView,
    GoogleCalendarCallbackView,
    GoogleCalendarStatusView,
    AdminProfanityWordListView, 
    AdminProfanityWordDetailView,
    AdminDashboardView,
)

app_name = 'admin'

urlpatterns = [
    # your admin routes will go here
    # ---------------------------------------------------------------------------- #
    #                               Dashboard                                      #
    # ---------------------------------------------------------------------------- #
    path('dashboard', AdminDashboardView.as_view(), name='admin_dashboard'),

    # ---------------------------------------------------------------------------- #
    #                                Admin Auth                                    #
    # ---------------------------------------------------------------------------- #
    path('login', AdminLoginView.as_view(), name='admin_login'),
    
    path('me', AdminGetMeView.as_view(), name='admin_me'),
    path('change-password', AdminChangePasswordView.as_view(), name='admin_change_password'),
    
    # ---------------------------------------------------------------------------- #
    #                           Admin User Management                              #
    # ---------------------------------------------------------------------------- #
    path('users', AdminUserListView.as_view(), name='admin_user_list'),
    path('users/<str:user_id>', AdminUserDetailView.as_view(), name='admin_user_detail'),

    # ---------------------------------------------------------------------------- #
    #                    Admin Role and Permission Management                      #
    # ---------------------------------------------------------------------------- #
    path('roles', AdminRoleListView.as_view(), name='admin_role_list'),
    path('roles/<int:role_id>', AdminRoleDetailView.as_view(), name='admin_role_detail'),
    path('roles/<int:role_id>/permissions', AdminRolePermissionsView.as_view(), name='admin_role_permissions'),
    path('permissions', AdminPermissionListView.as_view(), name='admin_permission_list'),
    path('users/<str:user_id>/roles', AdminUserRoleView.as_view(), name='admin_user_roles'),
    
    # ---------------------------------------------------------------------------- #
    #                          Admin Category Management                           #
    # ---------------------------------------------------------------------------- #
    path('categories', AdminCategoryListView.as_view(), name='admin_category_list'),
    path('categories/<int:category_id>', AdminCategoryDetailView.as_view(), name='admin_category_detail'),
    
    # ---------------------------------------------------------------------------- #
    #                           Admin Ticket Management                            #
    # ---------------------------------------------------------------------------- #
    path('tickets', AdminTicketListView.as_view(), name='admin_ticket_list'),
    path('tickets/export/excel', AdminTicketExportView.as_view(), name='admin_ticket_export'),
    path('tickets/<str:ticket_id>', AdminTicketDetailView.as_view(), name='admin_ticket_detail'),
    
    # ---------------------------------------------------------------------------- #
    #                          Admin Message Management                            #
    # ---------------------------------------------------------------------------- #
    path('tickets/<str:ticket_id>/messages', AdminMessageView.as_view(), name='admin_message_list'),
    
    # ---------------------------------------------------------------------------- #
    #                        Admin Resolution Management                           #
    # ---------------------------------------------------------------------------- #
    path('tickets/<str:ticket_id>/resolution', AdminResolutionView.as_view(), name='admin_resolution'),
    
    # ---------------------------------------------------------------------------- #
    #                            Meeting Management                                #
    # ---------------------------------------------------------------------------- #
    path('tickets/<str:ticket_id>/meetings', AdminMeetingSlotListView.as_view(), name='admin_meeting_list'),
    path('tickets/<str:ticket_id>/meetings/<int:slot_id>', AdminMeetingSlotDetailView.as_view(), name='admin_meeting_detail'),
    path('bookings', AdminBookingListView.as_view(), name='admin_booking_list'),
    path('tickets/<str:ticket_id>/bookings/<int:booking_id>/complete', AdminMarkMeetingCompleteView.as_view(), name='admin_mark_meeting_complete'),
    
    # ---------------------------------------------------------------------------- #
    #                          Google Calendar Integration                         #
    # ---------------------------------------------------------------------------- #
    path('google-calendar/connect', GoogleCalendarConnectView.as_view(), name='google_calendar_connect'),
    path('google-calendar/callback', GoogleCalendarCallbackView.as_view(), name='google_calendar_callback'),
    path('google-calendar/status', GoogleCalendarStatusView.as_view(), name='google_calendar_status'),

    # ---------------------------------------------------------------------------- #
    #                       Admin Email Setting Management                         #
    # ---------------------------------------------------------------------------- #
    path('settings/email', AdminEmailSettingView.as_view(), name='admin_email_setting'),
    
    path('settings/profanity-words', AdminProfanityWordListView.as_view(), name='admin_profanity_list'),
    path('settings/profanity-words/<int:word_id>', AdminProfanityWordDetailView.as_view(), name='admin_profanity_detail'),
]