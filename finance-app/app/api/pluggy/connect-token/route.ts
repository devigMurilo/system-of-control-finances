import { NextResponse } from "next/server";
import { pluggyClient } from "@/lib/pluggy";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = (await request.json().catch(() => null)) as {
      itemId?: string;
      webhookUrl?: string;
    } | null;

    const options: { clientUserId?: string; webhookUrl?: string } = {};

    if (user) {
      options.clientUserId = user.id;
    }

    if (body?.webhookUrl) {
      options.webhookUrl = body.webhookUrl;
    }

    const { accessToken } = await pluggyClient.createConnectToken(body?.itemId, options);

    return NextResponse.json({ accessToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar Connect Token";
    console.error("connect-token error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
