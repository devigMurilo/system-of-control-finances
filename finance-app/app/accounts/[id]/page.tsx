import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { brl, getCategoryEmoji, groupByDate } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const account = await prisma.account.findFirst({
    where: { id, link: { userId: user.id } },
    include: {
      balances: { orderBy: { date: "desc" }, take: 1 },
      transactions: {
        include: { category: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!account) notFound();

  const balance = Number(account.balances[0]?.current ?? 0);
  const income = account.transactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0);
  const expenses = Math.abs(
    account.transactions
      .filter((t) => Number(t.amount) < 0)
      .reduce((s, t) => s + Number(t.amount), 0)
  );

  const groups = groupByDate(account.transactions);

  return (
    <AppShell>
      <Link
        href="/accounts"
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{account.name}</h1>
        <p className="text-sm text-slate-500">{account.type}</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
          <p className="text-sm font-medium text-emerald-700">Saldo</p>
          <strong className="mt-2 block text-3xl text-emerald-900">
            {brl(balance)}
          </strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Receitas</p>
          <strong className="mt-2 block text-2xl text-emerald-700">
            {brl(income)}
          </strong>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Despesas</p>
          <strong className="mt-2 block text-2xl text-red-600">
            {brl(expenses)}
          </strong>
        </div>
      </div>

      <h2 className="mb-4 text-xl font-semibold">Movimentações</h2>

      {account.transactions.length === 0 ? (
        <EmptyState
          title="Nenhuma movimentação"
          description="Esta conta ainda não possui transações registradas."
        />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
          {Array.from(groups.entries()).map(([label, txns]) => (
            <div key={label}>
              <div className="bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </div>
              {txns.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between px-4 py-3 text-sm transition-all hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {getCategoryEmoji(txn.category?.name ?? null)}
                    </span>
                    <p className="font-medium">{txn.description}</p>
                  </div>
                  <strong
                    className={
                      Number(txn.amount) > 0
                        ? "text-emerald-700"
                        : "text-red-600"
                    }
                  >
                    {brl(Number(txn.amount))}
                  </strong>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
