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

    try {
      const pluggyItem = await pluggyClient.fetchItem(itemId);
      if (pluggyItem.connector?.id) {
        await prisma.link.update({
          where: { id: item.id },
          data: { connectorId: pluggyItem.connector.id },
        });
      }
    } catch {
      // non-critical — item already saved
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar item";
    console.error("items error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
