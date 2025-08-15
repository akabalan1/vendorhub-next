export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { startAuth } from "@/lib/webauthn";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    const options = await startAuth(String(email));
    return NextResponse.json(options);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to start authentication" },
      { status: 500 }
    );
  }
}
