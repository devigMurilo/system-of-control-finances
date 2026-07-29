import { NextResponse } from "next/server";
import { belvoFetch } from "@/lib/belvo";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type BelvoBalance = {
  account: string;
  current_balance: number;
  available_balance?: number;
  value_date?: string;
};

export async function GET() {
  const user = await requireUser();
  const balances = await belvoFetch<{ results: BelvoBalance[] }>("/api/balances/");

  for (const balance of balances.results) {
    const account = await prisma.account.findFirst({
      where: { belvoAccountId: balance.account, link: { userId: user.id } }
    });
    if (!account) continue;

    await prisma.balance.create({
      data: {
        accountId: account.id,
        current: balance.current_balance,
        available: balance.available_balance,
        date: balance.value_date ? new Date(balance.value_date) : new Date()
      }
    });
  }

  return NextResponse.json(balances);
}
