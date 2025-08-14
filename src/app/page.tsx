import { prisma } from '@/lib/db';
import { computeAvgRating } from '@/lib/scoring';
import Filters from './components/Filters';
import VendorTable from './components/VendorTable';

type Row = {
  id: string;
  name: string;
  overview?: string | null;
  raterTrainingSpeed?: string | null;
  capabilities: any[];
  serviceOptions: string[];
  tierCosts: { label: string; cost: number }[];
  selectedTierCost?: number | null;
  minTierCost?: number | null;
  avgRating: number | null;
};

function uniq<T>(arr: T[]) { return Array.from(new Set(arr)); }

async function getFilterOptions() {
  const [vendors, caps, tiers] = await Promise.all([
    prisma.vendor.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.capability.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.costTier.findMany({ select: { tierLabel: true } }),
  ]);

  return {
    vendorOptions: vendors.map(v => ({ value: v.name, label: v.name })),
    capabilityOptions: caps.map(c => ({ value: c.slug, label: c.name })),
    tierLabels: uniq(tiers.map(t => t.tierLabel).filter(Boolean)) as string[],
  };
}

async function fetchRows(params: Record<string, string | undefined>): Promise<Row[]> {
  const q = params.q?.trim();
  const vendors = (params.vendors ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const caps = (params.caps ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const ratingMin = params.ratingMin ? Number(params.ratingMin) : null;
  const tierLabel = params.tier?.trim() || '';
  const tierMax = params.tierMax ? Number(params.tierMax) : null;
  const svc = (params.svc ?? '').split(',').map(s => s.trim()).filter(Boolean) as any[];
  const sort = params.sort ?? 'rating_desc';

  // Base where for Prisma
  const where: any = {};
  if (q) {
    // Search name or overview
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { overview: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (vendors.length) {
    where.name = { in: vendors };
  }
  if (caps.length) {
    where.caps = { some: { cap: { slug: { in: caps } } } };
  }
  if (svc.length) {
    // Postgres enum[] supports hasSome in Prisma
    where.serviceOptions = { hasSome: svc };
  }

  const list = await prisma.vendor.findMany({
    where,
    include: {
      costTiers: true,
      caps: { include: { cap: true } },
      feedback: true,
    },
    orderBy: { name: 'asc' },
  });

  // Shape into table rows
  const rows: Row[] = list.map(v => {
    const tierCosts = v.costTiers
      .map(t => ({ label: t.tierLabel, cost: Number(t.hourlyUsdMin ?? t.hourlyUsdMax ?? NaN) }))
      .filter(tc => !!tc.label && Number.isFinite(tc.cost));

    const selectedTierCost =
      tierLabel ? (tierCosts.find(t => t.label === tierLabel)?.cost ?? null) : null;

    const minTierCost = tierCosts.length
      ? Math.min(...tierCosts.map(t => t.cost))
      : null;

    const avgRating = computeAvgRating(v.feedback as any);

    return {
      id: v.id,
      name: v.name,
      overview: v.overview,
      raterTrainingSpeed: (v as any).raterTrainingSpeed ?? null,
      capabilities: v.caps.map(c => c.cap),
      serviceOptions: (v as any).serviceOptions ?? [],
      tierCosts,
      selectedTierCost,
      minTierCost,
      avgRating,
    };
  });

  // Rating threshold
  const ratingFiltered = ratingMin != null
    ? rows.filter(r => (r.avgRating ?? -1) >= ratingMin)
    : rows;

  // Tier max filter
  const priceFiltered = tierMax != null && !Number.isNaN(tierMax)
    ? ratingFiltered.filter(r => {
        const val = tierLabel ? r.selectedTierCost : r.minTierCost;
        return val != null && val <= tierMax;
      })
    : ratingFiltered;

  // Sorting
  const sorted = [...priceFiltered].sort((a, b) => {
    switch (sort) {
      case 'rating_asc':
        return (a.avgRating ?? 1e9) - (b.avgRating ?? 1e9);
      case 'cost_sel_asc':
        return (a.selectedTierCost ?? 1e9) - (b.selectedTierCost ?? 1e9);
      case 'cost_sel_desc':
        return (b.selectedTierCost ?? -1) - (a.selectedTierCost ?? -1);
      case 'cost_min_asc':
        return (a.minTierCost ?? 1e9) - (b.minTierCost ?? 1e9);
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'rating_desc':
      default:
        return (b.avgRating ?? -1) - (a.avgRating ?? -1)
          || (a.minTierCost ?? 1e9) - (b.minTierCost ?? 1e9);
    }
  });

  return sorted;
}

export default async function Page({
  searchParams,
}: { searchParams?: Record<string, string> }) {
  const [{ vendorOptions, capabilityOptions, tierLabels }, rows] = await Promise.all([
    getFilterOptions(),
    fetchRows(searchParams ?? {}),
  ]);

  return (
    <main className="space-y-3">
      <Filters
        vendorOptions={vendorOptions}
        capabilityOptions={capabilityOptions}
        tierLabels={tierLabels.length ? tierLabels : ['Tier 1', 'Tier 2', 'Tier 3']}
      />
      <VendorTable rows={rows} tierLabel={searchParams?.tier} />
    </main>
  );
}
