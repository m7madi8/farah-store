"""
Chef Farah Ammar — URL configuration.
API under /api/: auth, products, orders (incl. cart, checkout, webhook, coupon).
Admin: custom dashboard at /admin/ (admin/super_admin only).
"""
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from config.admin import admin_site

urlpatterns = [
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
    path('favicon.ico', RedirectView.as_view(url='/static/img/logo.webp', permanent=True)),
    path('admin/', admin_site.urls),
    path('api/accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('api/products/', include('apps.products.urls', namespace='products')),
    path('api/orders/', include('apps.orders.urls', namespace='orders')),
]

# Serve static assets for this project setup.
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
urlpatterns += staticfiles_urlpatterns()
