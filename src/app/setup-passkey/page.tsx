"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";

export default function SetupPasskeyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((j) => setEmail(j.user?.email || null))
      .catch(() => setEmail(null));
  }, []);

  async function register() {
    if (!email) return;
    setLoading(true);
    setErr(null);
    try {
      const optRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!optRes.ok) {
        const j = await optRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to get options");
      }
      const opts = await optRes.json();
      const attRes = await startRegistration({ optionsJSON: opts });
      const verRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, credential: attRes }),
      });
      if (!verRes.ok) {
        const j = await verRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to verify registration");
      }
      router.replace("/");
    } catch (e: any) {
      setErr(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (email === null) {
    return <main className="p-6">Loading...</main>;
  }

  return (
    <main className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center">
      <h1 className="text-xl font-semibold">Set up your passkey</h1>
      <p className="mt-1 text-sm text-gray-600">Create a passkey for {email}</p>
      <button
        onClick={register}
        disabled={loading}
        className="mt-4 w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create passkey"}
      </button>
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
    </main>
  );
}
