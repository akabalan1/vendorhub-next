'use client';
import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MultiSelect from './MultiSelect';
import RatingFilter from './RatingFilter';

function parseCSV(v: string | null) {
  return (v ?? '').split(',').map(s => s.trim()).filter(Boolean);
}

const SERVICE_OPTIONS = [
  { value: 'WHITE_GLOVE',  label: 'White Glove' },
  { value: 'CROWD_SOURCED',label: 'Crowd Sourced' },
  { value: 'FTE',          label: 'FTE' }
];

export default function Filters({
  vendorOptions,
  capabilityOptions,
  tierLabels = ['Tier 1', 'Tier 2', 'Tier 3'],
}: {
  vendorOptions: { value: string; label: string }[];
  capabilityOptions: { value: string; label: string }[];
  tierLabels?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = React.useState(searchParams.get('q') ?? '');
  const [vendors, setVendors] = React.useState<string[]>(parseCSV(searchParams.get('vendors')));
  const [caps, setCaps] = React.useState<string[]>(parseCSV(searchParams.get('caps')));
  const [ratingMin, setRatingMin] = React.useState<string | null>(searchParams.get('ratingMin'));
  const [tierLabel, setTierLabel] = React.useState(searchParams.get('tier') ?? '');
  const [tierMax, setTierMax] = React.useState(searchParams.get('tierMax') ?? '');
  const [svc, setSvc] = React.useState<string[]>(parseCSV(searchParams.get('svc')));
  const [sort, setSort] = React.useState(searchParams.get('sort') ?? 'rating_desc');

  React.useEffect(() => {
    const p = new URLSearchParams(searchParams.toString());
    const setList = (k: string, arr: string[]) => arr.length ? p.set(k, arr.join(',')) : p.delete(k);

    q ? p.set('q', q) : p.delete('q');
    setList('vendors', vendors);
    setList('caps', caps);
    ratingMin ? p.set('ratingMin', ratingMin) : p.delete('ratingMin');
    tierLabel ? p.set('tier', tierLabel) : p.delete('tier');
    tierMax ? p.set('tierMax', tierMax) : p.delete('tierMax');
    setList('svc', svc);
    sort ? p.set('sort', sort) : p.delete('sort');

    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, vendors, caps, ratingMin, tierLabel, tierMax, svc, sort]);

  const tierOptions = tierLabels.map(t => ({ value: t, label: t }));

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

      <div className="md:col-span-2 flex items-center gap-2">
        <RatingFilter value={ratingMin} onChange={setRatingMin} />
      </div>

      {/* Service Options multiselect */}
      <div className="md:col-span-3">
        <MultiSelect label="Service Options" options={SERVICE_OPTIONS} selected={svc} onChange={setSvc} />
      </div>

      <div className="md:col-span-3 flex items-center gap-2">
        <div className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2">
          <div className="text-xs text-gray-500">Tier</div>
          <select
            className="w-full bg-transparent text-sm outline-none"
            value={tierLabel}
            onChange={e => setTierLabel(e.target.value)}
          >
            <option value="">Any tier</option>
            {tierOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <input
          className="w-28 rounded-xl border border-gray-300 px-3 py-2 text-sm"
          placeholder="Max $/hr"
          value={tierMax}
          onChange={e => setTierMax(e.target.value)}
        />
      </div>

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
            <option value="cost_sel_asc">Selected tier cost (low → high)</option>
            <option value="cost_sel_desc">Selected tier cost (high → low)</option>
            <option value="cost_min_asc">Min cost (low → high)</option>
            <option value="name_asc">Name (A–Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
