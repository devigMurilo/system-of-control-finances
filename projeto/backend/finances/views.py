from decimal import Decimal
import logging
import os

from django.db.models import Sum
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Account, Transaction
from .serializers import AccountSerializer, DashboardSerializer, TransactionSerializer

logger = logging.getLogger(__name__)


def handle_item_created(item_id):
    logger.info("Pluggy item created: %s", item_id)


def handle_item_updated(item_id):
    logger.info("Pluggy item updated: %s", item_id)


def handle_item_error(item_id, error):
    logger.warning("Pluggy item error: %s - %s", item_id, error)


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        queryset = Transaction.objects.select_related("account")
        account_id = self.request.query_params.get("account")
        transaction_type = self.request.query_params.get("type")

        if account_id:
            queryset = queryset.filter(account_id=account_id)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)

        return queryset


@api_view(["GET"])
def dashboard(request):
    total_balance = Account.objects.aggregate(total=Sum("balance"))["total"] or Decimal("0")
    total_income = (
        Transaction.objects.filter(transaction_type=Transaction.INCOME).aggregate(total=Sum("amount"))[
            "total"
        ]
        or Decimal("0")
    )
    total_expenses = (
        Transaction.objects.filter(transaction_type=Transaction.EXPENSE).aggregate(total=Sum("amount"))[
            "total"
        ]
        or Decimal("0")
    )
    expenses_by_category = list(
        Transaction.objects.filter(transaction_type=Transaction.EXPENSE)
        .values("category")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )

    serializer = DashboardSerializer(
        {
            "total_balance": total_balance,
            "total_income": total_income,
            "total_expenses": total_expenses,
            "account_count": Account.objects.count(),
            "transaction_count": Transaction.objects.count(),
        }
    )
    data = serializer.data
    data["expenses_by_category"] = [
        {
            "category": item["category"] or "Sem categoria",
            "total": item["total"],
        }
        for item in expenses_by_category
    ]
    return Response(data)


@api_view(["POST"])
def create_connect_token(request):
    client_id = os.getenv("CLIENT_ID") or os.getenv("PLUGGY_CLIENT_ID")
    client_secret = os.getenv("CLIENT_SECRET") or os.getenv("PLUGGY_CLIENT_SECRET")

    if not client_id or not client_secret:
        return Response(
            {"detail": "Credenciais da Pluggy nao configuradas."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        from pluggy_sdk import ApiClient, AuthApi, AuthRequest, Configuration, ConnectTokenRequest
    except ImportError:
        return Response(
            {"detail": "SDK da Pluggy nao instalado."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    try:
        auth_api = AuthApi()
        auth_response = auth_api.auth_create(
            AuthRequest.model_validate(
                {
                    "clientId": client_id,
                    "clientSecret": client_secret,
                }
            )
        )

        configuration = Configuration()
        configuration.api_key["default"] = auth_response.api_key

        with ApiClient(configuration) as api_client:
            connect_token = AuthApi(api_client).connect_token_create(ConnectTokenRequest())
    except Exception as exc:
        logger.exception("Could not create Pluggy Connect Token")
        return Response(
            {"detail": "Nao foi possivel criar o Connect Token."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({"accessToken": connect_token.access_token})


@api_view(["POST"])
def pluggy_webhook(request):
    event = request.data
    event_name = event.get("event")
    event_id = event.get("eventId")
    item_id = event.get("itemId")

    logger.info("Received Pluggy webhook: %s", event_name)
    logger.info("Pluggy webhook event ID: %s", event_id)

    if event_name == "item/created":
        handle_item_created(item_id)
    elif event_name == "item/updated":
        handle_item_updated(item_id)
    elif event_name == "item/error":
        handle_item_error(item_id, event.get("error"))
    else:
        logger.info("Unhandled Pluggy webhook event: %s", event_name)

    return Response({"received": True})
