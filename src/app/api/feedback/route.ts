import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'sign-in required' }, { status: 401 });
  }

  const b = await req.json();
  if (!b?.vendorId) return NextResponse.json({ error: 'vendorId required' }, { status: 400 });

  const displayName =
    b.author?.trim() ||
    session.user.name ||
    session.user.email.split('@')[0];

  const fb = await prisma.feedback.create({
    data: {
      vendorId: b.vendorId,
      author: displayName,
      ratingQuality: b.ratingQuality ?? null,
      ratingSpeed: b.ratingSpeed ?? null,
      ratingComm: b.ratingComm ?? null,
      text: b.text ?? '',
      tags: Array.isArray(b.tags) ? b.tags : [],
      link: b.link ?? null,
      isPrivate: !!b.isPrivate
    }
  });

  return NextResponse.json({ ok: true, id: fb.id, createdAt: fb.createdAt });
}
