import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { TransactionsFilter } from "@/components/transactions-filter";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function TransactionsPage() {
  const user = await requireUser();
  const transactions = await prisma.transaction.findMany({
    where: { account: { link: { userId: user.id } } },
    include: { account: true, category: true },
    orderBy: { date: "desc" },
  });

  const accounts = await prisma.account.findMany({
    where: { link: { userId: user.id } },
    select: { id: true, name: true },
  });

  if (transactions.length === 0) {
    return (
      <AppShell>
        <h1 className="mb-6 text-2xl font-semibold">Transações</h1>
        <EmptyState
          title="Nenhuma transação encontrada"
          description="Suas transações aparecerão aqui depois de conectar uma conta bancária."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Transações</h1>
      <TransactionsFilter
        transactions={JSON.parse(JSON.stringify(transactions))}
        accounts={accounts}
      />
    </AppShell>
  );
}
