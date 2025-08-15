export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { startRegistration } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    const opts = await startRegistration(String(email));
    return NextResponse.json(opts);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to start registration" },
      { status: 500 }
    );
  }
}
