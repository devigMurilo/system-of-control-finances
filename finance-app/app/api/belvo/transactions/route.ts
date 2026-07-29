import { NextResponse } from "next/server";
import { belvoFetch } from "@/lib/belvo";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type BelvoTransaction = {
  id: string;
  account: string;
  description: string;
  amount: number;
  currency?: string;
  type: string;
  value_date: string;
  category?: string;
};

export async function GET() {
  const user = await requireUser();
  const transactions = await belvoFetch<{ results: BelvoTransaction[] }>(
    "/api/transactions/"
  );

  for (const transaction of transactions.results) {
    const account = await prisma.account.findFirst({
      where: { belvoAccountId: transaction.account, link: { userId: user.id } }
    });
    if (!account) continue;

    const category = transaction.category
      ? await prisma.category.upsert({
          where: { userId_name: { userId: user.id, name: transaction.category } },
          update: {},
          create: { userId: user.id, name: transaction.category }
        })
      : null;

    await prisma.transaction.upsert({
      where: { belvoTransactionId: transaction.id },
      update: {
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency ?? "BRL",
        type: transaction.type,
        date: new Date(transaction.value_date),
        categoryId: category?.id
      },
      create: {
        belvoTransactionId: transaction.id,
        accountId: account.id,
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency ?? "BRL",
        type: transaction.type,
        date: new Date(transaction.value_date),
        categoryId: category?.id
      }
    });
  }

  return NextResponse.json(transactions);
}
