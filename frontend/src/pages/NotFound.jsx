import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
//  NotFound — 404
// ---------------------------------------------------------------------------
export default function NotFound() {
  return (
    <div className="center-box">
      <h1>404</h1>
      <p className="muted">Sahifa topilmadi.</p>
      <Link to="/" className="btn btn-primary">Bosh sahifaga</Link>
    </div>
  );
}
