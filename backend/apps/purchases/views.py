from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Purchase
from .serializers import PurchaseSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def purchase_list(request):

    if request.method == 'GET':
        purchases = Purchase.objects.select_related(
            'supplier', 'staff'
        ).prefetch_related('items').all()
        serializer = PurchaseSerializer(purchases, many=True)
        return Response(serializer.data)

    serializer = PurchaseSerializer(
        data=request.data,
        context={'request': request}
    )

    if serializer.is_valid():
        purchase = serializer.save()
        return Response(
            PurchaseSerializer(purchase).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def purchase_detail(request, purchase_id):

    try:
        purchase = Purchase.objects.select_related(
            'supplier', 'staff'
        ).prefetch_related('items').get(id=purchase_id)
    except Purchase.DoesNotExist:
        return Response(
            {'error': 'Purchase not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'DELETE':
        purchase.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = PurchaseSerializer(purchase)
    return Response(serializer.data)