import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

vi.mock('../src/lib/session', () => ({
  getSession: vi.fn().mockResolvedValue(null),
  signSession: vi.fn(),
  sessionCookie: { name: 'vh_session', options: {} },
}));

describe('authentication redirects', () => {
  it('redirects unauthenticated user from root to signin', async () => {
    const res = await middleware(new NextRequest('http://localhost/'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/signin');
  });

  it('redirects unauthenticated user from vendor page to signin', async () => {
    const res = await middleware(new NextRequest('http://localhost/vendor/123'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/signin');
  });
});
