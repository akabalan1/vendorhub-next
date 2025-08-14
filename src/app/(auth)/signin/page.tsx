import { signIn } from '@/lib/auth';

export default function SignIn() {
  async function action(formData: FormData) {
    'use server';
    const email = String(formData.get('email') || '');
    await signIn('email', { email, redirectTo: '/' });
  }

  return (
    <main className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-gray-600">
        Use your <b>@meta.com</b> email to get a magic link.
      </p>
      <form action={action} className="mt-4 space-y-3">
        <input
          type="email"
          name="email"
          required
          placeholder="you@meta.com"
          className="w-full rounded-xl border border-gray-300 px-3 py-2"
        />
        <button
          className="w-full rounded-xl bg-black px-3 py-2 text-white hover:bg-gray-900"
          type="submit"
        >
          Send link
        </button>
      </form>
    </main>
  );
}
