from decimal import Decimal

from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Account, Transaction
from .serializers import AccountSerializer, DashboardSerializer, TransactionSerializer


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
