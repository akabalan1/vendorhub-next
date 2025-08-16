// src/app/signin/page.tsx
import React from "react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// server action
async function submitAccessRequest(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const message = String(formData.get("message") || "").trim();

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/access-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name, message, company: "" }),
      cache: "no-store",
    });

    if (!res.ok) {
      // send a simple error code to the page
      redirect("/signin?requested=error");
    }

    // success: back to the page with a success state
    redirect("/signin?requested=ok");
  } catch {
    redirect("/signin?requested=error");
  }
}

function RequestForm() {
  return (
    <form action={submitAccessRequest} className="space-y-3">
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
            {/* Your existing passkey sign-in UI goes here */}
          </div>
        </details>
      </div>
    </main>
  );
}
