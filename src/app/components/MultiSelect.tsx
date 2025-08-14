'use client';
import React from 'react';

type Opt = { value: string; label: string };

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select…',
}: {
  label: string;
  options: Opt[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

  const allSelected = selected.length === options.length && options.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-left text-sm"
        onClick={() => setOpen(!open)}
      >
        <div className="text-xs text-gray-500">{label}</div>
        <div className="truncate">{selected.length ? `${selected.length} selected` : placeholder}</div>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-[22rem] max-w-[80vw] rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => onChange(allSelected ? [] : options.map(o => o.value))}
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>
          <div className="max-h-64 space-y-1 overflow-auto pr-1">
            {options.map(o => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm">{o.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
