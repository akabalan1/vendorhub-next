'use client';
import React from 'react';

export function Filters({ onChange }: { onChange: (f: Record<string,string>)=>void }){
  const [q, setQ] = React.useState('');
  const [cap, setCap] = React.useState('');
  const [maxCost, setMaxCost] = React.useState('');

  React.useEffect(()=>{ onChange({ q, cap, maxCost }); }, [q,cap,maxCost]);

  return (
    <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-12">
      <div className="md:col-span-6">
        <input className="w-full rounded-xl border border-gray-300 px-3 py-2" placeholder="Search vendors, capabilities, notes…" value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      <div className="md:col-span-3">
        <input className="w-full rounded-xl border border-gray-300 px-3 py-2" placeholder="Capability slug (optional)" value={cap} onChange={e=>setCap(e.target.value)} />
      </div>
      <div className="md:col-span-3">
        <input className="w-full rounded-xl border border-gray-300 px-3 py-2" placeholder="Max cost ($/hr)" value={maxCost} onChange={e=>setMaxCost(e.target.value)} />
      </div>
    </div>
  );
}
