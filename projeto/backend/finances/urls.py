from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AccountViewSet, TransactionViewSet, dashboard

router = DefaultRouter()
router.register("accounts", AccountViewSet, basename="account")
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    path("dashboard/", dashboard, name="dashboard"),
    path("", include(router.urls)),
]
