from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from config.admin import admin_site

from .models import Address, User


class UserAdmin(BaseUserAdmin):
    model = User
    ordering = ("-created_at",)
    list_display = ("email", "full_name", "role", "is_active", "is_staff", "created_at")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "full_name", "phone")
    readonly_fields = ("created_at", "updated_at", "last_login_at", "email_verified_at")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("full_name", "phone", "preferred_lang", "role")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login_at", "email_verified_at", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "phone", "preferred_lang", "role", "password1", "password2"),
            },
        ),
    )


class AddressAdminConfig(admin.ModelAdmin):
    model = Address
    list_display = ("full_name", "phone", "city", "country", "is_default", "user")
    list_filter = ("country", "city", "is_default")
    search_fields = ("full_name", "phone", "line1", "city")
    ordering = ("-is_default", "-created_at")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "user",
                    "label",
                    "full_name",
                    "phone",
                    "line1",
                    "line2",
                    "city",
                    "state_region",
                    "postal_code",
                    "country",
                    "is_default",
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )


admin_site.register(User, UserAdmin)
admin_site.register(Address, AddressAdminConfig)
