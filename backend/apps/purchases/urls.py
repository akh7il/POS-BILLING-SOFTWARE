from django.urls import path
from .views import purchase_list, purchase_detail


urlpatterns = [
    path('', purchase_list, name='purchase-list'),
    path('<int:purchase_id>/', purchase_detail, name='purchase-detail'),
]