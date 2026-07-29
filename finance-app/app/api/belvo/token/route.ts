import { NextResponse } from "next/server";
import { createBelvoAccessToken } from "@/lib/belvo";
import { requireUser } from "@/lib/auth";

export async function POST() {
  try {
    await requireUser();
    const token = await createBelvoAccessToken();

    return NextResponse.json({ accessToken: token.access });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar token da Belvo.";
    const status = message.includes("credentials") ? 500 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
