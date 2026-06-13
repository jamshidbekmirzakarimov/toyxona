import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import { imageUrl } from '../../utils/imageUrl';

const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');

// To'yxona statusi yorlig'i
function VenueStatus({ status }) {
  const cls = status === 'tasdiqlangan' ? 'status-active' : 'status-pending';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
//  OwnerVenuesPage — owner o'z to'yxonalari (statuslar bilan)
// ---------------------------------------------------------------------------
export default function OwnerVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/owner/venues')
      .then((res) => setVenues(res.data.venues || []))
      .catch((err) => setError(err.response?.data?.message || 'Yuklab bo\'lmadi'))
      .finally(() => setLoading(false));
    api.get('/owner/stats').then((res) => setStats(res.data.stats)).catch(() => {});
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-head">
        <h1>Mening to'yxonalarim</h1>
        <div className="page-head-actions">
          <Link to="/owner/bookings" className="btn btn-ghost btn-sm">Bronlar</Link>
          <Link to="/owner/venues/new" className="btn btn-primary btn-sm">+ Yangi to'yxona</Link>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <StatCard label="To'yxonalarim" value={stats.venues_total} hint={`${stats.venues_approved} tasdiqlangan`} />
          <StatCard label="Aktiv bronlar" value={stats.bookings_active} hint={`Jami: ${stats.bookings_total}`} accent="#0ea5e9" />
          <StatCard label="Kutilayotgan summa" value={`${fmt(stats.revenue_active)} so'm`} accent="#d97706" />
          <StatCard label="Yig'ilgan avans" value={`${fmt(stats.advance_active)} so'm`} accent="#16a34a" />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {!error && venues.length === 0 && (
        <div className="empty-state">
          <p>Hali to'yxona qo'shmagansiz.</p>
          <Link to="/owner/venues/new" className="btn btn-primary btn-sm">+ Yangi to'yxona qo'shish</Link>
        </div>
      )}

      {venues.length > 0 && (
        <div className="grid">
          {venues.map((v) => (
            <div key={v.id} className="card venue-card">
              <div className="venue-thumb">
                {v.thumbnail ? <img src={imageUrl(v.thumbnail)} alt={v.name} loading="lazy" /> : <div className="no-img">Rasm yo'q</div>}
              </div>
              <div className="venue-body">
                <h3>{v.name}</h3>
                <p className="muted">{v.district}</p>
                <p style={{ margin: '0.4rem 0' }}><VenueStatus status={v.status} /></p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Link to={`/venues/${v.id}`} className="btn btn-ghost btn-sm">Ko'rish</Link>
                  <Link to={`/owner/venues/${v.id}/edit`} className="btn btn-primary btn-sm">Tahrirlash</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
