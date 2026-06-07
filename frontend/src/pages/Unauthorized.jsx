import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
//  Unauthorized — rol mos kelmaganda (403)
// ---------------------------------------------------------------------------
export default function Unauthorized() {
  return (
    <div className="center-box">
      <h1>403</h1>
      <p className="muted">Bu sahifaga kirishga ruxsatingiz yo'q.</p>
      <Link to="/" className="btn btn-primary">Bosh sahifaga</Link>
    </div>
  );
}
