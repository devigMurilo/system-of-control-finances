from rest_framework import serializers


class CriarExtratoOpenFinanceSerializer(serializers.Serializer):
    """Valida o corpo enviado para POST /api/v1/statement/openfinance."""

    account_hash = serializers.CharField(
        max_length=255,
        help_text="AccountHash da conta cadastrada, pertencente ao CNPJ do pagador.",
    )
    date_start = serializers.DateField(
        required=False,
        help_text="Data de inicio da busca (ex: 2025-01-30).",
    )
    date_end = serializers.DateField(
        required=False,
        help_text="Data de fim da busca (ex: 2025-01-30).",
    )
    today = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Se True, retorna somente as movimentacoes do dia atual.",
    )

    def validate(self, attrs):
        if not attrs.get("today") and not (attrs.get("date_start") and attrs.get("date_end")):
            raise serializers.ValidationError(
                "Informe 'today=true' ou o par 'date_start' e 'date_end'."
            )
        return attrs


class ConsultarExtratoOpenFinanceSerializer(serializers.Serializer):
    """Valida o parametro de URL para GET /api/v1/statement/openfinance/{uniqueId}."""

    unique_id = serializers.CharField(max_length=255)
