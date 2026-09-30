from django.urls import path
from .views import category_list, category_detail


urlpatterns = [
    path('', category_list, name='category-list'),
    path('<int:category_id>/', category_detail, name='category-detail'),
]