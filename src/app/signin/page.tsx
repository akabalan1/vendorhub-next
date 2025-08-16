import React from "react";

export const dynamic = "force-dynamic";

function RequestForm() {
  // simple clientless form posting to fetch in action
  return (
    <form className="space-y-3"
      action={async (formData: FormData) => {
        "use server";
        const email = String(formData.get("email") || "").trim().toLowerCase();
        const name = String(formData.get("name") || "").trim();
        const message = String(formData.get("message") || "").trim();
        const res = await fetch("/api/access-requests", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, name, message, company: "" }),
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Failed to submit request");
        }
      }}
    >
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
        This will notify the admin. You’ll get an invite link if approved.
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

function SignInBox() {
  // keep your existing email → passkey sign-in client here
  // (unchanged logic; only shown when user clicks “I already have access”)
  return (
    <div className="space-y-3">
      {/* your current sign-in component goes here */}
      <p className="text-xs text-gray-500">Only users who already have access can sign in.</p>
    </div>
  );
}

export default async function Page() {
  return (
    <main className="min-h-[70vh] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 bg-white space-y-5">
        <h1 className="text-lg font-semibold">Request access</h1>
        <RequestForm />
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600">
            Already have access?
          </summary>
          <div className="mt-3">
            <SignInBox />
          </div>
        </details>
      </div>
    </main>
  );
}
