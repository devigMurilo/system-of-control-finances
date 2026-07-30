import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pluggyClient } from "@/lib/pluggy";

type PluggyWebhookEvent =
  | "item/created"
  | "item/updated"
  | "item/error"
  | "item/deleted"
  | "item/login_succeeded"
  | "item/waiting_user_input"
  | "item/waiting_user_action"
  | "connector/status_updated"
  | "transactions/created"
  | "transactions/updated"
  | "transactions/deleted";

type WebhookPayload = {
  event: PluggyWebhookEvent;
  eventId: string;
  itemId?: string;
  accountId?: string;
  connectorId?: string;
  clientUserId?: string;
  error?: { code: string; message: string; parameter?: string };
  transactionIds?: string[];
  transactionsCount?: number;
  createdTransactionsLink?: string;
};

export async function POST(request: Request) {
  const payload: WebhookPayload = await request.json();

  console.info("Pluggy webhook received:", payload.event, payload.eventId);

  try {
    switch (payload.event) {
      case "item/created":
      case "item/updated":
      case "item/login_succeeded":
        if (payload.itemId) {
          await syncItemData(payload.itemId);
        }
        break;

      case "item/error":
        if (payload.itemId) {
          await prisma.link.update({
            where: { pluggyItemId: payload.itemId },
            data: { status: "error" },
          });
          console.error("Item error:", payload.itemId, payload.error);
        }
        break;

      case "item/deleted":
        if (payload.itemId) {
          await prisma.link
            .delete({ where: { pluggyItemId: payload.itemId } })
            .catch(() => {});
        }
        break;

      case "transactions/created":
        if (payload.accountId && payload.itemId) {
          await syncTransactions(payload.accountId);
        }
        if (payload.createdTransactionsLink) {
          await fetchAndSyncTransactionsFromUrl(payload.createdTransactionsLink);
        }
        break;

      case "transactions/updated":
      case "transactions/deleted":
        if (payload.itemId) {
          await syncItemData(payload.itemId);
        }
        break;
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
  }

  return NextResponse.json({ received: true });
}

async function syncItemData(itemId: string) {
  const link = await prisma.link.findUnique({
    where: { pluggyItemId: itemId },
  });

  if (link) {
    await prisma.link.update({
      where: { id: link.id },
      data: { status: "synced" },
    });
  }

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
        linkId: link?.id ?? "",
        name: pluggyAccount.name,
        type: pluggyAccount.type,
        currency: pluggyAccount.currencyCode ?? "BRL",
        number: pluggyAccount.number ?? undefined,
      },
    });

    if (pluggyAccount.balance !== undefined && pluggyAccount.balance !== null) {
      const availableBalance =
        pluggyAccount.bankData?.closingBalance ??
        pluggyAccount.creditData?.availableCreditLimit ??
        undefined;

      await prisma.balance.create({
        data: {
          accountId: savedAccount.id,
          current: pluggyAccount.balance,
          available: availableBalance,
          date: new Date(),
        },
      });
    }

    await syncTransactions(pluggyAccount.id);
  }
}

async function getUserIdForAccount(accountId: string): Promise<string | null> {
  const account = await prisma.account.findUnique({
    where: { pluggyAccountId: accountId },
    include: { link: { select: { userId: true } } },
  });
  return account?.link?.userId ?? null;
}

async function syncTransactions(accountId: string) {
  const localAccount = await prisma.account.findUnique({
    where: { pluggyAccountId: accountId },
  });

  if (!localAccount) return;

  const userId = await getUserIdForAccount(accountId);
  if (!userId) return;

  try {
    const pluggyTxns = await pluggyClient.fetchTransactions(accountId);

    for (const txn of pluggyTxns.results ?? []) {
      const category = txn.category
        ? await prisma.category.upsert({
            where: { userId_name: { userId, name: txn.category } },
            update: {},
            create: { userId, name: txn.category },
          })
        : null;

      await prisma.transaction.upsert({
        where: { pluggyTransactionId: txn.id },
        update: {
          description: txn.description,
          amount: txn.amount,
          currency: txn.currencyCode ?? "BRL",
          type: txn.type,
          date: new Date(txn.date),
          categoryId: category?.id,
        },
        create: {
          pluggyTransactionId: txn.id,
          accountId: localAccount.id,
          description: txn.description,
          amount: txn.amount,
          currency: txn.currencyCode ?? "BRL",
          type: txn.type,
          date: new Date(txn.date),
          categoryId: category?.id,
        },
      });
    }
  } catch (error) {
    console.error(`Error syncing transactions for account ${accountId}:`, error);
  }
}

async function fetchAndSyncTransactionsFromUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "X-API-Key": process.env.PLUGGY_CLIENT_SECRET ?? "",
      },
    });

    if (!response.ok) return;

    const data = await response.json();
    for (const txn of data.results ?? []) {
      const localAccount = await prisma.account.findUnique({
        where: { pluggyAccountId: txn.accountId },
      });
      if (!localAccount) continue;

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
          accountId: localAccount.id,
          description: txn.description,
          amount: txn.amount,
          currency: txn.currencyCode ?? "BRL",
          type: txn.type,
          date: new Date(txn.date),
        },
      });
    }
  } catch (error) {
    console.error("Error fetching transactions from URL:", error);
  }
}
