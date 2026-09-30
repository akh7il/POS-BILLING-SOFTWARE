from django.urls import path
from .views import sale_list, sale_detail, dashboard_summary


urlpatterns = [
    path('', sale_list, name='sale-list'),
    path('dashboard/summary/', dashboard_summary, name='dashboard-summary'),
    path('<int:sale_id>/', sale_detail, name='sale-detail'),
]