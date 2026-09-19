import { Outlet } from 'react-router-dom';
import { Header } from './Header';

/**
 * AppLayout — the authenticated shell.
 * Renders the sticky header and the page content below.
 * All authenticated routes (CUSTOMER / VENDOR / ADMIN) use this layout.
 */
export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
