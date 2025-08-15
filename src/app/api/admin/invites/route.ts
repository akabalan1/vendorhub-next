import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { signInvite } from "@/lib/invite";

export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "admin only" }, { status: 403 });
  }

  const body = await req.json();
  const email = body?.email as string | undefined;
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const token = await signInvite({ email });
  const url = new URL(`/invite`, req.nextUrl.origin);
  url.searchParams.set("token", token);

  return NextResponse.json({ url: url.toString() });
}
