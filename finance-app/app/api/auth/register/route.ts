import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authCookieName, createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(request: Request) {
  const input = schema.parse(await request.json());
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      categories: {
        create: [
          { name: "Alimentação", emoji: "🍔" },
          { name: "Transporte", emoji: "🚗" },
          { name: "Casa", emoji: "🏠" },
          { name: "Lazer", emoji: "🎮" }
        ]
      }
    }
  });
  const token = await createSessionToken(user);

  (await cookies()).set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
