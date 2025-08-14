'use client';
import React from 'react';
import Stars from './Stars';

const STEPS = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5];

export default function RatingFilter({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const label = value ? `${value}+` : 'Any rating';
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <span>★ Rating</span>
        <span className="text-gray-500">{label}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <button
            className="block w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-gray-50"
            onClick={() => { onChange(null); setOpen(false); }}
          >
            Any rating
          </button>
          {STEPS.map((n) => (
            <button
              key={n}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-sm hover:bg-gray-50"
              onClick={() => { onChange(String(n)); setOpen(false); }}
            >
              <span>{n.toFixed(1)}</span>
              <Stars value={n} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
