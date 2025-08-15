import { randomBytes } from "crypto";
import { signSession } from "@/lib/session";

// Simple in-memory challenge store keyed by email
const challenges = new Map<string, string>();

export async function startAuth(email: string) {
  const challenge = randomBytes(32).toString("base64url");
  challenges.set(email, challenge);
  return { challenge };
}

export async function finishAuth(email: string, assertion: any) {
  const expected = challenges.get(email);
  if (!expected || assertion?.challenge !== expected) {
    throw new Error("Invalid assertion");
  }
  challenges.delete(email);
  const token = await signSession({ sub: email, email });
  return token;
}
