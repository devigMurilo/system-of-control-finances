from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AccountViewSet, TransactionViewSet, create_connect_token, dashboard, pluggy_webhook

router = DefaultRouter()
router.register("accounts", AccountViewSet, basename="account")
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    path("connect-token/", create_connect_token, name="connect-token"),
    path("dashboard/", dashboard, name="dashboard"),
    path("webhooks/pluggy/", pluggy_webhook, name="pluggy-webhook"),
    path("", include(router.urls)),
]
