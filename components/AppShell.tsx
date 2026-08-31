'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import AuthGate from './AuthGate';

// Publicly readable, no account required — a prospective user needs to be
// able to read these before signing up.
const BARE_ROUTES = ['/login', '/register', '/privacy', '/terms'];

/** Auth pages render standalone; everything else sits behind the sidebar + AuthGate. */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (BARE_ROUTES.includes(pathname)) return <>{children}</>;

  return (
    <AuthGate>
      <div className="shell">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </AuthGate>
  );
}
