// src/app/api/vendors/[id]/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession } from '@/lib/session';

// GET /api/vendors/:id  -> full vendor details
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const v = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: {
        costTiers: { orderBy: { tierLabel: 'asc' } },
        caps: { include: { cap: true } },
        feedback: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!v) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    return NextResponse.json({ data: v });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'error' }, { status: 500 });
  }
}

/**
 * If you later need to allow edits, you can uncomment PUT and guard by admin:
 *
 * export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
 *   const session = await verifySession();
 *   if (!session?.user?.isAdmin) {
 *     return NextResponse.json({ error: 'forbidden' }, { status: 403 });
 *   }
 *   const body = await req.json();
 *   const updated = await prisma.vendor.update({ where: { id: params.id }, data: body });
 *   return NextResponse.json({ ok: true, data: updated });
 * }
 */
