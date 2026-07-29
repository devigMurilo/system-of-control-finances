from rest_framework import serializers


class AccountInputSerializer(serializers.Serializer):
    """
    Objeto de conta enviado dentro de 'accounts' no cadastro do pagador.

    accountHash: se a conta ja foi autorizada via Open Finance (ex: fluxo
    Pluggy exibido no frontend), o hash gerado nessa autorizacao e
    informado aqui para vincular a conta ao pagador.

    Os demais campos (agencia, numero da conta, DAC etc.) sao dados
    bancarios tradicionais — usados sobretudo quando a conta tambem
    participa de outros produtos TecnoSpeed (ex: pagamentos/remessa).
    """

    bank_code = serializers.CharField(max_length=10, required=False, allow_blank=True)
    account_hash = serializers.CharField(max_length=255, required=False, allow_blank=True)
    agency = serializers.CharField(max_length=20, required=False, allow_blank=True)
    agency_digit = serializers.CharField(max_length=5, required=False, allow_blank=True)
    account_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    account_number_digit = serializers.CharField(max_length=5, required=False, allow_blank=True)
    account_dac = serializers.CharField(max_length=5, required=False, allow_blank=True)
    convenio_agency = serializers.CharField(max_length=30, required=False, allow_blank=True)
    convenio_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    remessa_sequential = serializers.IntegerField(required=False, default=0)
    account_type = serializers.IntegerField(
        required=False,
        default=0,
        help_text="Tipo da conta (enum numerico definido pela TecnoSpeed; confirmar valores na doc).",
    )

    FIELD_MAP = {
        "bank_code": "bankCode",
        "account_hash": "accountHash",
        "agency": "agency",
        "agency_digit": "agencyDigit",
        "account_number": "accountNumber",
        "account_number_digit": "accountNumberDigit",
        "account_dac": "accountDac",
        "convenio_agency": "convenioAgency",
        "convenio_number": "convenioNumber",
        "remessa_sequential": "remessaSequential",
        "account_type": "accountType",
    }

    @classmethod
    def account_data_to_payload(cls, data: dict) -> dict:
        """Converte um dict de conta ja validado (snake_case) para camelCase."""
        payload = {}
        for snake_key, camel_key in cls.FIELD_MAP.items():
            if data.get(snake_key) not in (None, ""):
                payload[camel_key] = data[snake_key]
        return payload


class CriarPagadorSerializer(serializers.Serializer):
    """
    Valida o corpo enviado para POST /api/v1/payer.

    Schema confirmado na doc oficial (createPayer). 'accounts' e uma lista
    de AccountInputSerializer — pode ser enviada vazia ('[]') se as contas
    forem cadastradas depois, em outra chamada.
    """

    name = serializers.CharField(max_length=250, help_text="Nome ou Razao Social do pagador.")
    email = serializers.EmailField(max_length=250, required=False, allow_blank=True)
    cpf_cnpj = serializers.CharField(max_length=18, help_text="CPF ou CNPJ do pagador.")
    accounts = AccountInputSerializer(many=True, required=False)
    token = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Campo presente no schema oficial; proposito exato a confirmar com a TecnoSpeed.",
    )
    statement_actived = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Ativa o servico de Extrato Open Finance para este pagador (requer contrato previo).",
    )
    dda_actived = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Ativa o servico de DDA para este pagador (requer contrato previo).",
    )
    street = serializers.CharField(max_length=250, required=False, allow_blank=True)
    neighborhood = serializers.CharField(max_length=250, help_text="Bairro do pagador.")
    address_number = serializers.CharField(max_length=10, required=False, allow_blank=True)
    address_complement = serializers.CharField(max_length=250, required=False, allow_blank=True)
    city = serializers.CharField(max_length=250)
    state = serializers.CharField(max_length=2, help_text="UF, ex: SP, RJ, PR.")
    zipcode = serializers.CharField(max_length=10)

    def to_tecnospeed_payload(self) -> dict:
        """Converte os dados validados (snake_case) para o formato camelCase da API."""
        data = self.validated_data
        payload = {
            "name": data["name"],
            "cpfCnpj": data["cpf_cnpj"],
            "neighborhood": data["neighborhood"],
            "city": data["city"],
            "state": data["state"],
            "zipcode": data["zipcode"],
        }
        if data.get("email"):
            payload["email"] = data["email"]

        if "accounts" in data:
            payload["accounts"] = [
                AccountInputSerializer.account_data_to_payload(account_data)
                for account_data in data["accounts"]
            ]

        if data.get("token"):
            payload["token"] = data["token"]
        if "statement_actived" in data:
            payload["statementActived"] = data["statement_actived"]
        if "dda_actived" in data:
            payload["ddaActived"] = data["dda_actived"]
        if data.get("street"):
            payload["street"] = data["street"]
        if data.get("address_number"):
            payload["addressNumber"] = data["address_number"]
        if data.get("address_complement"):
            payload["addressComplement"] = data["address_complement"]
        return payload


class GerarConnectTokenSerializer(serializers.Serializer):
    """Valida o corpo enviado para POST /openfinance/pluggy/connect-token/."""

    payer_cpf_cnpj = serializers.CharField(
        max_length=18,
        help_text="CPF/CNPJ do pagador, usado como clientUserId na Pluggy.",
    )


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
