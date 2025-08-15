import { randomBytes } from "crypto";
import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { signSession } from "@/lib/session";

// Simple in-memory challenge store keyed by email
const challenges = new Map<string, string>();
const regChallenges = new Map<string, string>();

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

export async function startRegistration(email: string) {
  const existing = await prisma.passkey.findMany({ where: { email } });
  const options = await generateRegistrationOptions({
    rpName: "VendorHub",
    rpID: process.env.WEBAUTHN_RP_ID || "localhost",
    userID: Buffer.from(email),
    userName: email,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.credentialId,
      type: "public-key",
    })),
  });
  regChallenges.set(email, options.challenge);
  return options;
}

export async function finishRegistration(email: string, attestation: any) {
  const expected = regChallenges.get(email);
  if (!expected) {
    throw new Error("No challenge found");
  }
  const verification = await verifyRegistrationResponse({
    response: attestation,
    expectedChallenge: expected,
    expectedOrigin: process.env.WEBAUTHN_ORIGIN || "http://localhost:3000",
    expectedRPID: process.env.WEBAUTHN_RP_ID || "localhost",
  });
  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Registration verification failed");
  }
  const { credential } = verification.registrationInfo;
  await prisma.passkey.create({
    data: {
      email,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: credential.transports || [],
    },
  });
  regChallenges.delete(email);
  const token = await signSession({ sub: email, email, stage: "full" });
  return token;
}
