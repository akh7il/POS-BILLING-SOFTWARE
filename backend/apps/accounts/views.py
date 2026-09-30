from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import User
from .serializers import LoginSerializer, StaffSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def staff_list(request):

    if request.user.role != User.Role.ADMIN:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'GET':
        users = User.objects.all().order_by('-id')
        serializer = StaffSerializer(users, many=True)
        return Response(serializer.data)

    serializer = StaffSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        return Response(
            StaffSerializer(user).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def staff_detail(request, staff_id):

    if request.user.role != User.Role.ADMIN:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(id=staff_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'DELETE':
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = StaffSerializer(
        user,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        user = serializer.save()
        return Response(StaffSerializer(user).data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )