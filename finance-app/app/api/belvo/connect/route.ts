import { NextResponse } from "next/server";
import { createBelvoLink, getBelvoWidgetConfig } from "@/lib/belvo";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST() {
  const user = await requireUser();
  const link = await createBelvoLink();
  await prisma.link.upsert({
    where: { belvoLinkId: link.id },
    update: { status: "active" },
    create: {
      belvoLinkId: link.id,
      userId: user.id,
      status: "active"
    }
  });

  return NextResponse.json({
    linkId: link.id,
    widget: getBelvoWidgetConfig(link.id)
  });
}
