import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';

const PUBLIC_PATHS = ['/signin', '/api/signin', '/api/signout', '/api/health'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('vh_session')?.value;
  if (token) {
    try {
      verifyJwt(token);
      return NextResponse.next();
    } catch (err) {
      // fallthrough to redirect
    }
  }

  const url = new URL('/signin', req.url);
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}
