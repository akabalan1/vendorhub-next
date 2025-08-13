import './globals.css';
import React from 'react';

export const metadata = { title: 'VendorHub', description: 'Partner directory & feedback' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight">VendorHub</h1>
              <p className="text-sm text-gray-600">Centralized partner directory, filters, and evergreen feedback.</p>
            </div>
            <a className="text-sm text-gray-500 hover:text-gray-900" href="/">Explore</a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
