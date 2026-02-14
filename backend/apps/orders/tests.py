from apps.products.models import Product
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class OrdersApiTests(APITestCase):
    def test_create_cod_order(self):
        product = Product.objects.create(slug="p2", name_en="P2", price="20.00", stock_quantity=10)
        payload = {
            "customer_name": "Test User",
            "customer_phone": "0500000000",
            "shipping_address": "Street 1, City",
            "payment_method": "cod",
            "items": [{"product": product.id, "quantity": 1}],
        }
        url = reverse("orders:order-list")
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("order", response.data)
