import './globals.css';
import React from 'react';
import Providers from './providers';
import Link from 'next/link';
import SignOutButton from './components/SignOutButton';

export const metadata = { title: 'VendorHub', description: 'Partner directory & feedback' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
        <Providers>
          <div className="mx-auto max-w-6xl px-4 py-6">
            <header className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-2xl font-black tracking-tight">
                  VendorHub
                </Link>
                <nav className="flex items-center gap-4 text-sm">
                  <Link href="/" className="hover:underline">
                    Explore
                  </Link>
                </nav>
              </div>
              <SignOutButton />
            </header>
            <p className="mb-6 text-sm text-gray-600">
              Centralized partner directory, filters, and evergreen feedback.
            </p>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
