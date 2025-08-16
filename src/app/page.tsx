// src/app/page.tsx
import { prisma } from '@/lib/db';
import Link from 'next/link';
import React from 'react';
import Filters from './components/Filters';
import {
  parseVendorFilters,
  buildVendorWhereOrder,
  processVendors,
} from '@/lib/vendorFilters';

// 🔐 server-side guard (runs before any DB work)
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'vh_session';
const ISSUER = 'vendorhub';

// Ensure this page is always executed at request time (not statically cached)
export const dynamic = 'force-dynamic';

async function requireAuth(callbackUrl: string) {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET || ''),
      { issuer: ISSUER }
    );
  } catch {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
}

function money(n?: number | null) {
  if (n == null) return '—';
  return `$${Number(n).toFixed(0)}/hr`;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // 🔐 require a valid session before rendering anything
  await requireAuth('/');

  const filters = parseVendorFilters(searchParams ?? {});
  const { where, orderBy } = buildVendorWhereOrder(filters);

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

  const rows = processVendors(vendors, filters);

  return (
    <main className="space-y-4">
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
