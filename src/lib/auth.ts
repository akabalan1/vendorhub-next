import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export async function verifyGoogleIdToken(idToken: string) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('invalid_token');
  }
  return await res.json();
}

export function signJwt(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export function getSession(req: NextRequest) {
  const token = req.cookies.get('vh_session')?.value;
  if (!token) return null;
  try {
    return verifyJwt(token) as { email: string; name?: string; isAdmin?: boolean };
  } catch (err) {
    return null;
  }
}
