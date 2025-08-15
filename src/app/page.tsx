// src/app/page.tsx
import { prisma } from '@/lib/db';
import { computeAvgRating } from '@/lib/scoring';
import Link from 'next/link';
import React from 'react';

function money(n?: number | null) {
  if (n == null) return '—';
  return `$${Number(n).toFixed(0)}/hr`;
}

export default async function Home() {
  // fetch vendors (exactly like you had before)
  const vendors = await prisma.vendor.findMany({
    include: {
      costTiers: true,
      caps: { include: { cap: true } },
      feedback: true,
    },
    orderBy: { name: 'asc' },
  });

  const rows = vendors.map((v) => {
    const minTierCost =
      v.costTiers
        .map((t) => t.hourlyUsdMin ?? t.hourlyUsdMax ?? 0)
        .filter(Boolean)
        .sort((a, b) => a - b)[0] || null;

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
    };
  });

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">VendorHub</h1>

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
