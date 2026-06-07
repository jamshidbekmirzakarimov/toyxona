import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Toaster from './Toaster';

// ---------------------------------------------------------------------------
//  Layout — Navbar + sahifa konteyneri (<Outlet/>) + global Toaster
// ---------------------------------------------------------------------------
export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="container page">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="brand">🎉 To'yxona</span>
          <span>© 2026 To'yxona Online Bron Tizimi. Barcha huquqlar himoyalangan.</span>
        </div>
      </footer>

      <Toaster />
    </>
  );
}
