from django.contrib import admin

from .models import Account, Transaction


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ("name", "institution", "account_type", "balance", "updated_at")
    search_fields = ("name", "institution")
    list_filter = ("account_type",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("date", "description", "account", "transaction_type", "amount", "category")
    search_fields = ("description", "category", "account__name", "account__institution")
    list_filter = ("transaction_type", "category", "date")
