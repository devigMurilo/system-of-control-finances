import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { brl } from "@/lib/format";

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await prisma.account.findMany({
    where: { link: { userId: user.id } },
    include: { balances: { orderBy: { date: "desc" }, take: 1 }, link: true },
  });

  if (accounts.length === 0) {
    return (
      <AppShell>
        <h1 className="mb-6 text-2xl font-semibold">Contas</h1>
        <EmptyState
          title="Nenhuma conta conectada"
          description="Conecte um banco pelo Dashboard para visualizar suas contas aqui."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Contas</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <Link key={account.id} href={`/accounts/${account.id}`}>
            <Card className="cursor-pointer p-5 transition-all hover:shadow-md hover:scale-[1.02]">
              <p className="font-semibold">{account.name}</p>
              <p className="mt-1 text-sm text-slate-500">{account.type}</p>
              <strong className="mt-4 block text-2xl text-emerald-700">
                {brl(Number(account.balances[0]?.current ?? 0))}
              </strong>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
