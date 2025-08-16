import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/vendors/route';

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

const findMany = vi.hoisted(() => vi.fn());

vi.mock('../src/lib/db', () => ({
  prisma: { vendor: { findMany } },
}));

vi.mock('../src/lib/session', () => ({
  getSession: vi.fn().mockResolvedValue({ email: 'test@example.com' }),
}));

findMany.mockResolvedValue(vendors);

describe('GET /api/vendors', () => {
  it('filters by ratingMin', async () => {
    const req = new NextRequest('http://test/api/vendors?ratingMin=4');
    const res = await GET(req);
    const json = await res.json();
    expect(json.data.map((v: any) => v.id)).toEqual(['v1']);
  });

  it('filters by capability', async () => {
    const req = new NextRequest('http://test/api/vendors?caps=cap2');
    const res = await GET(req);
    const json = await res.json();
    expect(json.data.map((v: any) => v.id)).toEqual(['v1', 'v2']);
  });
});
