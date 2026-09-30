from django.urls import path
from .views import supplier_list, supplier_detail


urlpatterns = [
    path('', supplier_list, name='supplier-list'),
    path('<int:supplier_id>/', supplier_detail, name='supplier-detail'),
]