"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    google?: any;
  }
}

export default function SignIn() {
  const router = useRouter();
  const search = useSearchParams();
  const btnRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const src = "https://accounts.google.com/gsi/client";
    if (document.querySelector(`script[src="${src}"]`)) {
      init();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = init;
    document.head.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function init() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
    if (!window.google || !clientId) {
      setErr("Google script not loaded or missing client id");
      return;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (r: any) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ credential: r.credential }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.error || "Login failed");
          }
          const next = search.get("callbackUrl") || "/";
          router.replace(next);
        } catch (e: any) {
          setErr(e.message || "Login failed");
        }
      },
      auto_select: false,
      ux_mode: "popup",
      itp_support: true,
    });

    if (btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        logo_alignment: "left",
        width: 280,
      });
    }
    // Optional One Tap
    window.google.accounts.id.prompt();
  }

  return (
    <main className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-gray-600">
        Use your <b>@meta.com</b> Google account.
      </p>
      <div className="mt-4" ref={btnRef} />
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
    </main>
  );
}
