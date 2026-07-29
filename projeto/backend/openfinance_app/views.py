from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    ConsultarExtratoOpenFinanceSerializer,
    CriarExtratoOpenFinanceSerializer,
)
from .services import (
    TecnoSpeedAPIError,
    TecnoSpeedCredentials,
    TecnoSpeedOpenFinanceClient,
)


def _build_client(payer_cpf_cnpj: str) -> TecnoSpeedOpenFinanceClient:
    credentials = TecnoSpeedCredentials(
        cnpjsh=settings.TECNOSPEED_CNPJSH,
        tokensh=settings.TECNOSPEED_TOKENSH,
        payercpfcnpj=payer_cpf_cnpj,
    )
    return TecnoSpeedOpenFinanceClient(credentials)


class CriarExtratoOpenFinanceView(APIView):
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
