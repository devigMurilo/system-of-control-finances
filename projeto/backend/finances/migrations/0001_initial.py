from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Account",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("institution", models.CharField(max_length=120)),
                (
                    "account_type",
                    models.CharField(
                        choices=[
                            ("checking", "Conta corrente"),
                            ("savings", "Poupanca"),
                            ("credit", "Cartao de credito"),
                            ("investment", "Investimento"),
                        ],
                        default="checking",
                        max_length=20,
                    ),
                ),
                ("balance", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["institution", "name"]},
        ),
        migrations.CreateModel(
            name="Transaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("description", models.CharField(max_length=180)),
                ("category", models.CharField(blank=True, max_length=80)),
                (
                    "transaction_type",
                    models.CharField(choices=[("income", "Receita"), ("expense", "Despesa")], max_length=10),
                ),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("date", models.DateField()),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "account",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="transactions",
                        to="finances.account",
                    ),
                ),
            ],
            options={"ordering": ["-date", "-id"]},
        ),
    ]
