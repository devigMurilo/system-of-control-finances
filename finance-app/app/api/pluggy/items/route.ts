import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { pluggyClient } from "@/lib/pluggy";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = (await request.json().catch(() => null)) as {
      itemId?: string;
      connectorId?: number;
    } | null;

    const itemId = typeof body?.itemId === "string" ? body.itemId.trim() : "";

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId não informado." },
        { status: 400 }
      );
    }

    const existing = await prisma.link.findUnique({
      where: { pluggyItemId: itemId },
    });

    if (existing) {
      return NextResponse.json({ item: existing });
    }

    const item = await prisma.link.create({
      data: {
        pluggyItemId: itemId,
        userId: user.id,
        connectorId: body?.connectorId ?? null,
        status: "active",
      },
    });

    // Initial sync — busca contas e transações imediatamente
    try {
      const pluggyItem = await pluggyClient.fetchItem(itemId);
      const connectorId = pluggyItem.connector?.id;

      await prisma.link.update({
        where: { id: item.id },
        data: {
          connectorId: connectorId ?? null,
          status: "synced",
        },
      });

      const accounts = await pluggyClient.fetchAccounts(itemId);

      for (const pluggyAccount of accounts.results ?? []) {
        const savedAccount = await prisma.account.upsert({
          where: { pluggyAccountId: pluggyAccount.id },
          update: {
            name: pluggyAccount.name,
            type: pluggyAccount.type,
            currency: pluggyAccount.currencyCode ?? "BRL",
            number: pluggyAccount.number ?? undefined,
          },
          create: {
            pluggyAccountId: pluggyAccount.id,
            linkId: item.id,
            name: pluggyAccount.name,
            type: pluggyAccount.type,
            currency: pluggyAccount.currencyCode ?? "BRL",
            number: pluggyAccount.number ?? undefined,
          },
        });

        if (pluggyAccount.balance != null) {
          const available =
            pluggyAccount.bankData?.closingBalance ??
            pluggyAccount.creditData?.availableCreditLimit ??
            undefined;

          await prisma.balance.create({
            data: {
              accountId: savedAccount.id,
              current: pluggyAccount.balance,
              available,
              date: new Date(),
            },
          });
        }

        // Sync transactions for this account
        try {
          const txns = await pluggyClient.fetchAllTransactions(pluggyAccount.id);
          for (const txn of txns ?? []) {
            await prisma.transaction.upsert({
              where: { pluggyTransactionId: txn.id },
              update: {
                description: txn.description,
                amount: txn.amount,
                currency: txn.currencyCode ?? "BRL",
                type: txn.type,
                date: new Date(txn.date),
              },
              create: {
                pluggyTransactionId: txn.id,
                accountId: savedAccount.id,
                description: txn.description,
                amount: txn.amount,
                currency: txn.currencyCode ?? "BRL",
                type: txn.type,
                date: new Date(txn.date),
              },
            });
          }
        } catch {
          // non-critical — transactions may not be ready yet
        }
      }
    } catch {
      // non-critical — initial sync failed, webhook will retry
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar item";
    console.error("items error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
