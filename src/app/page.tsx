// src/app/page.tsx
import { prisma } from '@/lib/db';
import { computeAvgRating } from '@/lib/scoring';
import Link from 'next/link';
import React from 'react';
import Filters from './components/Filters';
import SignOutButton from './components/SignOutButton';

function money(n?: number | null) {
  if (n == null) return '—';
  return `$${Number(n).toFixed(0)}/hr`;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const parseList = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v.join(',') : v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const q = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const vendorIds = parseList(searchParams?.vendors);
  const capSlugs = parseList(searchParams?.caps);
  const svcOpts = parseList(searchParams?.svc);
  const ratingMin = searchParams?.ratingMin
    ? Number(searchParams.ratingMin)
    : undefined;
  const tierLabel = typeof searchParams?.tier === 'string' ? searchParams.tier : '';
  const tierMax = searchParams?.tierMax
    ? Number(searchParams.tierMax)
    : undefined;
  const sort =
    typeof searchParams?.sort === 'string' ? searchParams.sort : 'rating_desc';

  const where: any = { AND: [] };
  if (q) {
    where.AND.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { overview: { contains: q, mode: 'insensitive' } },
        { costTiers: { some: { notes: { contains: q, mode: 'insensitive' } } } },
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
  if (sort === 'name_asc') orderBy = { name: 'asc' };

  const [vendors, vendorOpts, capOpts] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        costTiers: true,
        caps: { include: { cap: true } },
        feedback: true,
      },
      orderBy,
    }),
    prisma.vendor.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.capability.findMany({
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const vendorOptions = vendorOpts.map((v) => ({ value: v.id, label: v.name }));
  const capabilityOptions = capOpts.map((c) => ({ value: c.slug, label: c.name }));

  let rows = vendors.map((v) => {
    const minTierCost =
      v.costTiers
        .map((t) => t.hourlyUsdMin ?? t.hourlyUsdMax ?? 0)
        .filter(Boolean)
        .sort((a, b) => a - b)[0] || null;

    const selectedTier = tierLabel
      ? v.costTiers.find((t) => t.tierLabel === tierLabel)
      : null;
    const selectedTierCost = selectedTier
      ? selectedTier.hourlyUsdMin ?? selectedTier.hourlyUsdMax ?? null
      : null;

    const avgRating = computeAvgRating(v.feedback as any);

    return {
      id: v.id,
      name: v.name,
      overview: v.overview ?? '—',
      capabilities: v.caps.map((c) => c.cap.slug).join(', ') || '—',
      serviceOptions: (v as any).serviceOptions as string[] | undefined,
      costTiers: v.costTiers,
      minTierCost,
      avgRating,
      selectedTierCost,
    };
  });

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
      case 'rating_asc':
        return (a.avgRating ?? 0) - (b.avgRating ?? 0);
      case 'cost_sel_asc':
        return (a.selectedTierCost ?? Infinity) - (b.selectedTierCost ?? Infinity);
      case 'cost_sel_desc':
        return (b.selectedTierCost ?? 0) - (a.selectedTierCost ?? 0);
      case 'cost_min_asc':
        return (a.minTierCost ?? Infinity) - (b.minTierCost ?? Infinity);
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'rating_desc':
      default:
        return (b.avgRating ?? 0) - (a.avgRating ?? 0);
    }
  });

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">VendorHub</h1>
        <SignOutButton />
      </div>

      <Filters
        vendorOptions={vendorOptions}
        capabilityOptions={capabilityOptions}
      />

      {/* Simple table (same look you had) */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Vendor</th>
              <th className="px-3 py-2">Capabilities</th>
              <th className="px-3 py-2">Service Options</th>
              <th className="px-3 py-2">Cost (all tiers)</th>
              <th className="px-3 py-2">Avg ★</th>
              <th className="px-3 py-2">Open</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.capabilities}</td>
                <td className="px-3 py-2">
                  {(r.serviceOptions ?? []).length
                    ? (r.serviceOptions ?? [])
                        .map((s) =>
                          s === 'WHITE_GLOVE'
                            ? 'White Glove'
                            : s === 'CROWD_SOURCED'
                            ? 'Crowd Sourced'
                            : s
                        )
                        .join(', ')
                    : '—'}
                </td>
                <td className="px-3 py-2">
                  {r.costTiers.length ? (
                    <div className="space-y-0.5">
                      {r.costTiers.map((t) => (
                        <div key={t.id}>
                          <span className="text-gray-500 mr-1">{t.tierLabel}:</span>
                          <span>{money(t.hourlyUsdMin)}</span>
                          {t.hourlyUsdMax != null ? (
                            <>
                              <span className="mx-1">–</span>
                              <span>{money(t.hourlyUsdMax)}</span>
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2">{r.avgRating ?? '—'}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/vendor/${r.id}`}
                    className="rounded-xl border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                  No vendors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
