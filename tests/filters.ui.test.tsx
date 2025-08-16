import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Filters from '../src/app/components/Filters';
import { parseVendorFilters, processVendors } from '../src/lib/vendorFilters';

vi.mock('../src/app/components/Stars', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

beforeEach(() => {
  paramsState.params = new URLSearchParams();
});

afterEach(() => {
  cleanup();
});

const vendors = [
  {
    id: 'v1',
    name: 'Alpha',
    overview: 'Alpha overview',
    serviceOptions: ['WHITE_GLOVE'],
    costTiers: [
      { id: 't1', tierLabel: 'Gold', hourlyUsdMin: 10 },
      { id: 't2', tierLabel: 'Silver', hourlyUsdMin: 5 },
    ],
    caps: [{ cap: { slug: 'cap1' } }, { cap: { slug: 'cap2' } }],
    feedback: [
      { ratingQuality: 5, ratingSpeed: 4, ratingComm: 4 },
    ],
  },
  {
    id: 'v2',
    name: 'Beta',
    overview: 'Beta overview',
    serviceOptions: ['CROWD_SOURCED'],
    costTiers: [{ id: 't3', tierLabel: 'Gold', hourlyUsdMin: 20 }],
    caps: [{ cap: { slug: 'cap2' } }],
    feedback: [{ ratingQuality: 3, ratingSpeed: 3, ratingComm: 3 }],
  },
  {
    id: 'v3',
    name: 'Gamma',
    overview: 'Gamma overview',
    serviceOptions: ['WHITE_GLOVE', 'CROWD_SOURCED'],
    costTiers: [{ id: 't4', tierLabel: 'Silver', hourlyUsdMin: 8 }],
    caps: [{ cap: { slug: 'cap3' } }],
    feedback: [{ ratingQuality: 2, ratingSpeed: 2, ratingComm: 2 }],
  },
];

const vendorOptions = vendors.map(v => ({ value: v.id, label: v.name }));
const capabilityOptions = [
  { value: 'cap1', label: 'cap1' },
  { value: 'cap2', label: 'cap2' },
  { value: 'cap3', label: 'cap3' },
];

const paramsState = {
  params: new URLSearchParams(),
  setParams: (p: URLSearchParams) => {},
};

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    replace: (url: string) => {
      const p = new URL(url, 'http://localhost').searchParams;
      if (p.toString() !== paramsState.params.toString()) {
        paramsState.setParams(p);
      }
    },
  }),
  useSearchParams: () => paramsState.params,
}));

function TestPage() {
  const [params, setParams] = React.useState(new URLSearchParams());
  paramsState.params = params;
  paramsState.setParams = setParams;
  const filters = React.useMemo(
    () => parseVendorFilters(Object.fromEntries(params.entries())),
    [params]
  );
  const filtered = React.useMemo(() => {
    if (!filters.q) return vendors;
    return vendors.filter((v) =>
      v.name.toLowerCase().includes(filters.q.toLowerCase())
    );
  }, [filters]);
  const rows = processVendors(filtered, filters);
  return (
    <>
      <Filters vendorOptions={vendorOptions} capabilityOptions={capabilityOptions} />
      <ul>
        {rows.map(r => (
          <li key={r.id} data-testid="row">
            {r.name}
          </li>
        ))}
      </ul>
    </>
  );
}

function rowNames() {
  const names = screen.queryAllByTestId('row').map((li) => li.textContent || '');
  return Array.from(new Set(names));
}

describe('filter UI', () => {
  it('filters by vendor name search', async () => {
    render(<TestPage />);
    fireEvent.change(
      screen.getByPlaceholderText(/Search vendors/),
      { target: { value: 'Alpha' } }
    );
    await waitFor(() => expect(paramsState.params.get('q')).toBe('Alpha'));
    await waitFor(() => expect(rowNames()).toEqual(['Alpha']));
  });

  it('filters by capability selection', async () => {
    render(<TestPage />);
    await act(async () => {
      paramsState.setParams(new URLSearchParams('caps=cap2'));
    });
    await waitFor(() => expect(paramsState.params.get('caps')).toBe('cap2'));
    await waitFor(() => expect(rowNames()).toEqual(['Alpha', 'Beta']));
  });

  it('filters by rating minimum', async () => {
    render(<TestPage />);
    await act(async () => {
      paramsState.setParams(new URLSearchParams('ratingMin=4'));
    });
    await waitFor(() => expect(paramsState.params.get('ratingMin')).toBe('4'));
    await waitFor(() => expect(rowNames()).toEqual(['Alpha']));
  });
});
