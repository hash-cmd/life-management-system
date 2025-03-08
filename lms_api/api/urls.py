from django.urls import path
from .views import (
    LogoutView,
    NotificationView,
    ProfileSettingsView,
    ProjectDetailView,
    RegisterView,
    LoginView,
    ProjectCreateView,
    ProjectListView,
    ProjectUpdateView,
    RewardView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileSettingsView.as_view(), name='user-profile'),
    path('projects/', ProjectListView.as_view(), name='project-list'),
    path('projects/create/', ProjectCreateView.as_view(), name='project-create'),
    path('projects/update/<int:project_id>/', ProjectUpdateView.as_view(), name='project-update'),
    path('projects/<int:project_id>/', ProjectDetailView.as_view(), name='project-detail'),  # Use retrieve method
    path('projects/delete/<int:project_id>/', ProjectListView.as_view(), name='project-delete'),
    path('notifications/', NotificationView.as_view(), name='notifications'),
    path('reward/', RewardView.as_view(), name='user-points')
]