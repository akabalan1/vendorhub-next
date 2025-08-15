// src/app/api/feedback/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// ---- Validation schema (coerce numbers coming from JSON/form)
const FeedbackSchema = z.object({
  vendorId: z.string().min(1, 'vendorId required'),
  author: z.string().optional().default('anon'),
  ratingQuality: z.coerce.number().int().min(1).max(5).optional().nullable(),
  ratingSpeed: z.coerce.number().int().min(1).max(5).optional().nullable(),
  ratingComm: z.coerce.number().int().min(1).max(5).optional().nullable(),
  text: z.string().max(2000).optional().default(''),
  tags: z.array(z.string().trim()).optional().default([]),
  link: z.string().url().optional().nullable(),
  isPrivate: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  try {
    // Parse & validate body
    const raw = await req.json();
    const b = FeedbackSchema.parse(raw);

    // Ensure vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: b.vendorId },
      select: { id: true },
    });
    if (!vendor) {
      return NextResponse.json({ error: 'vendor not found' }, { status: 404 });
    }

    const fb = await prisma.feedback.create({
      data: {
        vendorId: b.vendorId,
        author: b.author?.trim() || 'anon',
        ratingQuality: b.ratingQuality ?? null,
        ratingSpeed: b.ratingSpeed ?? null,
        ratingComm: b.ratingComm ?? null,
        text: b.text?.trim() ?? '',
        tags: (b.tags ?? []).filter(Boolean),
        link: b.link ?? null,
        isPrivate: !!b.isPrivate,
      },
    });

    return NextResponse.json({ ok: true, id: fb.id });
  } catch (err: any) {
    // zod errors -> 400; everything else -> 500
    if (err?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'invalid_request', issues: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err?.message || 'server_error' },
      { status: 500 }
    );
  }
}
