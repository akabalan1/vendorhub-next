// src/app/api/auth/bootstrap-invite/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const INV_ISSUER = "vendorhub-invite";

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(s);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();

  if (!email || !email.endsWith("@meta.com")) {
    return NextResponse.json({ error: "Email must be your @meta.com address." }, { status: 400 });
  }

  // Allow exactly once: only when there are zero users.
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json({ error: "Bootstrap disabled: users already exist." }, { status: 403 });
  }

  // Make this email the first admin.
  await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true },
    create: { email, isAdmin: true },
  });

  // Create a normal invite token (20 minutes), same issuer as your invite flow.
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(INV_ISSUER)
    .setExpirationTime("20m")
    .sign(secretKey());

  const inviteUrl = `${url.origin}/invite?token=${encodeURIComponent(token)}`;
  return NextResponse.json({ url: inviteUrl });
}

