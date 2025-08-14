import Link from 'next/link';

export default function VendorTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Vendor</th>
            <th className="px-3 py-2">Industries</th>
            <th className="px-3 py-2">Capabilities</th>
            <th className="px-3 py-2">Platforms</th>
            <th className="px-3 py-2 text-right">Min cost</th>
            <th className="px-3 py-2 text-right">Avg ★</th>
            <th className="px-3 py-2 text-right">Open</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/60">
              <td className="px-3 py-3 font-medium"><Link href={`/vendor/${r.id}`}>{r.name}</Link></td>
              <td className="px-3 py-3 text-gray-700">{r.industries?.join(', ') || '—'}</td>
              <td className="px-3 py-3 text-gray-700">
                {r.capabilities?.map((c: any) => c.slug).join(', ') || '—'}
              </td>
              <td className="px-3 py-3 text-gray-700">{r.platforms?.join(', ') || '—'}</td>
              <td className="px-3 py-3 text-right">{r.minTierCost != null ? `$${r.minTierCost}/hr` : '—'}</td>
              <td className="px-3 py-3 text-right">{r.avgRating != null ? r.avgRating : '—'}</td>
              <td className="px-3 py-3 text-right">
                <Link href={`/vendor/${r.id}`} className="rounded-lg border border-gray-300 px-2 py-1 hover:bg-gray-100">View</Link>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">No vendors match your filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
