import Link from 'next/link';

export function VendorCard({ v }: { v: any }){
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold"><Link href={`/vendor/${v.id}`}>{v.name}</Link></h3>
          {v.industries?.length ? (
            <div className="mt-1 text-sm text-gray-600">{v.industries.join(', ')}</div>
          ) : null}
        </div>
        <div className="text-right text-sm">
          {v.minTierCost ? <div className="font-medium">{`$${v.minTierCost}/hr`}</div> : <div className="text-gray-500">—</div>}
          {v.avgRating ? <div className="text-gray-600">{v.avgRating}★</div> : <div className="text-gray-400">No score</div>}
        </div>
      </div>
      {v.capabilities?.length ? (
        <div className="mt-2 text-sm text-gray-700">Caps: {v.capabilities.map((c:any)=>c.slug).join(', ')}</div>
      ) : null}
      {v.platforms?.length ? (
        <div className="mt-1 text-sm text-gray-700">Platforms: {v.platforms.join(', ')}</div>
      ) : null}
    </div>
  );
}
