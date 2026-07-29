import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  await requireUser();
  const origin = new URL(request.url).origin;

  await fetch(`${origin}/api/belvo/accounts`, {
    headers: { cookie: request.headers.get("cookie") ?? "" }
  });
  await fetch(`${origin}/api/belvo/balances`, {
    headers: { cookie: request.headers.get("cookie") ?? "" }
  });
  await fetch(`${origin}/api/belvo/transactions`, {
    headers: { cookie: request.headers.get("cookie") ?? "" }
  });

  return NextResponse.json({ ok: true });
}
