"""
Cliente de integracao com a API da Pluggy.

Documentacao oficial:
- https://docs.pluggy.ai/docs/authentication
- https://docs.pluggy.ai/reference/auth
- https://docs.pluggy.ai/reference/connect-token-create

Fluxo:
  1. Backend autentica com CLIENT_ID + CLIENT_SECRET -> recebe apiKey (expira em 2h)
  2. Backend usa apiKey para gerar um connectToken (expira em 30min)
  3. Frontend usa o connectToken para abrir o Pluggy Connect Widget
  4. Usuario autentica direto no banco (Open Finance = OAuth2/FAPI, sem senha
     passando pelo seu backend)
  5. Pluggy cria um "item" e devolve o itemId (via onSuccess no frontend
     e/ou via webhook no backend)

IMPORTANTE: CLIENT_ID e CLIENT_SECRET sao extremamente sensiveis.
Toda comunicacao com esses dois campos deve ocorrer apenas no backend.
"""
from __future__ import annotations

import logging
import time

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

PLUGGY_BASE_URL = "https://api.pluggy.ai"


class PluggyAPIError(Exception):
    """Erro generico ao chamar a API da Pluggy."""

    def __init__(self, message: str, status_code: int | None = None, payload: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload or {}


class PluggyClient:
    """
    Encapsula autenticacao e geracao de connectToken da Pluggy.

    A apiKey eh cacheada em memoria do processo (valida por 2h) para evitar
    autenticar a cada requisicao. Em producao com multiplos workers,
    considere cachear isso em Redis/cache compartilhado em vez de memoria local.
    """

    TIMEOUT = 15
    _API_KEY_TTL_SECONDS = 2 * 60 * 60  # 2 horas

    def __init__(self, client_id: str | None = None, client_secret: str | None = None):
        self.client_id = client_id or settings.PLUGGY_CLIENT_ID
        self.client_secret = client_secret or settings.PLUGGY_CLIENT_SECRET
        self._api_key: str | None = None
        self._api_key_expires_at: float = 0.0

    # ------------------------------------------------------------------ #
    # Etapa 1 - autentica e obtem a apiKey (uso interno/backend apenas)
    # ------------------------------------------------------------------ #
    def _authenticate(self) -> str:
        response = requests.post(
            f"{PLUGGY_BASE_URL}/auth",
            json={"clientId": self.client_id, "clientSecret": self.client_secret},
            timeout=self.TIMEOUT,
        )
        payload = self._parse(response)
        api_key = payload.get("apiKey")
        if not api_key:
            raise PluggyAPIError("Resposta da Pluggy nao trouxe 'apiKey'.", payload=payload)
        return api_key

    def _get_api_key(self) -> str:
        now = time.monotonic()
        if not self._api_key or now >= self._api_key_expires_at:
            self._api_key = self._authenticate()
            # margem de seguranca de 60s antes de expirar de verdade
            self._api_key_expires_at = now + self._API_KEY_TTL_SECONDS - 60
        return self._api_key

    # ------------------------------------------------------------------ #
    # Etapa 2 - gera o connectToken para o frontend abrir o widget
    # ------------------------------------------------------------------ #
    def criar_connect_token(
        self,
        client_user_id: str,
        webhook_url: str | None = None,
        oauth_redirect_url: str | None = None,
        item_id: str | None = None,
        avoid_duplicates: bool = True,
    ) -> dict:
        """
        POST /connect_token

        client_user_id: identificador do seu usuario/pagador (ex: CNPJ),
            recomenda-se o padrao "nome | email | cpf_ou_cnpj" (orientacao Pluggy).
        item_id: se informado, abre o widget em modo de atualizacao de uma
            conexao ja existente, em vez de criar uma nova.

        Retorno: {"connectToken": "...", "expiresIn": ...(implicito 30min)}
        """
        api_key = self._get_api_key()

        options = {
            "clientUserId": client_user_id,
            "avoidDuplicates": avoid_duplicates,
        }
        if webhook_url:
            options["webhookUrl"] = webhook_url
        if oauth_redirect_url:
            options["oauthRedirectUrl"] = oauth_redirect_url
        if item_id:
            options["itemId"] = item_id

        response = requests.post(
            f"{PLUGGY_BASE_URL}/connect_token",
            json=options,
            headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            timeout=self.TIMEOUT,
        )
        return self._parse(response)

    @staticmethod
    def _parse(response: requests.Response) -> dict:
        try:
            payload = response.json()
        except ValueError:
            payload = {"raw": response.text}

        if response.status_code >= 400:
            message = payload.get("message") or "Erro desconhecido na API Pluggy"
            logger.warning("Erro Pluggy [%s]: %s | payload=%s", response.status_code, message, payload)
            raise PluggyAPIError(message, status_code=response.status_code, payload=payload)

        return payload
