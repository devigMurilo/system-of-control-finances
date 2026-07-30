import { AppShell } from "@/components/app-shell";
import { DashboardContent } from "@/components/dashboard-content";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const twelveMonthsAgo = new Date();
twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

export default async function DashboardPage() {
  const user = await requireUser();
  const accounts = await prisma.account.findMany({
    where: { link: { userId: user.id } },
    include: { balances: { orderBy: { date: "desc" }, take: 1 } },
  });
  const transactions = await prisma.transaction.findMany({
    where: { account: { link: { userId: user.id } }, date: { gte: twelveMonthsAgo } },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return (
    <AppShell>
      <DashboardContent
        accounts={JSON.parse(JSON.stringify(accounts))}
        transactions={JSON.parse(JSON.stringify(transactions))}
        userName={user.name ?? ""}
        userEmail={user.email}
      />
    </AppShell>
  );
}
