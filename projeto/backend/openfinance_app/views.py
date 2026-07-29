import logging

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

from .pluggy_client import PluggyAPIError, PluggyClient
from .serializers import (
    ConsultarExtratoOpenFinanceSerializer,
    CriarExtratoOpenFinanceSerializer,
    CriarPagadorSerializer,
    GerarConnectTokenSerializer,
)
from .services import (
    TecnoSpeedAPIError,
    TecnoSpeedCredentials,
    TecnoSpeedOpenFinanceClient,
)


def _build_client(payer_cpf_cnpj: str = "") -> TecnoSpeedOpenFinanceClient:
    credentials = TecnoSpeedCredentials(
        cnpjsh=settings.TECNOSPEED_CNPJSH,
        tokensh=settings.TECNOSPEED_TOKENSH,
        payercpfcnpj=payer_cpf_cnpj,
    )
    return TecnoSpeedOpenFinanceClient(credentials)


class GerarConnectTokenView(APIView):
    """
    POST /openfinance/pluggy/connect-token/

    Gera o connectToken que o FRONTEND usa para abrir o Pluggy Connect Widget.
    Nunca exponha CLIENT_ID/CLIENT_SECRET diretamente ao frontend — so o
    connectToken (de curta duracao e escopo limitado) deve trafegar ate la.

    Body esperado:
        {"payer_cpf_cnpj": "01001001000113"}
    """

    permission_classes = []

    def post(self, request):
        serializer = GerarConnectTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payer_cpf_cnpj = serializer.validated_data["payer_cpf_cnpj"]

        client = PluggyClient()
        webhook_url = request.build_absolute_uri("/openfinance/pluggy/webhook/")

        try:
            result = client.criar_connect_token(
                client_user_id=payer_cpf_cnpj,
                webhook_url=webhook_url,
            )
        except PluggyAPIError as exc:
            return Response(
                {"detail": str(exc), "pluggy": exc.payload},
                status=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            )

        return Response(result, status=status.HTTP_200_OK)


class PluggyWebhookView(APIView):
    """
    POST /openfinance/pluggy/webhook/

    Endpoint que recebe os eventos da Pluggy quando uma conexao (item) eh
    criada/atualizada. Eh a forma RECOMENDADA de capturar o itemId (mais
    confiavel do que so o callback onSuccess do frontend, que se perde se
    o usuario fechar a aba).

    Apos capturar o itemId, ele deve ser registrado como 'accountHash' no
    cadastro do pagador na TecnoSpeed (POST /api/v1/payer, accounts[].accountHash)
    — esse passo de vinculo ainda depende de voce confirmar o formato exato
    esperado pela TecnoSpeed (se aceita o itemId da Pluggy diretamente ou
    exige alguma transformacao).
    """

    permission_classes = []
    authentication_classes = []

    def post(self, request):
        event = request.data.get("event")
        item_id = request.data.get("itemId") or request.data.get("item", {}).get("id")

        logger.info("Webhook Pluggy recebido: event=%s item_id=%s", event, item_id)

        if not item_id:
            return Response({"detail": "Payload sem itemId."}, status=status.HTTP_400_BAD_REQUEST)

        # TODO: persistir (event, item_id) no seu banco e/ou disparar a
        # vinculacao do accountHash na TecnoSpeed aqui, de forma assincrona
        # (ex: via Celery), para nao deixar o webhook lento.

        return Response({"received": True}, status=status.HTTP_200_OK)


class CriarPagadorView(APIView):
    """
    POST /openfinance/pagadores/

    Etapa 0 do fluxo: cadastra o pagador (CNPJ/CPF) que futuramente tera
    contas vinculadas e podera solicitar extratos via Open Finance.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CriarPagadorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.to_tecnospeed_payload()

        client = _build_client()

        try:
            result = client.criar_pagador(payload)
        except TecnoSpeedAPIError as exc:
            return Response(
                {"detail": str(exc), "tecnospeed": exc.payload},
                status=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            )

        return Response(result, status=status.HTTP_201_CREATED)


class CriarExtratoOpenFinanceView(APIView):
    """
    POST /openfinance/extratos/

    Etapa 1 do fluxo: solicita o extrato ao Open Finance via TecnoSpeed
    e retorna um protocolo (uniqueId) para consulta posterior.

    Body esperado:
        {
            "account_hash": "abc123",
            "date_start": "2025-01-01",
            "date_end": "2025-01-30",
            "payer_cpf_cnpj": "00000000000191"
        }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        payer_cpf_cnpj = request.data.get("payer_cpf_cnpj")
        if not payer_cpf_cnpj:
            return Response(
                {"detail": "Campo 'payer_cpf_cnpj' e obrigatorio."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CriarExtratoOpenFinanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        client = _build_client(payer_cpf_cnpj)

        try:
            result = client.criar_protocolo(
                account_hash=data["account_hash"],
                date_start=str(data["date_start"]) if data.get("date_start") else None,
                date_end=str(data["date_end"]) if data.get("date_end") else None,
                today=data.get("today"),
            )
        except TecnoSpeedAPIError as exc:
            return Response(
                {"detail": str(exc), "tecnospeed": exc.payload},
                status=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            )

        return Response(result, status=status.HTTP_201_CREATED)


class ConsultarExtratoOpenFinanceView(APIView):
    """
    GET /openfinance/extratos/<str:unique_id>/?payer_cpf_cnpj=00000000000191

    Etapa 2 do fluxo: consulta o resultado do processamento do protocolo
    gerado na etapa 1.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, unique_id: str):
        serializer = ConsultarExtratoOpenFinanceSerializer(data={"unique_id": unique_id})
        serializer.is_valid(raise_exception=True)

        payer_cpf_cnpj = request.query_params.get("payer_cpf_cnpj")
        if not payer_cpf_cnpj:
            return Response(
                {"detail": "Informe 'payer_cpf_cnpj' como query param."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        client = _build_client(payer_cpf_cnpj)

        try:
            result = client.consultar_protocolo(unique_id=serializer.validated_data["unique_id"])
        except TecnoSpeedAPIError as exc:
            return Response(
                {"detail": str(exc), "tecnospeed": exc.payload},
                status=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            )

        return Response(result, status=status.HTTP_200_OK)
