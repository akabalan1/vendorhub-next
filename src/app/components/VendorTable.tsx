import Link from 'next/link';

export default function VendorTable({
  rows,
  tierLabel,
}: {
  rows: any[];
  tierLabel?: string;
}) {
  const costHeader = tierLabel ? `${tierLabel} cost` : 'Cost (all tiers)';
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Vendor</th>
            <th className="px-3 py-2">Capabilities</th>
            <th className="px-3 py-2">Overview</th>
            {/* NEW column */}
            <th className="px-3 py-2">Rater Training</th>
            <th className="px-3 py-2">Service Options</th>
            <th className="px-3 py-2 text-right">{costHeader}</th>
            <th className="px-3 py-2 text-right">Avg ★</th>
            <th className="px-3 py-2 text-right">Open</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/60">
              <td className="px-3 py-3 font-medium">
                <Link href={`/vendor/${r.id}`}>{r.name}</Link>
              </td>
              <td className="px-3 py-3 text-gray-700">
                {r.capabilities?.map((c: any) => c.slug).join(', ') || '—'}
              </td>
              <td className="px-3 py-3 text-gray-700">{r.overview ?? '—'}</td>
              {/* NEW cell */}
                <td className="px-3 py-3 text-gray-700">
                {r.raterTrainingSpeed ?? '—'}
              </td>
              <td className="px-3 py-3 text-gray-700">
                {Array.isArray(r.serviceOptions) && r.serviceOptions.length
                  ? r.serviceOptions
                      .map((s: string) =>
                        s === 'WHITE_GLOVE' ? 'White Glove' :
                        s === 'CROWD_SOURCED' ? 'Crowd Sourced' :
                        s === 'FTE' ? 'FTE' : s)
                      .join(', ')
                  : '—'}
              </td>
              <td className="px-3 py-3 text-right">
                {Array.isArray(r.tierCosts) && r.tierCosts.length ? (
                  <div className="flex flex-col items-end gap-0.5">
                    {r.tierCosts.map((t: any) => (
                      <div key={t.label} className="whitespace-nowrap">
                        <span className="text-xs uppercase text-gray-500">{t.label}:</span>{' '}
                        <span className="font-medium">${t.cost}/hr</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span>—</span>
                )}
              </td>
              <td className="px-3 py-3 text-right">{r.avgRating ?? '—'}</td>
              <td className="px-3 py-3 text-right">
                <Link
                  href={`/vendor/${r.id}`}
                  className="rounded-lg border border-gray-300 px-2 py-1 hover:bg-gray-100"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                No vendors match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
