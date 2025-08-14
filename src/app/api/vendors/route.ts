// src/app/api/vendors/route.ts

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // 🔐 Require an authenticated session for listing vendors
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('query') ?? '';
  const cap = searchParams.get('cap') ?? '';
  const maxCost = Number(searchParams.get('maxCost') ?? 0);
  const sort = (searchParams.get('sort') ?? '').toString();

  const where: any = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (cap) where.caps = { some: { cap: { slug: { equals: cap } } } };

  const vendors = await prisma.vendor.findMany({
    where,
    include: {
      costTiers: true,
      caps: { include: { cap: true } },
      feedback: true,
    },
    orderBy: { name: 'asc' },
  });

  const data = vendors
    .map((v) => {
      const tiers = v.costTiers
        .slice()
        .sort((a, b) => a.tierLabel.localeCompare(b.tierLabel))
        .map((t) => ({
          id: t.id,
          tierLabel: t.tierLabel,
          hourlyUsdMin: t.hourlyUsdMin,
          hourlyUsdMax: t.hourlyUsdMax,
          currency: t.currency,
          notes: t.notes,
        }));

      const minTierCost =
        v.costTiers
          .map((t) => t.hourlyUsdMin ?? t.hourlyUsdMax ?? 0)
          .filter(Boolean)
          .sort((a, b) => a - b)[0] || null;

      const ratings: number[] = [];
      for (const f of v.feedback) {
        if (f.ratingQuality != null) ratings.push(f.ratingQuality);
        if (f.ratingSpeed != null) ratings.push(f.ratingSpeed);
        if (f.ratingComm != null) ratings.push(f.ratingComm);
      }
      const avgRating = ratings.length
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

      return {
        id: v.id,
        name: v.name,
        overview: v.overview,
        raterTrainingSpeed: (v as any).raterTrainingSpeed ?? null,
        platforms: v.platforms,
        industries: v.industries,
        serviceOptions: v.serviceOptions,
        capabilities: v.caps.map((c) => c.cap),
        costTiers: tiers,
        minTierCost,
        avgRating,
      };
    })
    .filter((row) => (maxCost ? (row.minTierCost ?? Infinity) <= maxCost : true));

  // optional sorting via ?sort=
  data.sort((a, b) => {
    switch (sort) {
      case 'rating_asc':
        return (a.avgRating ?? Infinity) - (b.avgRating ?? Infinity);
      case 'rating_desc':
        return (b.avgRating ?? -1) - (a.avgRating ?? -1);
      case 'cost_min_asc':
        return (a.minTierCost ?? 1e9) - (b.minTierCost ?? 1e9);
      case 'name_asc':
        return a.name.localeCompare(b.name);
      default:
        return (
          (b.avgRating ?? -1) - (a.avgRating ?? -1) ||
          (a.minTierCost ?? 1e9) - (b.minTierCost ?? 1e9)
        );
    }
  });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  // 🔐 Admin-only create
  const session = await auth();
  const isAdmin = !!(session?.user && (session.user as any).isAdmin);
  if (!isAdmin) {
    return NextResponse.json({ error: 'admin only' }, { status: 403 });
  }

  const body = await req.json();
  const {
    name,
    overview,
    platforms = [],
    industries = [],
    serviceOptions = [],
    raterTrainingSpeed,
    costTiers = [],
    capabilities = [],
  } = body || {};

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const vendor = await prisma.vendor.create({
    data: { name, overview, platforms, industries, serviceOptions, raterTrainingSpeed },
  });

  if (Array.isArray(costTiers) && costTiers.length) {
    await prisma.costTier.createMany({
      data: costTiers.map((t: any) => ({
        vendorId: vendor.id,
        tierLabel: t.tierLabel,
        hourlyUsdMin: t.hourlyUsdMin ?? null,
        hourlyUsdMax: t.hourlyUsdMax ?? null,
        currency: t.currency ?? 'USD',
        notes: t.notes ?? null,
      })),
    });
  }

  if (Array.isArray(capabilities) && capabilities.length) {
    for (const c of capabilities) {
      const cap = await prisma.capability.upsert({
        where: { slug: c.slug },
        create: { slug: c.slug, name: c.name ?? c.slug },
        update: {},
      });
      await prisma.vendorCapability.create({
        data: { vendorId: vendor.id, capId: cap.id },
      });
    }
  }

  return NextResponse.json({ ok: true, id: vendor.id });
}
