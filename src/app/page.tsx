import { prisma } from '@/lib/db';
import { computeAvgRating } from '@/lib/scoring';
import Filters from './components/Filters';
import VendorTable from './components/VendorTable';

type SP = Record<string, string | string[] | undefined>;

function csvToArray(v?: string) {
  return (v ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function matchAny<T>(vals: T[] | undefined, selected: T[] | undefined) {
  if (!selected?.length) return true;
  return vals?.some(v => selected.includes(v as any)) ?? false;
}

async function fetchOptions() {
  const [vendors, caps] = await Promise.all([
    prisma.vendor.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.capability.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  return {
    vendorOptions: vendors.map(v => ({ value: v.name, label: v.name })),
    capabilityOptions: caps.map(c => ({ value: c.slug, label: c.name })),
  };
}

async function fetchVendors(sp: SP) {
  const q = (sp.q as string) || '';
  const vendorsSel = csvToArray(sp.vendors as string);
  const capsSel = csvToArray(sp.caps as string);
  const ratingsSel = csvToArray(sp.ratings as string).map(n => Number(n));
  const tiersSel = csvToArray(sp.tiers as string); // like ["<=50","<=75"]
  const sort = (sp.sort as string) || 'rating_desc';

  // Base query (search + cap filter done in SQL for efficiency)
  const where: any = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (capsSel.length) where.caps = { some: { cap: { slug: { in: capsSel } } } };

  const vendors = await prisma.vendor.findMany({
    where,
    include: { costTiers: true, caps: { include: { cap: true } }, feedback: true },
    orderBy: { name: 'asc' },
  });

  // derive fields
  let rows = vendors.map(v => {
    const minTierCost =
      v.costTiers
        .map(t => t.hourlyUsdMin ?? t.hourlyUsdMax ?? 0)
        .filter(Boolean)
        .sort((a, b) => a - b)[0] || null;
    const avgRating = computeAvgRating(v.feedback as any);
    return {
      id: v.id,
      name: v.name,
      industries: v.industries,
      platforms: v.platforms,
      capabilities: v.caps.map(c => c.cap),
      minTierCost,
      avgRating,
    };
  });

  // filter by vendor names (client-selected)
  if (vendorsSel.length) rows = rows.filter(r => vendorsSel.includes(r.name));

  // filter by ratings (treat as "equals" to chosen whole-star values)
  if (ratingsSel.length)
    rows = rows.filter(r =>
      r.avgRating == null ? false : ratingsSel.includes(Math.round(r.avgRating))
    );

  // filter by tier cost thresholds (union)
  if (tiersSel.length) {
    const passes = (r: any) =>
      r.minTierCost == null
        ? false
        : tiersSel.some(token => {
            const n = Number(token.replace('<=', ''));
            return r.minTierCost <= n;
          });
    rows = rows.filter(passes);
  }

  // sorting
  const sorters: Record<string, (a: any, b: any) => number> = {
    rating_desc: (a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1),
    rating_asc: (a, b) => (a.avgRating ?? 1e9) - (b.avgRating ?? 1e9),
    cost_asc: (a, b) => (a.minTierCost ?? 1e9) - (b.minTierCost ?? 1e9),
    cost_desc: (a, b) => (b.minTierCost ?? -1) - (a.minTierCost ?? -1),
    name_asc: (a, b) => a.name.localeCompare(b.name),
  };
  rows.sort(sorters[sort] ?? sorters.rating_desc);

  return rows;
}

export default async function Page({ searchParams }: { searchParams?: SP }) {
  const [rows, opts] = await Promise.all([fetchVendors(searchParams ?? {}), fetchOptions()]);

  return (
    <main className="space-y-3">
      <Filters vendorOptions={opts.vendorOptions} capabilityOptions={opts.capabilityOptions} />
      <VendorTable rows={rows} />
    </main>
  );
}
