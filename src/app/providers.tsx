// src/app/providers.tsx
'use client';
import * as React from 'react';

/**
 * Lightweight provider wrapper.
 * (We removed next-auth's SessionProvider.)
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
