"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignIn />
    </Suspense>
  );
}

function SignIn() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email.endsWith("@meta.com")) {
      setErr("Email must end with @meta.com");
      return;
    }
    setLoading(true);
    try {
      const optRes = await fetch("/api/webauthn/login/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!optRes.ok) {
        const j = await optRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to get options");
      }
      const opts = await optRes.json();
      const authRes = await startAuthentication({ optionsJSON: opts });
      const verRes = await fetch("/api/webauthn/login/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, credential: authRes }),
      });
      if (!verRes.ok) {
        const j = await verRes.json().catch(() => ({}));
        throw new Error(j.error || "Login failed");
      }
      const next = search.get("callbackUrl") || "/";
      router.replace(next);
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-gray-600">
        Use your <b>@meta.com</b> email to sign in with a passkey.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <input
          type="email"
          required
          placeholder="you@meta.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
    </main>
  );
}

