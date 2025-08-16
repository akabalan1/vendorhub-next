import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isMetaEmail(e: string) {
  return /@meta\.com$/i.test(e);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const name = (body.name && String(body.name).trim()) || null;
    const message = (body.message && String(body.message).trim()) || null;
    const honeypot = String(body.company || ""); // hidden field, must be empty

    if (!email || !isMetaEmail(email)) {
      return NextResponse.json({ error: "Use your @meta.com email." }, { status: 400 });
    }
    if (honeypot) {
      // likely a bot
      return NextResponse.json({ ok: true });
    }

    const id = crypto.randomUUID();
    await prisma.accessRequest.create({
      data: { id, email, name, message },
    });

    const mailto = `mailto:alkabalan@meta.com?subject=${encodeURIComponent(
      "VendorHub access request"
    )}&body=${encodeURIComponent(`Please approve access for ${email}${name ? ` (${name})` : ""}.
Message: ${message || "(none)"}
Request ID: ${id}`)}`;

    return NextResponse.json({ ok: true, id, mailto });
  } catch (e) {
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
