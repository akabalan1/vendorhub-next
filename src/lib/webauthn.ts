import { randomBytes } from "crypto";
import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { signSession } from "@/lib/session";
import { ChallengeType } from "@prisma/client";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export async function startAuth(email: string) {
  const challenge = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await prisma.webAuthnChallenge.upsert({
    where: { email_type: { email, type: ChallengeType.AUTH } },
    update: { challenge, expiresAt },
    create: { email, type: ChallengeType.AUTH, challenge, expiresAt },
  });
  await prisma.webAuthnChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return { challenge };
}

export async function finishAuth(email: string, assertion: any) {
  const record = await prisma.webAuthnChallenge.findUnique({
    where: { email_type: { email, type: ChallengeType.AUTH } },
  });
  if (!record || record.challenge !== assertion?.challenge || record.expiresAt < new Date()) {
    if (record) {
      await prisma.webAuthnChallenge.delete({ where: { email_type: { email, type: ChallengeType.AUTH } } });
    }
    throw new Error("Invalid assertion");
  }
  await prisma.webAuthnChallenge.delete({ where: { email_type: { email, type: ChallengeType.AUTH } } });
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
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await prisma.webAuthnChallenge.upsert({
    where: { email_type: { email, type: ChallengeType.REG } },
    update: { challenge: options.challenge, expiresAt },
    create: { email, type: ChallengeType.REG, challenge: options.challenge, expiresAt },
  });
  await prisma.webAuthnChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return options;
}

export async function finishRegistration(email: string, attestation: any) {
  const record = await prisma.webAuthnChallenge.findUnique({
    where: { email_type: { email, type: ChallengeType.REG } },
  });
  if (!record || record.expiresAt < new Date()) {
    if (record) {
      await prisma.webAuthnChallenge.delete({ where: { email_type: { email, type: ChallengeType.REG } } });
    }
    throw new Error("No challenge found");
  }
  const verification = await verifyRegistrationResponse({
    response: attestation,
    expectedChallenge: record.challenge,
    expectedOrigin: process.env.WEBAUTHN_ORIGIN || "http://localhost:3000",
    expectedRPID: process.env.WEBAUTHN_RP_ID || "localhost",
  });
  if (!verification.verified || !verification.registrationInfo) {
    await prisma.webAuthnChallenge.delete({ where: { email_type: { email, type: ChallengeType.REG } } });
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
  await prisma.webAuthnChallenge.delete({ where: { email_type: { email, type: ChallengeType.REG } } });
  const token = await signSession({ sub: email, email, stage: "full" });
  return token;
}
