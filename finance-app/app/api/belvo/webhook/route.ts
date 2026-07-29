import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  console.info("Belvo webhook received", payload);
  return NextResponse.json({ received: true });
}
