import './globals.css';
import React from 'react';
import Providers from './providers';

export const metadata = { title: 'VendorHub', description: 'Partner directory & feedback' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
        <Providers>
          <div className="mx-auto max-w-6xl px-4 py-6">
            <header className="mb-6">
              <h1 className="text-2xl font-black tracking-tight">VendorHub</h1>
              <p className="text-sm text-gray-600">
                Centralized partner directory, filters, and evergreen feedback.
              </p>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
