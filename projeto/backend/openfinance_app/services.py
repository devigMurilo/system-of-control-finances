from __future__ import annotations

import logging
from dataclasses import dataclass

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class TecnoSpeedAPIError(Exception):
    """Erro generico ao chamar a API de Extrato Open Finance da TecnoSpeed."""

    def __init__(self, message: str, status_code: int | None = None, payload: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload or {}


@dataclass
class TecnoSpeedCredentials:
    """Credenciais de autenticacao enviadas via headers em toda requisicao."""

    cnpjsh: str
    tokensh: str
    payercpfcnpj: str

    def as_headers(self) -> dict:
        return {
            "cnpjsh": self.cnpjsh,
            "tokensh": self.tokensh,
            "payercpfcnpj": self.payercpfcnpj,
            "Content-Type": "application/json",
        }


class TecnoSpeedOpenFinanceClient:
    """Encapsula as chamadas HTTP para a API de Extrato Open Finance."""

    TIMEOUT = 30

    def __init__(self, credentials: TecnoSpeedCredentials, base_url: str | None = None):
        self.credentials = credentials
        self.base_url = (base_url or settings.TECNOSPEED_OPENFINANCE_BASE_URL).rstrip("/")

    def criar_protocolo(
        self,
        account_hash: str,
        date_start: str | None = None,
        date_end: str | None = None,
        today: bool | None = None,
    ) -> dict:
        url = f"{self.base_url}/api/v1/statement/openfinance"
        body = {"accountHash": account_hash}

        if today is not None:
            body["today"] = today
        if date_start:
            body["dateStart"] = date_start
        if date_end:
            body["dateEnd"] = date_end

        response = requests.post(
            url,
            json=body,
            headers=self.credentials.as_headers(),
            timeout=self.TIMEOUT,
        )
        return self._handle_response(response)

    def consultar_protocolo(self, unique_id: str) -> dict:
        url = f"{self.base_url}/api/v1/statement/openfinance/{unique_id}"

        response = requests.get(
            url,
            headers=self.credentials.as_headers(),
            timeout=self.TIMEOUT,
        )
        return self._handle_response(response)

    @staticmethod
    def _handle_response(response: requests.Response) -> dict:
        try:
            payload = response.json()
        except ValueError:
            payload = {"raw": response.text}

        if response.status_code >= 400:
            message = (
                payload.get("message")
                or payload.get("error")
                or "Erro desconhecido na API TecnoSpeed"
            )
            logger.warning(
                "Erro TecnoSpeed OpenFinance [%s]: %s | payload=%s",
                response.status_code,
                message,
                payload,
            )
            raise TecnoSpeedAPIError(message, status_code=response.status_code, payload=payload)

        return payload
