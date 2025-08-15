'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
// If NextAuth is wired, we'll try to read the current user for default author.
// Safe even if not signed in: it will just be undefined.

type Props = {
  vendorId: string;
};

export default function AddFeedback({ vendorId }: Props) {
  const router = useRouter();
  const defaultAuthor = '';

  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // form fields
  const [author, setAuthor] = React.useState<string>(defaultAuthor || '');
  const [ratingQuality, setRatingQuality] = React.useState<string>('');
  const [ratingSpeed, setRatingSpeed] = React.useState<string>('');
  const [ratingComm, setRatingComm] = React.useState<string>('');
  const [text, setText] = React.useState<string>('');
  const [tags, setTags] = React.useState<string>(''); // comma-separated
  const [link, setLink] = React.useState<string>('');
  const [isPrivate, setIsPrivate] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        vendorId,
        author: author || defaultAuthor || 'anon',
        ratingQuality: ratingQuality ? Number(ratingQuality) : null,
        ratingSpeed: ratingSpeed ? Number(ratingSpeed) : null,
        ratingComm: ratingComm ? Number(ratingComm) : null,
        text,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        link: link || null,
        isPrivate,
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed: ${res.status}`);
      }

      // Reset and refresh page to show new feedback
      setOpen(false);
      setAuthor(defaultAuthor || '');
      setRatingQuality('');
      setRatingSpeed('');
      setRatingComm('');
      setText('');
      setTags('');
      setLink('');
      setIsPrivate(false);

      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit feedback');
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
              <h4 className="text-sm font-semibold">Add Feedback</h4>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error ? (
                <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-500">Your name</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g. Jane Doe"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Link (optional)</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g. doc or evidence URL"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Quality (0–5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={ratingQuality}
                    onChange={(e) => setRatingQuality(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Speed (0–5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={ratingSpeed}
                    onChange={(e) => setRatingSpeed(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Comm (0–5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={ratingComm}
                    onChange={(e) => setRatingComm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Tags (comma-separated)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. quality, timeline, scope"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Feedback</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Share details that will help others choose this partner…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Mark as private (visible only to admins)
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? 'Saving…' : 'Save feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
