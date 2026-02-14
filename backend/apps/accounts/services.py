import logging

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.cache import cache
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.exceptions import AuthenticationFailed, ValidationError

User = get_user_model()
logger = logging.getLogger("security")

LOCKOUT_CACHE_PREFIX = "login_fail:"
MAX_ATTEMPTS = getattr(settings, "LOGIN_FAILED_MAX_ATTEMPTS", 5)
LOCKOUT_DURATION = getattr(settings, "LOGIN_LOCKOUT_DURATION", 900)


def get_client_identifier(request):
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _lockout_key(email, client_id):
    return f"{LOCKOUT_CACHE_PREFIX}{email}:{client_id}"


def register_user(validated_data):
    password = validated_data.pop("password")
    validated_data.setdefault("role", User.Role.CUSTOMER)
    return User.objects.create_user(password=password, **validated_data)


def login_user(request, email, password):
    email = email.strip().lower()
    client_id = get_client_identifier(request)
    key = _lockout_key(email, client_id)
    attempts = cache.get(key, 0)
    if attempts >= MAX_ATTEMPTS:
        logger.warning("Login locked out: email=%s, ip=%s", email, client_id)
        raise AuthenticationFailed("Too many failed attempts. Try again later.")

    user = authenticate(request, username=email, password=password)
    if not user:
        cache.set(key, attempts + 1, LOCKOUT_DURATION)
        logger.warning("Login failed: email=%s, ip=%s", email, client_id)
        raise AuthenticationFailed("Invalid credentials.")
    if not user.is_active:
        raise AuthenticationFailed("Account is disabled.")

    cache.delete(key)
    return user


def build_password_reset_token(email):
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return None
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return {"uid": uid, "token": token}


def reset_password(uid, token, new_password):
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except Exception as exc:
        raise ValidationError({"detail": "Invalid reset link."}) from exc

    if not default_token_generator.check_token(user, token):
        raise ValidationError({"detail": "Reset token is invalid or expired."})
    user.set_password(new_password)
    user.save(update_fields=["password", "updated_at"])
    return user
