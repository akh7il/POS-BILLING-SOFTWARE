from django.urls import path
from .views import return_list, returns_for_sale


urlpatterns = [
    path('', return_list, name='return-list'),
    path('sale/<str:invoice_no>/', returns_for_sale, name='returns-for-sale'),
]