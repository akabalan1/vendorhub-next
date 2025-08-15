import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('vh_session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return res;
}
