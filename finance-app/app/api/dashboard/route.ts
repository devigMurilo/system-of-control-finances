import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  const accounts = await prisma.account.findMany({
    where: { link: { userId: user.id } },
    include: { balances: { orderBy: { date: "desc" }, take: 1 } }
  });
  const transactions = await prisma.transaction.findMany({
    where: { account: { link: { userId: user.id } } },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 10
  });

  return NextResponse.json({ accounts, transactions });
}
