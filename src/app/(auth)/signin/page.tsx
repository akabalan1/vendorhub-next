export default function SignIn() {
  async function action(formData: FormData) {
    'use server';
    const idToken = String(formData.get('idToken') || '');
    await fetch('/api/signin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  }

  return (
    <main className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-gray-600">Enter your Google ID token.</p>
      <form action={action} className="mt-4 space-y-3">
        <input
          type="text"
          name="idToken"
          required
          placeholder="Google ID token"
          className="w-full rounded-xl border border-gray-300 px-3 py-2"
        />
        <button
          className="w-full rounded-xl bg-black px-3 py-2 text-white hover:bg-gray-900"
          type="submit"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
