import { NextRequest, NextResponse } from "next/server";
import { verifyInvite } from "@/lib/invite";
import { prisma } from "@/lib/db";
import { signSession, sessionCookie } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const invite = await verifyInvite(token);
  if (!invite?.email) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { email: invite.email },
  });
  if (!user?.email) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  const session = await signSession(
    {
      sub: user.id,
      email: user.email,
      name: user.name ?? undefined,
      isAdmin: user.isAdmin || undefined,
      preAuth: true,
    } as any,
    60 * 10
  );

  const res = NextResponse.redirect(new URL("/setup-passkey", req.url));
  res.cookies.set(sessionCookie.name, session, {
    ...sessionCookie.options,
    maxAge: 10 * 60,
  });
  return res;
}
