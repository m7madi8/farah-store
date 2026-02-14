import logging

from rest_framework import mixins, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address
from .permissions import IsOwnerOrAdminRole
from .serializers import (
    AddressSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegistrationSerializer,
    UserSerializer,
)
from .services import build_password_reset_token, login_user, register_user, reset_password
from .throttling import AuthRateThrottle

logger = logging.getLogger("security")


def _token_payload(user):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = register_user(serializer.validated_data)
        return Response(
            {"user": UserSerializer(user).data, "tokens": _token_payload(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = login_user(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        return Response({"user": UserSerializer(user).data, "tokens": _token_payload(user)})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_data = build_password_reset_token(serializer.validated_data["email"])
        if token_data:
            logger.info("Password reset token generated for uid=%s", token_data["uid"])
        return Response({"detail": "If the account exists, reset instructions were generated."})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_password(
            uid=serializer.validated_data["uid"],
            token=serializer.validated_data["token"],
            new_password=serializer.validated_data["password"],
        )
        return Response({"detail": "Password reset successful."})


class AddressViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdminRole]

    def get_queryset(self):
        user = self.request.user
        if user.role in ("admin", "super_admin"):
            return Address.objects.all()
        return Address.objects.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
