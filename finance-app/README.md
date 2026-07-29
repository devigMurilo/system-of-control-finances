# Finance App

Aplicação full stack de controle financeiro com Next.js 15, TypeScript, Tailwind CSS, Prisma, PostgreSQL, autenticação via JWT e integração server-side com Belvo.

## Rodando localmente

1. Copie `.env.example` para `.env`.
2. Preencha `DATABASE_URL`, `JWT_SECRET`, `BELVO_SECRET_ID` e `BELVO_SECRET_PASSWORD`.
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
- `POST /api/belvo/connect`
- `GET /api/belvo/accounts`
- `GET /api/belvo/balances`
- `GET /api/belvo/transactions`
- `POST /api/belvo/sync`
- `POST /api/belvo/webhook`
- `GET /api/dashboard`

As credenciais da Belvo ficam apenas no servidor, em variáveis de ambiente.
