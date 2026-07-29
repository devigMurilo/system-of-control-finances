import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function TransactionsPage() {
  const user = await requireUser();
  const transactions = await prisma.transaction.findMany({
    where: { account: { link: { userId: user.id } } },
    include: { account: true, category: true },
    orderBy: { date: "desc" }
  });

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Transações</h1>
      <Card className="overflow-hidden">
        {transactions.map((item) => (
          <div key={item.id} className="grid grid-cols-3 gap-4 border-b border-border p-4 text-sm">
            <span>{item.description}</span>
            <span>{item.account.name}</span>
            <strong className="text-right">R$ {Number(item.amount).toFixed(2)}</strong>
          </div>
        ))}
      </Card>
    </AppShell>
  );
}
