import { prisma } from '@/lib/db';
import { computeAvgRating } from '@/lib/scoring';
import Link from 'next/link';

function humanServiceOption(v: string) {
  switch (v) {
    case 'WHITE_GLOVE': return 'White Glove';
    case 'CROWD_SOURCED': return 'Crowd Sourced';
    case 'FTE': return 'FTE';
    default: return v;
  }
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
      {children}
    </span>
  );
}

export default async function VendorPage({ params }: { params: { id: string } }) {
  const v = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      costTiers:   { orderBy: [{ tierLabel: 'asc' }] },
      caps:        { include: { cap: true } },
      feedback:    { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!v) {
    return (
      <main className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-gray-600">
          Vendor not found.
        </div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; Back to list</Link>
      </main>
    ) as any;
  }

  const avg = computeAvgRating(v.feedback as any);

  return (
    <main className="space-y-5">
      {/* Header / Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{v.name}</h2>
            {v.overview ? <p className="mt-1 text-gray-700">{v.overview}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="text-gray-500">Status:</span>
              <Pill>{v.status}</Pill>
              {avg ? (
                <>
                  <span className="ml-3 text-gray-500">Avg ★</span>
                  <Pill>{avg}</Pill>
                </>
              ) : (
                <>
                  <span className="ml-3 text-gray-500">Avg ★</span>
                  <Pill>—</Pill>
                </>
              )}
              <span className="ml-3 text-gray-500">Created</span>
              <Pill>{new Date(v.createdAt).toLocaleDateString()}</Pill>
              <span className="text-gray-500">Updated</span>
              <Pill>{new Date(v.updatedAt).toLocaleDateString()}</Pill>
            </div>
          </div>
          <div className="text-right">
            <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; Back</Link>
            {v.website ? (
              <div className="mt-2">
                <a
                  href={v.website.startsWith('http') ? v.website : `https://${v.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Visit Website
                </a>
              </div>
            ) : null}
          </div>
        </div>

        {/* Meta rows */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500">Country</h4>
            <div className="mt-1 text-sm text-gray-800">{v.country ?? '—'}</div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500">Regions</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {v.regions?.length ? v.regions.map((r, i) => <Pill key={i}>{r}</Pill>) : <span className="text-sm text-gray-800">—</span>}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500">Platforms</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {v.platforms?.length ? v.platforms.map((p, i) => <Pill key={i}>{p}</Pill>) : <span className="text-sm text-gray-800">—</span>}
            </div>
          </div>
        </div>

        {/* Arrays: Service Options / Capabilities / Industries */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500">Service Options</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {v.serviceOptions?.length
                ? v.serviceOptions.map((s, i) => <Pill key={i}>{humanServiceOption(s)}</Pill>)
                : <span className="text-sm text-gray-800">—</span>}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500">Capabilities</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {v.caps?.length
                ? v.caps.map((c) => <Pill key={c.capId}>{c.cap.name ?? c.cap.slug}</Pill>)
                : <span className="text-sm text-gray-800">—</span>}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase text-gray-500">Industries</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {v.industries?.length
                ? v.industries.map((ind, i) => <Pill key={i}>{ind}</Pill>)
                : <span className="text-sm text-gray-800">—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Tiers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold">Cost Tiers ({v.costTiers.length})</h3>
        </div>
        {v.costTiers.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Min $/hr</th>
                  <th className="px-3 py-2">Max $/hr</th>
                  <th className="px-3 py-2">Currency</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {v.costTiers.map(t => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">{t.tierLabel}</td>
                    <td className="px-3 py-2">{t.hourlyUsdMin != null ? `$${t.hourlyUsdMin}` : '—'}</td>
                    <td className="px-3 py-2">{t.hourlyUsdMax != null ? `$${t.hourlyUsdMax}` : '—'}</td>
                    <td className="px-3 py-2">{t.currency}</td>
                    <td className="px-3 py-2">{t.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-sm text-gray-500">No cost tiers yet.</div>}
      </div>

      {/* Feedback */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold">Feedback ({v.feedback.length})</h3>
        </div>
        {v.feedback.length ? (
          <ul className="space-y-2">
            {v.feedback.map(f => (
              <li key={f.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{f.author || 'anon'}</div>
                  <div className="text-gray-500">{new Date(f.createdAt).toLocaleDateString()}</div>
                </div>
                {/* Ratings line */}
                <div className="mt-1 text-xs text-gray-600">
                  Quality/Speed/Comm:&nbsp;
                  <span className="font-medium">
                    {f.ratingQuality ?? '—'}/{f.ratingSpeed ?? '—'}/{f.ratingComm ?? '—'}
                  </span>
                </div>
                {/* Text */}
                {f.text ? <div className="mt-2 text-sm text-gray-800">{f.text}</div> : null}
                {/* Tags + Link + Privacy */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {f.tags?.length ? (
                    <div className="flex flex-wrap items-center gap-1">
                      {f.tags.map((t, i) => <Pill key={i}>{t}</Pill>)}
                    </div>
                  ) : null}
                  {f.link ? (
                    <a
                      href={f.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Reference link
                    </a>
                  ) : null}
                  {f.isPrivate ? <Pill>Private</Pill> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : <div className="text-sm text-gray-500">No feedback yet.</div>}
      </div>
    </main>
  );
}
