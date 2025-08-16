// src/app/api/vendors/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  parseVendorFilters,
  buildVendorWhereOrder,
  processVendors,
} from "@/lib/vendorFilters";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const params: Record<string, string | string[] | undefined> = {};
  searchParams.forEach((value, key) => {
    const current = params[key];
    if (current === undefined) params[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else params[key] = [current, value];
  });

  const filters = parseVendorFilters(params);
  const { where, orderBy } = buildVendorWhereOrder(filters);

  const vendors = await prisma.vendor.findMany({
    where,
    include: {
      costTiers: true,
      caps: { include: { cap: true } },
      feedback: true,
    },
    orderBy,
  });

  const rows = processVendors(vendors, filters);

  const data = rows.map((r) => {
    const v = vendors.find((v) => v.id === r.id)!;
    return {
      id: r.id,
      name: r.name,
      overview: v.overview,
      raterTrainingSpeed: (v as any).raterTrainingSpeed ?? null,
      platforms: v.platforms,
      industries: v.industries,
      serviceOptions: r.serviceOptions,
      capabilities: v.caps.map((c) => c.cap),
      costTiers: r.costTiers,
      minTierCost: r.minTierCost,
      avgRating: r.avgRating,
    };
  });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "admin only" }, { status: 403 });
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

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

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
        currency: t.currency ?? "USD",
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
