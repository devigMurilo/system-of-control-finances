from django.db import models


class Account(models.Model):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    INVESTMENT = "investment"

    ACCOUNT_TYPES = [
        (CHECKING, "Conta corrente"),
        (SAVINGS, "Poupanca"),
        (CREDIT, "Cartao de credito"),
        (INVESTMENT, "Investimento"),
    ]

    name = models.CharField(max_length=120)
    institution = models.CharField(max_length=120)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default=CHECKING)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["institution", "name"]

    def __str__(self):
        return f"{self.institution} - {self.name}"


class Transaction(models.Model):
    INCOME = "income"
    EXPENSE = "expense"

    TRANSACTION_TYPES = [
        (INCOME, "Receita"),
        (EXPENSE, "Despesa"),
    ]

    account = models.ForeignKey(Account, related_name="transactions", on_delete=models.CASCADE)
    description = models.CharField(max_length=180)
    category = models.CharField(max_length=80, blank=True)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-id"]

    def __str__(self):
        return f"{self.description} ({self.amount})"
