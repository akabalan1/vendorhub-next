// src/app/api/vendors/[id]/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require login for this API
    const session = await getSession();
    if (!session?.email) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const v = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: {
        costTiers: { orderBy: { tierLabel: 'asc' } },
        caps: { include: { cap: true } },
        feedback: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!v) return NextResponse.json({ error: 'not found' }, { status: 404 });

    return NextResponse.json({ data: v });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'error' }, { status: 500 });
  }
}
