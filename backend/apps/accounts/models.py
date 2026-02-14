from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.SUPER_ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("role") != User.Role.SUPER_ADMIN:
            raise ValueError("Superuser must have role=super_admin.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        STAFF = "staff", "Staff"
        ADMIN = "admin", "Admin"
        SUPER_ADMIN = "super_admin", "Super Admin"

    class PreferredLanguage(models.TextChoices):
        EN = "en", "English"
        AR = "ar", "Arabic"

    email = models.EmailField(unique=True, max_length=255, db_index=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True)
    preferred_lang = models.CharField(
        max_length=2,
        choices=PreferredLanguage.choices,
        default=PreferredLanguage.EN,
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER, db_index=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["role", "is_active"], name="acc_user_role_act_idx"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["email"], name="accounts_user_email_unique"),
        ]

    def __str__(self):
        return str(self.email)


class Address(models.Model):
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="addresses",
    )
    label = models.CharField(max_length=100, blank=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state_region = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=2, default="IL")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        indexes = [
            models.Index(fields=["user", "is_default"], name="acc_addr_user_def_idx"),
            models.Index(fields=["city", "country"], name="acc_addr_city_cty_idx"),
        ]

    def __str__(self):
        return f"{self.full_name} - {self.line1}, {self.city}"
