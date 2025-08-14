'use client';
import React from 'react';
import { useSession, signIn } from 'next-auth/react';

export default function AddFeedback({ vendorId }: { vendorId: string }) {
  const { data } = useSession();
  const user = data?.user;

  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [q, setQ] = React.useState<number | ''>('');
  const [s, setS] = React.useState<number | ''>('');
  const [c, setC] = React.useState<number | ''>('');
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const submit = async () => {
    if (!user) { await signIn(); return; }
    setSaving(true); setErr(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          text,
          ratingQuality: q === '' ? null : Number(q),
          ratingSpeed:   s === '' ? null : Number(s),
          ratingComm:    c === '' ? null : Number(c)
        })
      });
      if (!res.ok) throw new Error(await res.text());
      setOpen(false);
      setText(''); setQ(''); setS(''); setC('');
      // naive refresh
      window.location.reload();
    } catch (e:any) {
      setErr(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <button onClick={() => signIn()} className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
        Sign in to add feedback
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100">
        + Add feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-base font-semibold">Add feedback</div>
              <button onClick={() => setOpen(false)} className="text-sm text-gray-500">Close</button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[['Quality', q, setQ], ['Speed', s, setS], ['Comm', c, setC]] as const}.map
              {([label, val, set]: any, i: number) => (
                <div key={i}>
                  <div className="text-xs text-gray-500">{label}</div>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    step={0.5}
                    value={val as any}
                    onChange={e => set(e.target.value ? Number(e.target.value) : '')}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2"
                    placeholder="1–5"
                  />
                </div>
              ))}
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What worked? What could be better?"
              className="mt-2 h-28 w-full rounded-xl border border-gray-300 px-3 py-2"
            />

            {err && <div className="mt-2 text-sm text-red-600">{err}</div>}

            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-xl border border-gray-300 px-3 py-2 text-sm">
                Cancel
              </button>
              <button onClick={submit} disabled={saving} className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
