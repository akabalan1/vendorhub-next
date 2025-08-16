// src/lib/vendorFilters.ts
import { computeAvgRating } from "./scoring";

export interface VendorFilter {
  q: string;
  vendorIds: string[];
  capSlugs: string[];
  svcOpts: string[];
  ratingMin?: number;
  tierLabel: string;
  tierMax?: number;
  sort: string;
}

export function parseVendorFilters(
  searchParams: Record<string, string | string[] | undefined>
): VendorFilter {
  const parseList = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v.join(",") : v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const vendorIds = parseList(searchParams?.vendors);
  const capSlugs = parseList(searchParams?.caps);
  const svcOpts = parseList(searchParams?.svc);
  const ratingMin = searchParams?.ratingMin
    ? Number(searchParams.ratingMin)
    : undefined;
  const tierLabel =
    typeof searchParams?.tier === "string" ? searchParams.tier : "";
  const tierMax = searchParams?.tierMax
    ? Number(searchParams.tierMax)
    : undefined;
  const sort =
    typeof searchParams?.sort === "string" ? searchParams.sort : "rating_desc";

  return {
    q,
    vendorIds,
    capSlugs,
    svcOpts,
    ratingMin,
    tierLabel,
    tierMax,
    sort,
  };
}

export function buildVendorWhereOrder(filters: VendorFilter) {
  const { q, vendorIds, capSlugs, svcOpts, tierLabel, tierMax, sort } = filters;
  const where: any = { AND: [] };
  if (q) {
    where.AND.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { overview: { contains: q, mode: "insensitive" } },
        { costTiers: { some: { notes: { contains: q, mode: "insensitive" } } } },
      ],
    });
  }
  if (vendorIds.length) where.AND.push({ id: { in: vendorIds } });
  if (capSlugs.length)
    where.AND.push({ caps: { some: { cap: { slug: { in: capSlugs } } } } });
  if (svcOpts.length)
    where.AND.push({ serviceOptions: { hasSome: svcOpts } });
  if (tierLabel) {
    const tierCond: any = { tierLabel };
    if (tierMax != null)
      tierCond.OR = [
        { hourlyUsdMin: { lte: tierMax } },
        { hourlyUsdMax: { lte: tierMax } },
      ];
    where.AND.push({ costTiers: { some: tierCond } });
  } else if (tierMax != null) {
    where.AND.push({
      costTiers: {
        some: {
          OR: [
            { hourlyUsdMin: { lte: tierMax } },
            { hourlyUsdMax: { lte: tierMax } },
          ],
        },
      },
    });
  }
  if (!where.AND.length) delete where.AND;

  let orderBy: any = undefined;
  if (sort === "name_asc") orderBy = { name: "asc" };

  return { where, orderBy };
}

export interface VendorRow {
  id: string;
  name: string;
  overview: string | null;
  serviceOptions?: string[];
  costTiers: any[];
  capabilities: string;
  capSlugs: string[];
  minTierCost: number | null;
  avgRating: number | null;
  selectedTierCost: number | null;
}

export function processVendors(
  vendors: any[],
  filters: VendorFilter
): VendorRow[] {
  const { vendorIds, capSlugs, svcOpts, ratingMin, tierLabel, tierMax, sort } =
    filters;
  let rows: VendorRow[] = vendors.map((v: any) => {
    const costTiers = v.costTiers
      .slice()
      .sort((a: any, b: any) => a.tierLabel.localeCompare(b.tierLabel));
    const minTierCost =
      costTiers
        .map((t: any) => t.hourlyUsdMin ?? t.hourlyUsdMax ?? 0)
        .filter(Boolean)
        .sort((a: number, b: number) => a - b)[0] || null;
    const selectedTier = tierLabel
      ? costTiers.find((t: any) => t.tierLabel === tierLabel)
      : null;
    const selectedTierCost = selectedTier
      ? selectedTier.hourlyUsdMin ?? selectedTier.hourlyUsdMax ?? null
      : null;
    const avgRating = computeAvgRating(v.feedback as any);
    const capList = v.caps.map((c: any) => c.cap.slug);
    return {
      id: v.id,
      name: v.name,
      overview: v.overview ?? "—",
      serviceOptions: (v as any).serviceOptions as string[] | undefined,
      costTiers,
      capabilities: capList.join(", ") || "—",
      capSlugs: capList,
      minTierCost,
      avgRating,
      selectedTierCost,
    };
  });

  if (vendorIds.length) rows = rows.filter((r) => vendorIds.includes(r.id));
  if (capSlugs.length)
    rows = rows.filter((r) => r.capSlugs.some((s) => capSlugs.includes(s)));
  if (svcOpts.length)
    rows = rows.filter((r) =>
      (r.serviceOptions ?? []).some((s) => svcOpts.includes(s))
    );
  if (tierLabel)
    rows = rows.filter((r) =>
      r.costTiers.some((t: any) => t.tierLabel === tierLabel)
    );

  rows = rows.filter((r) => {
    if (ratingMin != null && (r.avgRating ?? 0) < ratingMin) return false;
    if (tierMax != null) {
      const cost = tierLabel ? r.selectedTierCost : r.minTierCost;
      if (cost == null || cost > tierMax) return false;
    }
    return true;
  });

  rows.sort((a, b) => {
    switch (sort) {
      case "rating_asc":
        return (a.avgRating ?? 0) - (b.avgRating ?? 0);
      case "cost_sel_asc":
        return (
          (a.selectedTierCost ?? Infinity) - (b.selectedTierCost ?? Infinity)
        );
      case "cost_sel_desc":
        return (b.selectedTierCost ?? 0) - (a.selectedTierCost ?? 0);
      case "cost_min_asc":
        return (a.minTierCost ?? Infinity) - (b.minTierCost ?? Infinity);
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "rating_desc":
      default:
        return (b.avgRating ?? 0) - (a.avgRating ?? 0);
    }
  });

  return rows;
}

