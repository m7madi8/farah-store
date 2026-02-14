from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenBlacklistView, TokenObtainPairView, TokenRefreshView

from .throttling import AuthRateThrottle
from .views import (
    AddressViewSet,
    LoginView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
)

app_name = "accounts"


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["email"] = self.fields.pop("username")


class ThrottledTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = [AuthRateThrottle]


router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("", include(router.urls)),
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("password-reset/request/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("jwt/token/", ThrottledTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("jwt/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("jwt/blacklist/", TokenBlacklistView.as_view(), name="token-blacklist"),
]
