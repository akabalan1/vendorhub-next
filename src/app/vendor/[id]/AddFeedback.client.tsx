// src/app/vendor/[id]/AddFeedback.client.tsx
'use client';

import React from 'react';

export default function AddFeedback({ vendorId }: { vendorId: string }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [text, setText] = React.useState('');
  const [ratingQuality, setRatingQuality] = React.useState<number | ''>('');
  const [ratingSpeed, setRatingSpeed] = React.useState<number | ''>('');
  const [ratingComm, setRatingComm] = React.useState<number | ''>('');
  const [tags, setTags] = React.useState<string>('');
  const [link, setLink] = React.useState('');

  async function submit() {
    setSubmitting(true);
    try {
      const body = {
        vendorId,
        text,
        ratingQuality: ratingQuality === '' ? null : Number(ratingQuality),
        ratingSpeed: ratingSpeed === '' ? null : Number(ratingSpeed),
        ratingComm: ratingComm === '' ? null : Number(ratingComm),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        link: link || null,
      };
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed: ${res.status}`);
      }
      // Refresh page data to show the new feedback
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
      >
        + Add feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-base font-semibold">Add Feedback</h4>
              <button
                className="rounded-lg px-2 py-1 text-sm hover:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600">Comment</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm"
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-gray-600">Quality (0–5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm"
                    value={ratingQuality}
                    onChange={(e) => setRatingQuality(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Speed (0–5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm"
                    value={ratingSpeed}
                    onChange={(e) => setRatingSpeed(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Comm (0–5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm"
                    value={ratingComm}
                    onChange={(e) => setRatingComm(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600">Tags (comma separated)</label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="pricing, availability"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600">Link (optional)</label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-300 p-2 text-sm"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
