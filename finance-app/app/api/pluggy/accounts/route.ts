import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();

    const accounts = await prisma.account.findMany({
      where: {
        link: { userId: user.id },
      },
      include: {
        balances: { orderBy: { date: "desc" }, take: 1 },
        link: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar contas";
    console.error("accounts error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
