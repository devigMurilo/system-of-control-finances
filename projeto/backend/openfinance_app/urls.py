from django.urls import path

from .views import ConsultarExtratoOpenFinanceView, CriarExtratoOpenFinanceView

urlpatterns = [
    path(
        "extratos/",
        CriarExtratoOpenFinanceView.as_view(),
        name="openfinance-criar-extrato",
    ),
    path(
        "extratos/<str:unique_id>/",
        ConsultarExtratoOpenFinanceView.as_view(),
        name="openfinance-consultar-extrato",
    ),
]
