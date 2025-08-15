import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleIdToken, signJwt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (!idToken) {
    return NextResponse.json({ error: 'idToken required' }, { status: 400 });
  }

  try {
    const payload: any = await verifyGoogleIdToken(idToken);
    const email = payload?.email as string | undefined;
    const name = payload?.name as string | undefined;
    if (!email || !email.endsWith('@meta.com')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const admins = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    const isAdmin = admins.includes(email);
    const session = { email, name, isAdmin };
    const token = signJwt(session);
    const res = NextResponse.json({ ok: true });
    res.cookies.set('vh_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }
}
