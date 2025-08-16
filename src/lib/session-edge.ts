// src/lib/session-edge.ts
import type { NextRequest } from "next/server";
import { sessionCookie, verifyToken, signSession, type Session } from "./session-core";

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(sessionCookie.name)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export { sessionCookie, signSession };
export type { Session };
