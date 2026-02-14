from apps.products.models import Product
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class ProductsApiTests(APITestCase):
    def test_products_list(self):
        Product.objects.create(slug="p1", name_en="P1", price="10.00")
        url = reverse("products:product-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
