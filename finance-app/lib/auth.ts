import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const authCookieName = "finance_session";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "development-secret-change-me"
);

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(authCookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: payload.name ? String(payload.name) : null
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSessionUser();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
