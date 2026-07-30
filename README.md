# Finance App

Aplicação full stack de controle financeiro pessoal com Next.js 15 (App Router), TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL e integração bancária via Pluggy.

## Índice

- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Configuração inicial](#configuração-inicial)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Executando o projeto](#executando-o-projeto)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Autenticação](#autenticação)
- [Integração bancária (Pluggy)](#integração-bancária-pluggy)
  - [Fluxo de conexão](#fluxo-de-conexão)
  - [Widget de conexão](#widget-de-conexão)
  - [Webhooks](#webhooks)
  - [Sincronização manual](#sincronização-manual)
- [Banco de dados](#banco-de-dados)
- [API endpoints](#api-endpoints)
- [Próximos passos](#próximos-passos)

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS + shadcn/ui |
| **ORM** | Prisma 6 |
| **Banco** | PostgreSQL |
| **Autenticação** | JWT (HS256 via `jose`), cookie httpOnly |
| **Integração bancária** | Pluggy (`pluggy-sdk` + `react-pluggy-connect`) |
| **Senhas** | bcrypt |

---

## Pré-requisitos

- **Node.js** 18+ (recomendado 22+)
- **PostgreSQL** 16+ rodando localmente
- **Conta Pluggy** (gratuita em [dashboard.pluggy.ai](https://dashboard.pluggy.ai))

---

## Configuração inicial

### 1. PostgreSQL

Certifique-se de que o PostgreSQL está rodando:

```bash
# Verificar serviço (Windows)
Get-Service -Name postgresql*
```

O banco `finance_app` e as tabelas são criados automaticamente pelo Prisma no passo de migração.

### 2. Conta Pluggy

1. Crie uma conta em [dashboard.pluggy.ai](https://dashboard.pluggy.ai)
2. Vá em **Applications** e crie uma aplicação
3. Copie o **Client ID** e **Client Secret**
4. Use o ambiente **Sandbox** para testes iniciais

### 3. Variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
# Windows PowerShell:
Copy-Item .env.example .env
```

Preencha as variáveis conforme a seção abaixo.

---

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexão com PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:5432/finance_app?schema=public` |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | `qualquer-string-segura-aqui` |
| `PLUGGY_CLIENT_ID` | Client ID da sua aplicação Pluggy | `82dce565-a8ec-4468-9b57-b235bb56b18b` |
| `PLUGGY_CLIENT_SECRET` | Client Secret da sua aplicação Pluggy | `AAAPruZM9VzMVSvFYdIzVlBOS4EXWIUf9dwt5mHCkYg` |
| `PLUGGY_ENV` | Ambiente Pluggy (`sandbox` ou `production`) | `sandbox` |
| `NEXT_PUBLIC_PLUGGY_WEBHOOK_URL` | URL pública para receber webhooks (opcional em dev) | `https://meu-site.com/api/webhooks/pluggy` |
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação | `http://localhost:3000` |

> **Importante**: `PLUGGY_CLIENT_SECRET` NUNCA deve ser exposto no frontend. Ele só é usado no servidor para gerar API Keys e Connect Tokens.

---

## Executando o projeto

```bash
# 1. Instalar dependências
npm install

# 2. Gerar Prisma Client e criar as tabelas no banco
npm run prisma:generate
npm run prisma:migrate

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Comandos úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run lint` | Executa ESLint |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run prisma:migrate` | Executa migrações pendentes |
| `npx prisma studio` | Abre interface gráfica do banco de dados |

---

## Estrutura do projeto

```
finance-app/
├── app/
│   ├── api/
│   │   ├── auth/           # Autenticação (login, register, logout)
│   │   ├── dashboard/      # Dados do dashboard
│   │   ├── pluggy/         # Integração Pluggy
│   │   │   ├── connect-token/    # Gera Connect Token
│   │   │   ├── items/            # Gerencia itens conectados
│   │   │   ├── accounts/         # Lista contas do usuário
│   │   │   └── transactions/     # Lista transações do usuário
│   │   └── webhooks/
│   │       └── pluggy/     # Recebe webhooks da Pluggy
│   ├── dashboard/          # Página do dashboard
│   ├── transactions/       # Página de transações
│   ├── accounts/           # Página de contas
│   ├── settings/           # Página de configurações
│   ├── login/              # Página de login/cadastro
│   ├── layout.tsx          # Layout raiz
│   └── page.tsx            # Página inicial (redireciona para /dashboard)
├── components/
│   ├── app-shell.tsx       # Sidebar + layout das páginas protegidas
│   ├── connect-bank-button.tsx  # Widget de conexão bancária
│   ├── login-form.tsx      # Formulário de login/cadastro
│   ├── logout-button.tsx   # Botão de logout
│   └── ui/                 # Componentes shadcn/ui
├── lib/
│   ├── auth.ts             # Utilitários de autenticação (JWT)
│   ├── pluggy.ts           # Cliente Pluggy configurado
│   ├── prisma.ts           # Singleton do Prisma Client
│   └── utils.ts            # Utilitários gerais (cn)
├── prisma/
│   ├── schema.prisma       # Schema do banco de dados
│   └── migrations/         # Migrações automatizadas
└── middleware.ts           # Middleware de proteção de rotas
```

---

## Autenticação

O sistema usa autenticação via **JWT** armazenado em **cookie httpOnly**.

### Fluxo

1. O usuário faz cadastro ou login via `/api/auth/register` ou `/api/auth/login`
2. O servidor gera um JWT com os dados do usuário (id, email, nome) e define um cookie `finance_session`
3. O `middleware.ts` verifica a presença do cookie em rotas protegidas e redireciona para `/login` se ausente
4. As rotas de API usam `requireUser()` para obter o usuário autenticado
5. O logout remove o cookie via `POST /api/auth/logout`

### Rotas protegidas

Todas as rotas sob `/dashboard`, `/transactions`, `/accounts` e `/settings` são protegidas pelo middleware.

---

## Integração bancária (Pluggy)

### Fluxo de conexão

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Usuário   │     │  Frontend (React) │     │  Backend     │
│             │     │                  │     │  (Next.js)   │
└──────┬──────┘     └────────┬─────────┘     └──────┬───────┘
       │                     │                      │
       │  Clica "Conectar    │                      │
       │  banco"             │                      │
       │────────────────────>│                      │
       │                     │  POST /api/pluggy/   │
       │                     │  connect-token        │
       │                     │─────────────────────>│
       │                     │                      │  Gera API Key
       │                     │                      │  + Connect Token
       │                     │   { accessToken }    │
       │                     │<─────────────────────│
       │                     │                      │
       │  Widget Pluggy      │                      │
       │  Connect abre       │                      │
       │<────────────────────│                      │
       │                     │                      │
       │  Usuário seleciona  │                      │
       │  banco + faz login  │                      │
       │────────────────────>│                      │
       │                     │                      │
       │  onSuccess(item)    │  POST /api/pluggy/   │
       │                     │  items + itemId      │
       │                     │─────────────────────>│  Salva Link
       │                     │                      │  no banco
       │                     │                      │
       │                     │                      │  Busca contas
       │                     │                      │  + transações
       │                     │                      │  da Pluggy
       │                     │                      │
       │                     │  router.refresh()    │
       │                     │<─────────────────────│
       │  Página recarrega   │                      │
       │  com dados novos    │                      │
       │<────────────────────│                      │
```

### Widget de conexão

O componente `components/connect-bank-button.tsx` usa o pacote `react-pluggy-connect` (importado dinamicamente com `ssr: false`).

**Comportamento:**
1. Gera um **Connect Token** via API (server-side) — válido por 30 minutos
2. Abre o Pluggy Connect Widget modal
3. Exibe conectores sandbox (em desenvolvimento) ou reais
4. Callback `onSuccess`: salva o `itemId` e dispara a sincronização inicial
5. Callback `onError`: exibe mensagem de erro amigável
6. Callback `onClose`: fecha o modal sem erro
7. Ao finalizar, a página é recarregada automaticamente via `router.refresh()`

### Webhooks

A Pluggy envia notificações para `POST /api/webhooks/pluggy` quando eventos ocorrem:

| Evento | Quando ocorre |
|---|---|
| `item/created` | Item criado com sucesso |
| `item/updated` | Item atualizado/sincronizado |
| `item/error` | Erro na execução do Item |
| `item/deleted` | Item removido |
| `item/login_succeeded` | Login no banco bem-sucedido |
| `transactions/created` | Novas transações disponíveis |
| `transactions/updated` | Transações foram atualizadas |
| `transactions/deleted` | Transações foram removidas |

**Processamento do webhook:**
1. Recebe o evento e identifica o `itemId`
2. Para `item/*`: busca contas e saldos via Pluggy API
3. Para `transactions/*`: busca as transações da conta afetada
4. Todos os dados são persistidos via Prisma (upsert)

> **Nota**: Em desenvolvimento local (localhost), webhooks não são recebidos. A sincronização inicial já ocorre no momento da conexão (dentro do `POST /api/pluggy/items`), então você ainda tem dados imediatamente. Para testar webhooks localmente, use [ngrok](https://ngrok.com/).

### Sincronização manual

A sincronização dos dados bancários ocorre em dois cenários:

1. **Automática (conexão inicial):** quando o usuário conecta um banco, as contas e transações são baixadas imediatamente
2. **Via webhook:** a Pluggy notifica o backend quando novos dados estão disponíveis (em produção)

---

## Banco de dados

### Modelo de dados

```prisma
User       1──N Link       1──N Account      1──N Transaction
                                         
Account    1──N Balance
User       1──N Category   1──N Transaction
```

| Modelo | Descrição | Campos chave |
|---|---|---|
| `User` | Usuário do sistema | `email`, `name`, `passwordHash` |
| `Link` | Conexão bancária (Item Pluggy) | `pluggyItemId`, `connectorId`, `status` |
| `Account` | Conta bancária | `pluggyAccountId`, `name`, `type`, `currency` |
| `Balance` | Saldo da conta em uma data | `current`, `available`, `date` |
| `Transaction` | Transação financeira | `pluggyTransactionId`, `description`, `amount`, `type`, `date` |
| `Category` | Categoria de transação | `name` (unique por usuário) |
| `Institution` | Instituição financeira (conector Pluggy) | `pluggyId`, `name` |

### Consultando dados via psql

```bash
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h 127.0.0.1 -d finance_app
```

Dentro do psql:
```sql
\dt                                     -- listar tabelas
SELECT * FROM "User";                   -- ver usuários
SELECT * FROM "Link";                   -- ver conexões bancárias
SELECT * FROM "Account";                -- ver contas
SELECT * FROM "Transaction";            -- ver transações
```

---

## API endpoints

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastro de novo usuário |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout (remove cookie) |

### Pluggy

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/pluggy/connect-token` | Gera Connect Token para o widget |
| `POST` | `/api/pluggy/items` | Salva Item conectado + sincroniza dados iniciais |
| `GET` | `/api/pluggy/accounts` | Lista contas do usuário logado |
| `GET` | `/api/pluggy/transactions?accountId=&limit=&offset=` | Lista transações com paginação |

### Webhooks

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/webhooks/pluggy` | Recebe eventos da Pluggy |

### Dashboard

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/dashboard` | Resumo de contas e últimas transações |

---

## Próximos passos

Funcionalidades que podem ser implementadas:

- [ ] Página de extrato bancário com filtros por data e categoria
- [ ] Edição de categorias nas transações
- [ ] Gráficos de receitas e despesas por período
- [ ] Suporte a múltiplas contas bancárias do mesmo usuário
- [ ] Atualização manual de conexão bancária (reconexão)
- [ ] Exclusão de conexão bancária (desconectar banco)
- [ ] Sincronização periódica via webhook (ngrok para testes)
- [ ] Testes automatizados (vitest ou Playwright)
- [ ] CI/CD com GitHub Actions
- [ ] Deploy em produção (Vercel + Render/Neon para PostgreSQL)

---

## Licença

Projeto privado de controle financeiro pessoal.
