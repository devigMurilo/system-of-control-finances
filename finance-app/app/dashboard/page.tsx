import { AppShell } from "@/components/app-shell";
import { ConnectBankButton } from "@/components/connect-bank-button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const accounts = await prisma.account.findMany({
    where: { link: { userId: user.id } },
    include: { balances: { orderBy: { date: "desc" }, take: 1 } }
  });
  const transactions = await prisma.transaction.findMany({
    where: { account: { link: { userId: user.id } } },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 6
  });

  const balance = accounts.reduce(
    (sum, account) => sum + Number(account.balances[0]?.current ?? 0),
    0
  );
  const income = transactions
    .filter((item) => Number(item.amount) > 0)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = Math.abs(
    transactions
      .filter((item) => Number(item.amount) < 0)
      .reduce((sum, item) => sum + Number(item.amount), 0)
  );

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">Olá, {user.name ?? user.email}</p>
        </div>
        <ConnectBankButton />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Saldo</p>
          <strong className="mt-2 block text-3xl">{brl(balance)}</strong>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Receitas</p>
          <strong className="mt-2 block text-2xl text-emerald-700">{brl(income)}</strong>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Despesas</p>
          <strong className="mt-2 block text-2xl text-red-600">{brl(expenses)}</strong>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <h2 className="font-semibold">Categorias</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {["🍔 Alimentação", "🚗 Transporte", "🏠 Casa", "🎮 Lazer"].map((item) => (
              <div key={item} className="rounded-md bg-muted px-3 py-2">{item}</div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Últimas transações</h2>
          <div className="mt-4 divide-y divide-border">
            {transactions.length === 0 && (
              <p className="py-6 text-sm text-slate-500">Nenhuma transação sincronizada.</p>
            )}
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 text-sm">
                <span>{transaction.description}</span>
                <strong>{brl(Number(transaction.amount))}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
