import { prisma } from '@/lib/db';
import { computeAvgRating } from '@/lib/scoring';
import Filters from './components/Filters';
import { VendorCard } from './components/VendorCard';

async function fetchVendors({ q, cap, maxCost }: { q?: string, cap?: string, maxCost?: string }){
  const where:any = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (cap) where.caps = { some: { cap: { slug: { equals: cap } } } };
  const vendors = await prisma.vendor.findMany({
    where,
    include: { costTiers: true, caps: { include: { cap: true } }, feedback: true },
    orderBy: { name: 'asc' }
  });
  const rows = vendors.map(v=>{
    const minTierCost = v.costTiers.map(t=>t.hourlyUsdMin ?? t.hourlyUsdMax ?? 0).filter(Boolean).sort((a,b)=>a-b)[0] || null;
    const avgRating = computeAvgRating(v.feedback as any);
    return { id: v.id, name: v.name, industries: v.industries, platforms: v.platforms, capabilities: v.caps.map(c=>c.cap), minTierCost, avgRating };
  });
  const maxC = Number(maxCost||0);
  const filtered = maxC ? rows.filter(r => (r.minTierCost ?? Infinity) <= maxC) : rows;
  filtered.sort((a,b)=> (b.avgRating||-1)-(a.avgRating||-1) || (a.minTierCost||1e9)-(b.minTierCost||1e9));
  return filtered;
}

export default async function Page({ searchParams }: { searchParams?: Record<string,string> }){
  const data = await fetchVendors({ q: searchParams?.q, cap: searchParams?.cap, maxCost: searchParams?.maxCost });
  return (
    <main>
      {/* Filters */}
      {/* Basic client filter controller emits querystring; for SSR simplicity we keep server fetch */}
      <Filters onChange={(f)=>{ const url = new URL(window.location.href); Object.entries(f).forEach(([k,v])=>{ if(v) url.searchParams.set(k,v); else url.searchParams.delete(k); }); window.history.replaceState({},'',url.toString()); }} />

      {/* Grid */}
     <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {data.map((v)=> <VendorCard key={v.id} v={v} />)}
        {!data.length && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">No vendors match your filters.</div>
        )}
      </div>
    </main>
  );
}
