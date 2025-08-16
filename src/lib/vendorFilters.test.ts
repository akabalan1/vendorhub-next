import assert from 'node:assert/strict';
import { parseVendorFilters, processVendors } from './vendorFilters';

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

function run(params: Record<string, string>) {
  const filters = parseVendorFilters(params);
  return processVendors(vendors, filters);
}

// vendors filter
{
  const rows = run({ vendors: 'v1,v2' });
  assert.deepEqual(rows.map((r) => r.id), ['v1', 'v2']);
}

// caps filter
{
  const rows = run({ caps: 'cap2' });
  assert.deepEqual(rows.map((r) => r.id), ['v1', 'v2']);
}

// ratingMin filter
{
  const rows = run({ ratingMin: '4' });
  assert.deepEqual(rows.map((r) => r.id), ['v1']);
}

// tier and tierMax filters
{
  const rows = run({ tier: 'Gold', tierMax: '15' });
  assert.deepEqual(rows.map((r) => r.id), ['v1']);
}

// tierMax without tier
{
  const rows = run({ tierMax: '9' });
  assert.deepEqual(rows.map((r) => r.id), ['v1', 'v3']);
}

// svc filter
{
  const rows = run({ svc: 'WHITE_GLOVE' });
  assert.deepEqual(rows.map((r) => r.id), ['v1', 'v3']);
}

// sort by name
{
  const rows = run({ sort: 'name_asc' });
  assert.deepEqual(rows.map((r) => r.name), ['Alpha', 'Beta', 'Gamma']);
}

// default sort rating desc
{
  const rows = run({});
  assert.deepEqual(rows.map((r) => r.id), ['v1', 'v2', 'v3']);
}

// sort by cost_sel_asc with tier
{
  const rows = run({ tier: 'Gold', sort: 'cost_sel_asc' });
  assert.deepEqual(rows.map((r) => r.id), ['v1', 'v2']);
}

console.log('tests passed');
