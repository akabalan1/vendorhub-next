"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

export default function SignIn() {
  const divRef = useRef<HTMLDivElement>(null);

  type CredentialResponse = { credential: string };

  async function handleCredential(response: CredentialResponse) {
    const res = await fetch("/api/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });

    const data = await res.json();
    window.location.href = data.callbackUrl || "/";
  }

  function initialize() {
    if (!window.google || !divRef.current) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(divRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
    });
  }

  useEffect(() => {
    if (window.google) initialize();
  }, []);

  return (
    <main className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6">
      <Script src="https://accounts.google.com/gsi/client" async defer onLoad={initialize} />
      <h1 className="text-xl font-semibold">Sign in</h1>
      <div ref={divRef} className="mt-4" />
    </main>
  );
}

declare global {
  interface Window {
    google?: any;
  }
}

