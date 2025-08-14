export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const v = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: { costTiers: true, caps: { include: { cap: true } }, feedback: true }
  });
  if (!v) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ data: v });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const isAdmin = !!(session?.user && (session.user as any).isAdmin);
  if (!isAdmin) return NextResponse.json({ error: 'admin only' }, { status: 403 });

  const body = await req.json();
  const v = await prisma.vendor.update({ where: { id: params.id }, data: body });
  return NextResponse.json({ data: v });
}
