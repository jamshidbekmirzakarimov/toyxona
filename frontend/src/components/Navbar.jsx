import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// ---------------------------------------------------------------------------
//  Navbar — rolga qarab menyular o'zgaradi. Mobilda toggle menyu.
// ---------------------------------------------------------------------------
export default function Navbar() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role = user?.role;

  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = () => {
    close();
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={close}>🎉 To'yxona</Link>

        <button
          className="nav-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menyu"
          aria-expanded={open}
        >
          ☰
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={close}>
          <Link to="/">Bosh sahifa</Link>

          {role === 'user' && <Link to="/my-bookings">Mening bronlarim</Link>}
          {role === 'owner' && <Link to="/owner">Owner panel</Link>}
          {role === 'admin' && <Link to="/admin">Admin panel</Link>}

          {!token ? (
            <>
              <Link to="/login">Kirish</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Ro'yxatdan o'tish</Link>
            </>
          ) : (
            <span className="nav-user">
              <span className="badge">{user?.name} · {role}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Chiqish</button>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}
