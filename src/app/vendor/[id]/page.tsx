import { prisma } from '@/lib/db';
import { computeAvgRating } from '@/lib/scoring';
import React from 'react';

export default async function VendorPage({ params }: { params: { id: string }}){
  const v = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: { costTiers: true, caps: { include: { cap: true } }, feedback: { orderBy: { createdAt: 'desc' } } }
  });
  if (!v) return <div className="text-gray-500">Not found</div> as any;
  const avg = computeAvgRating(v.feedback as any);
  return (
    <main className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{v.name}</h2>
            {v.overview ? <p className="mt-1 text-gray-700">{v.overview}</p> : null}
            <div className="mt-2 text-sm text-gray-600">{v.industries.join(', ')}</div>
          </div>
          <div className="text-right">
            {avg ? <div className="text-sm">{avg}★</div> : <div className="text-sm text-gray-400">No score</div>}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <h4 className="text-sm font-semibold">Cost Tiers</h4>
            <ul className="mt-1 space-y-1 text-sm">
              {v.costTiers.map(t=> <li key={t.id}>{t.tierLabel}: ${t.hourlyUsdMin ?? t.hourlyUsdMax}/hr</li>)}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Capabilities</h4>
            <div className="mt-1 text-sm text-gray-700">{v.caps.map(c=>c.cap.slug).join(', ') || '—'}</div>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Platforms</h4>
            <div className="mt-1 text-sm text-gray-700">{v.platforms.join(', ') || '—'}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold">Feedback ({v.feedback.length})</h3>
          {/* Placeholder for a client form; API route exists below */}
        </div>
        {v.feedback.length ? (
          <ul className="space-y-2">
            {v.feedback.map(f=> (
              <li key={f.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{f.author || 'anon'}</div>
                  <div>{new Date(f.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="mt-1 text-sm text-gray-700">{f.text}</div>
                <div className="mt-1 text-xs text-gray-600">Q/S/C: {f.ratingQuality ?? '—'}/{f.ratingSpeed ?? '—'}/{f.ratingComm ?? '—'}</div>
              </li>
            ))}
          </ul>
        ) : <div className="text-sm text-gray-500">No feedback yet.</div>}
      </div>
    </main>
  );
}
