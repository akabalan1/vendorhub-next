import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const token = cookies().get("vh_session")?.value;
  if (!token) redirect("/signin?callbackUrl=/admin/requests");
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.AUTH_SECRET || ""),
      { issuer: "vendorhub" }
    );
    if (!payload || !payload.role || payload.role !== "admin") {
      redirect("/signin?callbackUrl=/admin/requests");
    }
  } catch {
    redirect("/signin?callbackUrl=/admin/requests");
  }
}

async function getPending() {
  return prisma.accessRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

async function approve(id: string, email: string) {
  // call your existing admin invite endpoint
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/invites`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookies().toString() },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  await prisma.accessRequest.update({ where: { id }, data: { status: "APPROVED" } });
  return json?.url as string | undefined;
}

async function reject(id: string) {
  await prisma.accessRequest.update({ where: { id }, data: { status: "REJECTED" } });
}

export default async function Page() {
  await requireAdmin();
  const requests = await getPending();

  return (
    <main className="max-w-3xl mx-auto space-y-6 p-6">
      <h1 className="text-xl font-semibold">Access Requests</h1>
      {!requests.length && <p className="text-gray-500">No pending requests.</p>}

      <ul className="space-y-4">
        {requests.map((r) => (
          <li key={r.id} className="rounded-xl border p-4 flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">{r.email} {r.name ? `(${r.name})` : ""}</div>
              <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
              {r.message ? <p className="mt-2 text-sm">{r.message}</p> : null}
            </div>
            {/* minimal clientless actions via form submissions */}
            <form action={async () => {
              "use server";
              const url = await approve(r.id, r.email);
              // Best effort: copy URL via header (shows in UI below if you wire client code)
            }}>
              <button className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50" type="submit">
                Approve → Create Invite
              </button>
            </form>
            <form action={async () => { "use server"; await reject(r.id); }}>
              <button className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50" type="submit">
                Reject
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
