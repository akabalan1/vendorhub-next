import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b?.vendorId) return NextResponse.json({ error: 'vendorId required' }, { status: 400 });
  const fb = await prisma.feedback.create({ data: {
    vendorId: b.vendorId,
    author: b.author ?? 'anon',
    ratingQuality: b.ratingQuality ?? null,
    ratingSpeed: b.ratingSpeed ?? null,
    ratingComm: b.ratingComm ?? null,
    text: b.text ?? '',
    tags: Array.isArray(b.tags) ? b.tags : [],
    link: b.link ?? null,
    isPrivate: !!b.isPrivate
  }});
  return NextResponse.json({ ok: true, id: fb.id });
}
