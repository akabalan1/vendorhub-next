import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { signSession, sessionCookie } from './src/lib/session';

process.env.AUTH_SECRET = 'test-secret';

async function makeRequest(path: string, auth: boolean) {
  const url = `http://localhost${path}`;
  const headers: Record<string, string> = {};
  if (auth) {
    const token = await signSession({ sub: '1', email: 'a@example.com' });
    headers['cookie'] = `${sessionCookie.name}=${token}`;
  }
  return new NextRequest(url, { headers });
}

(async () => {
  // unauthenticated root should redirect to /signin
  {
    const res = await middleware(await makeRequest('/', false));
    assert(res.headers.get('location'));
    const loc = new URL(res.headers.get('location')!);
    assert.equal(loc.pathname, '/signin');
    assert.equal(loc.searchParams.get('callbackUrl'), '/');
  }

  // authenticated root should pass through
  {
    const res = await middleware(await makeRequest('/', true));
    assert.equal(res.headers.get('location'), null);
  }

  // unauthenticated vendor page should redirect
  {
    const res = await middleware(await makeRequest('/vendor/123', false));
    assert(res.headers.get('location'));
    const loc = new URL(res.headers.get('location')!);
    assert.equal(loc.pathname, '/signin');
    assert.equal(loc.searchParams.get('callbackUrl'), '/vendor/123');
  }

  // authenticated vendor page should pass through
  {
    const res = await middleware(await makeRequest('/vendor/123', true));
    assert.equal(res.headers.get('location'), null);
  }

  console.log('middleware tests passed');
})();
