import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { signSession } from "@/lib/session";
import { ChallengeType } from "@prisma/client";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const challenges = new Map<string, string>();

export async function startAuth(email: string) {
  const passkeys = await prisma.passkey.findMany({ where: { email } });
  const challenge = randomBytes(32).toString("base64url");
  const options = await generateAuthenticationOptions({
    rpID: process.env.WEBAUTHN_RP_ID || "localhost",
    allowCredentials: passkeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports as AuthenticatorTransportFuture[],
    })),
    challenge,
  });
  challenges.set(email, challenge);
  return options;
}

export async function finishAuth(email: string, assertion: any) {
  const expected = challenges.get(email);
  if (!expected) {
    throw new Error("No challenge found");
  }

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: assertion.id },
  });
  if (!passkey || passkey.email !== email) {
    throw new Error("Passkey not found for user");
  }

  const verification = await verifyAuthenticationResponse({
    response: assertion,
    expectedChallenge: expected,
    expectedOrigin: process.env.WEBAUTHN_ORIGIN || "http://localhost:3000",
    expectedRPID: process.env.WEBAUTHN_RP_ID || "localhost",
    credential: {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, "base64url"),
      counter: passkey.counter,
      transports: passkey.transports as AuthenticatorTransportFuture[],
    },
  });

  if (!verification.verified) {
    throw new Error("Authentication verification failed");
  }

  await prisma.passkey.update({
    where: { credentialId: passkey.credentialId },
    data: { counter: verification.authenticationInfo.newCounter },
  });

  challenges.delete(email);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }

  const token = await signSession({
    sub: user.id,
    email: user.email || email,
    name: user.name || undefined,
    isAdmin: user.isAdmin,
  });
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
