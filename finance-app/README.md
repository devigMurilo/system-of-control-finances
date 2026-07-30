# Finance App

Aplicação full stack de controle financeiro com Next.js 15, TypeScript, Tailwind CSS, Prisma, PostgreSQL, autenticação via JWT e integração bancária com Pluggy.

## Rodando localmente

1. Copie `.env.example` para `.env`.
2. Preencha `DATABASE_URL`, `JWT_SECRET`, `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`.
3. Instale as dependências:

```bash
npm install
```

4. Gere o Prisma Client e rode a migração:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Inicie o servidor:

```bash
npm run dev
```

## Rotas

- `/login`
- `/dashboard`
- `/transactions`
- `/accounts`
- `/settings`

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/pluggy/connect-token`
- `POST /api/pluggy/items`
- `GET /api/pluggy/accounts`
- `GET /api/pluggy/transactions`
- `POST /api/webhooks/pluggy`
- `GET /api/dashboard`

## Fluxo de conexão bancária

1. O frontend solicita um Connect Token via `POST /api/pluggy/connect-token`
2. O token é usado para abrir o Pluggy Connect Widget
3. O usuário seleciona o banco e faz login no widget
4. O callback `onSuccess` envia o `itemId` para `POST /api/pluggy/items`
5. A Pluggy dispara webhooks (`item/updated`, `transactions/created`) para `POST /api/webhooks/pluggy`
6. O webhook sincroniza contas e transações no banco de dados local
