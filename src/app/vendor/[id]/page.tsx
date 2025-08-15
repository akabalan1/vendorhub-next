// src/app/vendor/[id]/page.tsx
import { prisma } from '@/lib/db';
import { computeAvgRating } from '@/lib/scoring';
import Link from 'next/link';
import React from 'react';
import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import AddFeedback from './AddFeedback.client';

function fmtSvc(arr?: string[] | null) {
  if (!Array.isArray(arr) || !arr.length) return '—';
  return arr
    .map((s) =>
      s === 'WHITE_GLOVE' ? 'White Glove' :
      s === 'CROWD_SOURCED' ? 'Crowd Sourced' :
      s === 'FTE' ? 'FTE' : s
    )
    .join(', ');
}

function money(n?: number | null) {
  if (n == null) return '—';
  return `$${Number(n).toFixed(0)}/hr`;
}

export default async function VendorPage({ params }: { params: { id: string } }) {
  // 👇 Require login before showing vendor details
  const session = await verifySession();
  if (!session?.email) {
    redirect(`/signin?callbackUrl=/vendor/${params.id}`);
  }

  const v = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      costTiers: { orderBy: { tierLabel: 'asc' } },
      caps: { include: { cap: true } },
      feedback: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!v) {
    return (
      <main className="text-gray-500">
        Vendor not found. <Link className="underline" href="/">Back</Link>
      </main>
    ) as any;
  }

  const avg = computeAvgRating(v.feedback as any);

  return (
    <main className="space-y-5">
      {/* Header card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{v.name}</h2>
            {v.overview ? (
              <p className="mt-1 max-w-3xl text-gray-700">{v.overview}</p>
            ) : null}
          </div>
          <div className="text-right">
            {avg ? (
              <div className="text-sm">
                <span className="font-semibold">{avg}</span>★
              </div>
            ) : (
              <div className="text-sm text-gray-400">No score</div>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">Service Options</div>
            <div className="mt-1 text-sm text-gray-800">
              {fmtSvc((v as any).serviceOptions as string[])}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">Rater Training</div>
            <div className="mt-1 text-sm text-gray-800">
              {(v as any).raterTrainingSpeed ?? '—'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">Website</div>
            <div className="mt-1 text-sm">
              {v.website ? (
                <a className="text-blue-600 hover:underline" href={v.website} target="_blank">
                  {v.website}
                </a>
              ) : (
                <span className="text-gray-800">—</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">Country</div>
            <div className="mt-1 text-sm text-gray-800">{v.country ?? '—'}</div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">Regions</div>
            <div className="mt-1 text-sm text-gray-800">
              {v.regions?.length ? v.regions.join(', ') : '—'}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-gray-500">Platforms</div>
            <div className="mt-1 text-sm text-gray-800">
              {v.platforms?.length ? v.platforms.join(', ') : '—'}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs font-semibold uppercase text-gray-500">Capabilities</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {v.caps.length ? (
                v.caps.map((c) => (
                  <span
                    key={c.capId}
                    className="rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs text-gray-800"
                  >
                    {c.cap.slug}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-800">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cost tiers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-2 text-base font-semibold">Cost Tiers</h3>
        {v.costTiers.length ? (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Min</th>
                  <th className="px-3 py-2">Max</th>
                  <th className="px-3 py-2">Currency</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {v.costTiers.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{t.tierLabel}</td>
                    <td className="px-3 py-2">{money(t.hourlyUsdMin)}</td>
                    <td className="px-3 py-2">{money(t.hourlyUsdMax)}</td>
                    <td className="px-3 py-2">{t.currency}</td>
                    <td className="px-3 py-2">{t.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No cost tiers recorded.</div>
        )}
      </div>

      {/* Feedback */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <
