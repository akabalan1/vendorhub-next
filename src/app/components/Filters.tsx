'use client';
import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MultiSelect from './MultiSelect';

function parseCSV(param: string | null) {
  return (param ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export default function Filters({
  vendorOptions,
  capabilityOptions,
}: {
  vendorOptions: { value: string; label: string }[];
  capabilityOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // hydrate from URL
  const [vendors, setVendors] = React.useState<string[]>(parseCSV(searchParams.get('vendors')));
  const [caps, setCaps] = React.useState<string[]>(parseCSV(searchParams.get('caps')));
  const [ratings, setRatings] = React.useState<string[]>(parseCSV(searchParams.get('ratings'))); // e.g. ["3","4","5"]
  const [tiers, setTiers] = React.useState<string[]>(parseCSV(searchParams.get('tiers')));       // e.g. ["<=40","<=50"]
  const [sort, setSort] = React.useState(searchParams.get('sort') ?? 'rating_desc');
  const [q, setQ] = React.useState(searchParams.get('q') ?? '');

  // push to URL
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const set = (k: string, arr: string[]) => (arr.length ? params.set(k, arr.join(',')) : params.delete(k));
    q ? params.set('q', q) : params.delete('q');
    set('vendors', vendors);
    set('caps', caps);
    set('ratings', ratings);
    set('tiers', tiers);
    sort ? params.set('sort', sort) : params.delete('sort');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, vendors, caps, ratings, tiers, sort]);

  const ratingOpts = [5, 4, 3].map(n => ({ value: String(n), label: `Exactly ${n}★` }));
  const tierOpts = [
    { value: '<=35', label: '≤ $35/hr' },
    { value: '<=50', label: '≤ $50/hr' },
    { value: '<=75', label: '≤ $75/hr' },
    { value: '<=100', label: '≤ $100/hr' },
  ];

  return (
    <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-12">
      <div className="md:col-span-4">
        <input
          className="w-full rounded-xl border border-gray-300 px-3 py-2"
          placeholder="Search vendors, capabilities, notes…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
      <div className="md:col-span-3">
        <MultiSelect label="Vendors" options={vendorOptions} selected={vendors} onChange={setVendors} />
      </div>
      <div className="md:col-span-3">
        <MultiSelect label="Capabilities" options={capabilityOptions} selected={caps} onChange={setCaps} />
      </div>
      <div className="md:col-span-2 flex gap-2">
        <MultiSelect label="Rating" options={ratingOpts} selected={ratings} onChange={setRatings} />
        <MultiSelect label="Tier cost" options={tierOpts} selected={tiers} onChange={setTiers} />
      </div>

      {/* Sort */}
      <div className="md:col-span-2">
        <div className="rounded-xl border border-gray-300 bg-white px-3 py-2">
          <div className="text-xs text-gray-500">Sort</div>
          <select
            className="w-full bg-transparent text-sm outline-none"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="rating_desc">Rating (high → low)</option>
            <option value="rating_asc">Rating (low → high)</option>
            <option value="cost_asc">Cost (low → high)</option>
            <option value="cost_desc">Cost (high → low)</option>
            <option value="name_asc">Name (A–Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
