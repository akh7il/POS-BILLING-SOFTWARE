from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import SaleReturn
from .serializers import SaleReturnSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def return_list(request):

    if request.method == 'GET':
        returns = SaleReturn.objects.select_related(
            'sale', 'staff'
        ).prefetch_related('items').all()
        serializer = SaleReturnSerializer(returns, many=True)
        return Response(serializer.data)

    serializer = SaleReturnSerializer(
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():
        record = serializer.save()
        return Response(
            SaleReturnSerializer(record).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def returns_for_sale(request, invoice_no):

    from apps.sales.models import Sale, SaleItem
    from .models import SaleReturnItem

    try:
        sale = Sale.objects.get(invoice_no=invoice_no)
    except Sale.DoesNotExist:
        return Response(
            {'error': f'No sale found with invoice "{invoice_no}"'},
            status=status.HTTP_404_NOT_FOUND
        )

    items_data = []
    for item in sale.items.all():
        returned = SaleReturnItem.objects.filter(
            sale_item=item
        ).values_list('quantity', flat=True)

        returned_qty = sum(returned) if returned else 0
        remaining = item.quantity - returned_qty

        items_data.append({
            'id': item.id,
            'barcode': item.barcode,
            'name': item.name,
            'quantity': item.quantity,
            'returned': returned_qty,
            'remaining': remaining,
            'mrp': str(item.mrp),
            'payable': str(item.payable),
        })

    return Response({
        'id': sale.id,
        'invoice_no': sale.invoice_no,
        'created_at': sale.created_at,
        'staff_name': sale.staff.username,
        'customer_phone': sale.customer_phone,
        'customer_email': sale.customer_email,
        'customer_address': sale.customer_address,
        'payment_type': sale.payment_type,
        'total_payable': str(sale.total_payable),
        'items': items_data,
    })