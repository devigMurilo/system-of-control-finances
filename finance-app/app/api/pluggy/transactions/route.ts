import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 500);
    const offset = Number(searchParams.get("offset")) || 0;

    const where: Record<string, unknown> = {
      account: { link: { userId: user.id } },
    };

    if (accountId) {
      where.accountId = accountId;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true, account: true },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total, limit, offset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar transações";
    console.error("transactions error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
