import { NextResponse } from "next/server";
import { belvoFetch } from "@/lib/belvo";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type BelvoAccount = {
  id: string;
  link: string;
  name: string;
  type: string;
  currency?: string;
  number?: string;
};

export async function GET() {
  const user = await requireUser();
  const accounts = await belvoFetch<{ results: BelvoAccount[] }>("/api/accounts/");

  for (const account of accounts.results) {
    const link = await prisma.link.findFirst({
      where: { userId: user.id, belvoLinkId: account.link }
    });
    if (!link) continue;

    await prisma.account.upsert({
      where: { belvoAccountId: account.id },
      update: {
        name: account.name,
        type: account.type,
        currency: account.currency ?? "BRL",
        number: account.number
      },
      create: {
        belvoAccountId: account.id,
        linkId: link.id,
        name: account.name,
        type: account.type,
        currency: account.currency ?? "BRL",
        number: account.number
      }
    });
  }

  return NextResponse.json(accounts);
}
