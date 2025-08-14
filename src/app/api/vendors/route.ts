import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('query') || '';
  const cap = searchParams.get('cap') || '';
  const maxCost = Number(searchParams.get('maxCost') || 0);

  const where:any = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (cap) where.caps = { some: { cap: { slug: { equals: cap } } } };

  const vendors = await prisma.vendor.findMany({
    where,
    include: { costTiers: true, caps: { include: { cap: true } }, feedback: true },
    orderBy: { name: 'asc' }
  });

  const data = vendors.map(v => {
    const minTierCost = v.costTiers
      .map(t=> t.hourlyUsdMin ?? t.hourlyUsdMax ?? 0)
      .filter(Boolean).sort((a,b)=>a-b)[0] || null;

    const ratings:number[] = [];
    v.feedback.forEach(f=>{
      if(f.ratingQuality!=null)ratings.push(f.ratingQuality);
      if(f.ratingSpeed!=null)ratings.push(f.ratingSpeed);
      if(f.ratingComm!=null)ratings.push(f.ratingComm);
    });
    const avgRating = ratings.length ? Math.round((ratings.reduce((a,b)=>a+b,0)/ratings.length)*10)/10 : null;

    return {
      id: v.id,
      name: v.name,
      platforms: v.platforms,
      industries: v.industries,
      serviceOptions: v.serviceOptions, // NEW
      capabilities: v.caps.map(c=>c.cap),
      minTierCost,
      avgRating
    };
  }).filter(row => maxCost ? ((row.minTierCost ?? Infinity) <= maxCost) : true)
    .sort((a,b)=> (b.avgRating||-1)-(a.avgRating||-1) || (a.minTierCost||1e9)-(b.minTierCost||1e9));

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    overview,
    platforms = [],
    industries = [],
    serviceOptions = [], // NEW
    costTiers = [],
    capabilities = []
  } = body || {};

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const vendor = await prisma.vendor.create({
    data: { name, overview, platforms, industries, serviceOptions }
  });

  if (Array.isArray(costTiers) && costTiers.length) {
    await prisma.costTier.createMany({ data: costTiers.map((t:any)=> ({ ...t, vendorId: vendor.id })) });
  }
  if (Array.isArray(capabilities) && capabilities.length) {
    for (const c of capabilities) {
      const cap = await prisma.capability.upsert({
        where: { slug: c.slug },
        create: { slug: c.slug, name: c.name ?? c.slug },
        update: {}
      });
      await prisma.vendorCapability.create({ data: { vendorId: vendor.id, capId: cap.id } });
    }
  }
  return NextResponse.json({ ok: true, id: vendor.id });
}
