import { prisma } from '@/lib/db';
import { computeAvgRating } from '@/lib/scoring';
import Filters from './components/Filters';
import VendorTable from './components/VendorTable';

type SP = Record<string, string | string[] | undefined>;
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, '');
const csv = (v?: string) => (v ?? '').split(',').map(s => s.trim()).filter(Boolean);

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
  const vendorsSel = csv(sp.vendors as string);
  const capsSel = csv(sp.caps as string);
  const ratingMin = Number(sp.ratingMin ?? 0);
  const tierLabel = (sp.tier as string) || '';
  const tierMax = Number(sp.tierMax ?? 0);
  const svcSel = csv(sp.svc as string); // NEW: ['WHITE_GLOVE','FTE',...]
  const sort = (sp.sort as string) || 'rating_desc';

  const where: any = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (capsSel.length) where.caps = { some: { cap: { slug: { in: capsSel } } } };
  if (svcSel.length) where.serviceOptions = { hasEvery: svcSel }; // require ALL selected options

  const vendors = await prisma.vendor.findMany({
    where,
    include: { costTiers: true, caps: { include: { cap: true } }, feedback: true },
    orderBy: { name: 'asc' },
  });

  let rows = vendors.map(v => {
    const tierCosts = v.costTiers
      .map(t => ({ label: t.tierLabel, cost: t.hourlyUsdMin ?? t.hourlyUsdMax ?? null }))
      .filter(t => t.label && t.cost != null)
      .sort((a, b) => {
        const na = Number(String(a.label).match(/\d+/)?.[0] ?? '1');
        const nb = Number(String(b.label).match(/\d+/)?.[0] ?? '1');
        return na - nb || String(a.label).localeCompare(String(b.label));
      });

    const minTierCost = tierCosts.length
      ? (tierCosts.map(t => t.cost as number).sort((a, b) => a - b)[0] as number)
      : null;

    const byLabel = new Map<string, number>();
    for (const t of tierCosts) byLabel.set(norm(String(t.label)), t.cost as number);
    const selectedTierCost = tierLabel ? byLabel.get(norm(tierLabel)) ?? null : null;

    const avgRating = computeAvgRating(v.feedback as any);

    return {
      id: v.id,
      name: v.name,
      platforms: v.platforms,
      capabilities: v.caps.map(c => c.cap),
      serviceOptions: v.serviceOptions, // NEW
      tierCosts,
      minTierCost,
      selectedTierCost,
      avgRating,
    };
  });

  if (vendorsSel.length) rows = rows.filter(r => vendorsSel.includes(r.name));
  if (ratingMin > 0) rows = rows.filter(r => (r.avgRating ?? 0) >= ratingMin - 1e-9);

  if (tierLabel) {
    rows = rows.filter(r => r.selectedTierCost != null);
    if (tierMax > 0) rows = rows.filter(r => (r.selectedTierCost ?? Infinity) <= tierMax);
  }

  const sorters: Record<string, (a: any, b: any) => number> = {
    rating_desc: (a, b) => (b.avgRating ?? -1) - (a.avgRating ?? -1),
    rating_asc:  (a, b) => (a.avgRating ?? 1e9) - (b.avgRating ?? 1e9),
    cost_sel_asc:  (a, b) => (a.selectedTierCost ?? 1e9) - (b.selectedTierCost ?? 1e9),
    cost_sel_desc: (a, b) => (b.selectedTierCost ?? -1) - (a.selectedTierCost ?? -1),
    cost_min_asc:  (a, b) => (a.minTierCost ?? 1e9) - (b.minTierCost ?? 1e9),
    name_asc: (a, b) => a.name.localeCompare(b.name),
  };
  rows.sort(sorters[sort] ?? sorters.rating_desc);

  return { rows, tierLabel };
}

export default async function Page({ searchParams }: { searchParams?: SP }) {
  const [{ rows, tierLabel }, opts] = await Promise.all([
    fetchVendors(searchParams ?? {}),
    fetchOptions(),
  ]);

  return (
    <main className="space-y-3">
      <Filters
        vendorOptions={opts.vendorOptions}
        capabilityOptions={opts.capabilityOptions}
      />
      <VendorTable rows={rows} tierLabel={tierLabel as string} />
    </main>
  );
}
