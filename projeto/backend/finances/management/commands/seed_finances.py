from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand

from finances.models import Account, Transaction


class Command(BaseCommand):
    help = "Cria dados financeiros de exemplo."

    def handle(self, *args, **options):
        Transaction.objects.all().delete()
        Account.objects.all().delete()

        corrente = Account.objects.create(
            name="Conta Principal",
            institution="Banco Demo",
            account_type=Account.CHECKING,
            balance=Decimal("4280.75"),
        )
        credito = Account.objects.create(
            name="Cartao Platinum",
            institution="Banco Demo",
            account_type=Account.CREDIT,
            balance=Decimal("-1240.20"),
        )
        reserva = Account.objects.create(
            name="Reserva",
            institution="Investimentos Demo",
            account_type=Account.INVESTMENT,
            balance=Decimal("15250.00"),
        )

        today = date.today()
        samples = [
            (corrente, "Salario", "Receita", Transaction.INCOME, "6800.00", today - timedelta(days=3)),
            (corrente, "Aluguel", "Moradia", Transaction.EXPENSE, "1850.00", today - timedelta(days=2)),
            (credito, "Mercado", "Alimentacao", Transaction.EXPENSE, "436.45", today - timedelta(days=1)),
            (credito, "Farmacia", "Saude", Transaction.EXPENSE, "89.90", today - timedelta(days=5)),
            (corrente, "Pix recebido", "Transferencias", Transaction.INCOME, "320.00", today - timedelta(days=7)),
            (reserva, "Aporte mensal", "Investimentos", Transaction.INCOME, "900.00", today - timedelta(days=10)),
        ]

        for account, description, category, tx_type, amount, tx_date in samples:
            Transaction.objects.create(
                account=account,
                description=description,
                category=category,
                transaction_type=tx_type,
                amount=Decimal(amount),
                date=tx_date,
            )

        self.stdout.write(self.style.SUCCESS("Dados de exemplo criados."))
