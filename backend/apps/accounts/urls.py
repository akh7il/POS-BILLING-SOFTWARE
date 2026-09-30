from django.urls import path
from .views import login, staff_list, staff_detail


urlpatterns = [
    path('login/', login, name='login'),
    path('staff/', staff_list, name='staff-list'),
    path('staff/<int:staff_id>/', staff_detail, name='staff-detail'),
]