// src/app/signin/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";        // ensure server action runs in Node
export const dynamic = "force-dynamic"; // don't cache this page

// server action (no HTTP fetch)
async function submitAccessRequest(formData: FormData) {
  "use server";
  const email   = String(formData.get("email") || "").trim().toLowerCase();
  const name    = (formData.get("name") as string | null)?.trim() || null;
  const message = (formData.get("message") as string | null)?.trim() || null;
  const trap    = (formData.get("company") as string | null) || ""; // honeypot

  if (!/@meta\.com$/i.test(email) || trap) {
    redirect("/signin?requested=error");
  }

  try {
    await prisma.accessRequest.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name,
        message,
        status: "PENDING",
      },
    });
    redirect("/signin?requested=ok");
  } catch (e) {
    console.error("access request failed", e);
    redirect("/signin?requested=error");
  }
}

function RequestForm() {
  return (
    <form action={submitAccessRequest} className="space-y-3">
      {/* honeypot field (hidden) */}
      <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <div>
        <label className="block text-sm font-medium">Work email (@meta.com)</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2"/>
      </div>
      <div>
        <label className="block text-sm font-medium">Name (optional)</label>
        <input name="name" className="mt-1 w-full rounded-md border px-3 py-2"/>
      </div>
      <div>
        <label className="block text-sm font-medium">Why you need access (optional)</label>
        <textarea name="message" rows={3} className="mt-1 w-full rounded-md border px-3 py-2"/>
      </div>
      <button className="w-full rounded-lg bg-blue-600 text-white py-2 hover:bg-blue-700" type="submit">
        Request access
      </button>
      <p className="text-xs text-gray-500">
        This notifies the admin. You’ll get an invite link if approved.
      </p>
      <a
        className="inline-block text-sm text-blue-600 underline mt-2"
        href={`mailto:alkabalan@meta.com?subject=${encodeURIComponent("VendorHub access request")}`}
      >
        Or email Al directly
      </a>
    </form>
  );
}

// ...keep the rest of your page exactly as you had it (banner rendering, “Already have access?” section, etc.)
export default function Page({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const state = typeof searchParams?.requested === "string" ? searchParams?.requested : undefined;
  return (
    <main className="min-h-[70vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 bg-white space-y-5">
        <h1 className="text-lg font-semibold">Request access</h1>

        {state === "ok" && (
          <div className="rounded-md bg-green-50 text-green-800 p-3 text-sm">
            Thanks! Your request was submitted. We’ll send an invite shortly.
          </div>
        )}
        {state === "error" && (
          <div className="rounded-md bg-red-50 text-red-800 p-3 text-sm">
            Sorry—something went wrong. Please try again or email Al directly.
          </div>
        )}

        <RequestForm />

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600">Already have access?</summary>
          <div className="mt-3">
            {/* your existing passkey sign-in UI */}
          </div>
        </details>
      </div>
    </main>
  );
}
