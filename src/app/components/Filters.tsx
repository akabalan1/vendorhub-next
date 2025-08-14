'use client';
import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Filters(){
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = React.useState(searchParams.get('q') ?? '');
  const [cap, setCap] = React.useState(searchParams.get('cap') ?? '');
  const [maxCost, setMaxCost] = React.useState(searchParams.get('maxCost') ?? '');

  // Push filters into the URL on change
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    q ? params.set('q', q) : params.delete('q');
    cap ? params.set('cap', cap) : params.delete('cap');
    maxCost ? params.set('maxCost', maxCost) : params.delete('maxCost');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cap, maxCost]);

  return (
    <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-12">
      <div className="md:col-span-6">
        <input className="w-full rounded-xl border border-gray-300 px-3 py-2"
               placeholder="Search vendors, capabilities, notes…"
               value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      <div className="md:col-span-3">
        <input className="w-full rounded-xl border border-gray-300 px-3 py-2"
               placeholder="Capability slug (optional)"
               value={cap} onChange={e=>setCap(e.target.value)} />
      </div>
      <div className="md:col-span-3">
        <input className="w-full rounded-xl border border-gray-300 px-3 py-2"
               placeholder="Max cost ($/hr)"
               value={maxCost} onChange={e=>setMaxCost(e.target.value)} />
      </div>
    </div>
  );
}
