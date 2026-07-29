import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = (await request.json().catch(() => null)) as {
    linkId?: unknown;
    institution?: unknown;
  } | null;
  const linkId = typeof body?.linkId === "string" ? body.linkId.trim() : "";
  const institution = typeof body?.institution === "string" ? body.institution.trim() : "";

  if (!linkId) {
    return NextResponse.json(
      { error: "Link da Belvo não informado." },
      { status: 400 }
    );
  }

  await prisma.link.upsert({
    where: { belvoLinkId: linkId },
    update: { status: "active" },
    create: {
      belvoLinkId: linkId,
      userId: user.id,
      status: "active"
    }
  });

  return NextResponse.json({ linkId, institution });
}
