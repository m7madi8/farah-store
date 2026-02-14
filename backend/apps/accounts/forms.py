from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.password_validation import validate_password

from .models import Address

User = get_user_model()


class RegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    password_confirm = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ("email", "full_name", "phone", "preferred_lang", "password", "password_confirm")

    def clean(self):
        cleaned = super().clean()
        password = cleaned.get("password")
        password_confirm = cleaned.get("password_confirm")
        if password != password_confirm:
            raise forms.ValidationError("Passwords do not match.")
        if password:
            validate_password(password)
        return cleaned


class EmailAuthenticationForm(AuthenticationForm):
    username = forms.EmailField(label="Email")


class AddressForm(forms.ModelForm):
    class Meta:
        model = Address
        fields = (
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
        )
