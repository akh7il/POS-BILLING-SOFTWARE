from decimal import Decimal

from django.utils import timezone
from django.db.models import Sum

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Sale
from .serializers import SaleSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def sale_list(request):

    if request.method == 'GET':
        sales = Sale.objects.select_related('staff').prefetch_related(
            'items'
        ).all()
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)

    serializer = SaleSerializer(
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():
        sale = serializer.save()
        return Response(
            SaleSerializer(sale).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def sale_detail(request, sale_id):

    try:
        sale = Sale.objects.select_related('staff').prefetch_related(
            'items'
        ).get(id=sale_id)
    except Sale.DoesNotExist:
        return Response(
            {'error': 'Sale not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'DELETE':
        sale.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = SaleSerializer(sale)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):

    from apps.products.models import Product
    from apps.returns.models import SaleReturn
    from .models import SaleItem

    today = timezone.localdate()

    todays_sales = Sale.objects.filter(created_at__date=today)
    todays_returns = SaleReturn.objects.filter(created_at__date=today)

    today_sales_count = todays_sales.count()
    today_transactions = today_sales_count

    today_sold_products = SaleItem.objects.filter(
        sale__created_at__date=today
    ).aggregate(
        total=Sum('quantity')
    )['total'] or 0

    today_cash = todays_sales.filter(
        payment_type='CASH'
    ).aggregate(
        total=Sum('total_payable')
    )['total'] or Decimal('0')

    today_upi = todays_sales.filter(
        payment_type='UPI'
    ).aggregate(
        total=Sum('total_payable')
    )['total'] or Decimal('0')

    today_returns_count = todays_returns.count()

    today_refund = todays_returns.aggregate(
        total=Sum('refund_amount')
    )['total'] or Decimal('0')

    recent_sales = Sale.objects.select_related('staff').order_by('-id')[:5]

    recent_data = []
    for sale in recent_sales:
        recent_data.append({
            'id': sale.id,
            'invoice_no': sale.invoice_no,
            'created_at': sale.created_at,
            'customer_phone': sale.customer_phone,
            'total_payable': str(sale.total_payable),
            'payment_type': sale.payment_type,
            'status': 'paid',
        })

    low_stock_products = Product.objects.select_related(
        'category'
    ).filter(stock__lt=10).order_by('stock')[:10]

    low_stock_data = []
    for product in low_stock_products:
        low_stock_data.append({
            'id': product.id,
            'barcode': product.barcode,
            'name': product.name,
            'category_name': product.category.name,
            'stock': product.stock,
        })

    return Response({
        'today_sales_count': today_sales_count,
        'today_transactions': today_transactions,
        'today_sold_products': today_sold_products,
        'today_cash': str(today_cash),
        'today_upi': str(today_upi),
        'today_returns_count': today_returns_count,
        'today_refund': str(today_refund),
        'recent_sales': recent_data,
        'low_stock_products': low_stock_data,
    })