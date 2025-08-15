// src/app/api/feedback/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b?.vendorId) {
      return NextResponse.json({ error: 'vendorId required' }, { status: 400 });
    }

    const session = await verifySession();
    const author = session?.email || b.author || 'anon';

    const fb = await prisma.feedback.create({
      data: {
        vendorId: b.vendorId,
        author,
        ratingQuality: b.ratingQuality ?? null,
        ratingSpeed: b.ratingSpeed ?? null,
        ratingComm: b.ratingComm ?? null,
        text: b.text ?? '',
        tags: Array.isArray(b.tags) ? b.tags : [],
        link: b.link ?? null,
        isPrivate: !!b.isPrivate,
      },
    });
    return NextResponse.json({ ok: true, id: fb.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'error' }, { status: 500 });
  }
}
