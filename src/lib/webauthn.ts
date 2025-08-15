import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { signSession } from "@/lib/session";

// Simple in-memory challenge store keyed by email
const challenges = new Map<string, string>();
const regChallenges = new Map<string, string>();

export async function startAuth(email: string) {
  const passkeys = await prisma.passkey.findMany({ where: { email } });
  const options = await generateAuthenticationOptions({
    rpID: process.env.WEBAUTHN_RP_ID || "localhost",
    allowCredentials: passkeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports as AuthenticatorTransportFuture[],
    })),
  });
  challenges.set(email, options.challenge);
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
