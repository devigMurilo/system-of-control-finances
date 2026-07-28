# Controle Financeiro

Projeto recriado com Django no backend e React no frontend.

## Estrutura

```text
backend/
  config/       Configuracao do Django
  finances/     App com contas, transacoes e dashboard
frontend/
  src/          Aplicacao React
```

## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_finances
python manage.py runserver 8000
```

A API fica em `http://localhost:8000/api/`.

Endpoints principais:

- `GET /api/dashboard/`
- `POST /api/connect-token/`
- `POST /api/webhooks/pluggy/`
- `GET /api/accounts/`
- `GET /api/transactions/`
- CRUD completo em `/api/accounts/` e `/api/transactions/`

Para gerar tokens do Pluggy Connect, configure `CLIENT_ID` e
`CLIENT_SECRET` no `.env` do backend e faça um `POST` sem corpo para
`/api/connect-token/`.

Registre o webhook na Pluggy apontando para:

```text
https://seu-dominio.com/api/webhooks/pluggy/
```

O endpoint trata os eventos `item/created`, `item/updated` e `item/error` e
responde `2xx` imediatamente com `{ "received": true }`.

## Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.
