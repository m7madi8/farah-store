from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AccountsApiTests(APITestCase):
    def test_register_user(self):
        url = reverse("accounts:register")
        payload = {
            "email": "user1@example.com",
            "password": "StrongPass123!",
            "full_name": "User One",
            "phone": "0500000000",
            "preferred_lang": "en",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
