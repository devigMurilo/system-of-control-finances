from django.urls import path

from .views import (
    ConsultarExtratoOpenFinanceView,
    CriarExtratoOpenFinanceView,
    CriarPagadorView,
    GerarConnectTokenView,
    PluggyWebhookView,
)

urlpatterns = [
    path(
        "pluggy/connect-token/",
        GerarConnectTokenView.as_view(),
        name="pluggy-connect-token",
    ),
    path(
        "pluggy/webhook/",
        PluggyWebhookView.as_view(),
        name="pluggy-webhook",
    ),
    path(
        "pagadores/",
        CriarPagadorView.as_view(),
        name="openfinance-criar-pagador",
    ),
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
