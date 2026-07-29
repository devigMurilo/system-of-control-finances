import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await prisma.account.findMany({
    where: { link: { userId: user.id } },
    include: { balances: { orderBy: { date: "desc" }, take: 1 }, link: true }
  });

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Contas</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <Card key={account.id} className="p-5">
            <p className="font-semibold">{account.name}</p>
            <p className="mt-1 text-sm text-slate-500">{account.type}</p>
            <strong className="mt-4 block text-2xl">
              R$ {Number(account.balances[0]?.current ?? 0).toFixed(2)}
            </strong>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
