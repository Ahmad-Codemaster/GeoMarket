import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * AppLayout — the application shell.
 * Renders the sticky header, page content, and footer.
 */
export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
