import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from '../../store/toastStore';
import AdminNav from '../../components/AdminNav';
import ConfirmDialog from '../../components/ConfirmDialog';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import { TASHKENT_DISTRICTS } from '../../utils/districts';

const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');

function VenueStatus({ status }) {
  const cls = status === 'tasdiqlangan' ? 'status-active' : 'status-pending';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
//  AdminVenuesPage — barcha to'yxonalar: filtr/sort + amallar
// ---------------------------------------------------------------------------
export default function AdminVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [owners, setOwners] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // filtr/sort
  const [district, setDistrict] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [order, setOrder] = useState('asc');

  // amal holatlari
  const [deleting, setDeleting] = useState(null); // o'chiriladigan venue
  const [busy, setBusy] = useState(false);
  const [assignVenue, setAssignVenue] = useState(null); // egani biriktirish modali
  const [assignOwnerId, setAssignOwnerId] = useState('');

  const fetchVenues = useCallback(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (district) params.district = district;
    if (status) params.status = status;
    if (sortBy) {
      params.sortBy = sortBy;
      params.order = order;
    }
    return api
      .get('/venues', { params })
      .then((res) => setVenues(res.data.venues || []))
      .catch((err) => setError(err.response?.data?.message || 'Yuklab bo\'lmadi'))
      .finally(() => setLoading(false));
  }, [district, status, sortBy, order]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Egalar (biriktirish dropdown'i uchun) + statistika — bir marta
  useEffect(() => {
    api.get('/admin/owners').then((res) => setOwners(res.data.owners || [])).catch(() => {});
    api.get('/admin/stats').then((res) => setStats(res.data.stats)).catch(() => {});
  }, []);

  // --- Tasdiqlash ---
  const approve = async (v) => {
    setBusy(true);
    try {
      await api.put(`/admin/venues/${v.id}/approve`);
      toast.success('To\'yxona tasdiqlandi');
      await fetchVenues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  // --- Egani biriktirish ---
  const openAssign = (v) => {
    setAssignVenue(v);
    setAssignOwnerId(String(v.owner_id || ''));
  };

  const confirmAssign = async () => {
    if (!assignOwnerId) {
      toast.error('Egani tanlang');
      return;
    }
    setBusy(true);
    try {
      await api.put(`/admin/venues/${assignVenue.id}/assign`, { owner_id: Number(assignOwnerId) });
      toast.success('Egasi biriktirildi');
      setAssignVenue(null);
      await fetchVenues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  // --- O'chirish ---
  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/admin/venues/${deleting.id}`);
      toast.success('To\'yxona o\'chirildi');
      setDeleting(null);
      await fetchVenues();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminNav />

      <div className="page-head">
        <h1>To'yxonalar</h1>
        <Link to="/admin/venues/new" className="btn btn-primary btn-sm">+ Yangi to'yxona</Link>
      </div>

      {stats && (
        <div className="stats-grid">
          <StatCard
            label="To'yxonalar"
            value={stats.venues_total}
            hint={`${stats.venues_approved} tasdiqlangan · ${stats.venues_pending} kutilmoqda`}
          />
          <StatCard label="Egalar" value={stats.owners_total} accent="#16a34a" />
          <StatCard
            label="Aktiv bronlar"
            value={stats.bookings_active}
            hint={`Jami: ${stats.bookings_total}`}
            accent="#0ea5e9"
          />
          <StatCard
            label="Kutilayotgan summa"
            value={`${fmt(stats.revenue_active)} so'm`}
            hint={`Avans: ${fmt(stats.advance_active)} so'm`}
            accent="#d97706"
          />
        </div>
      )}

      {/* Filtr / sort */}
      <div className="filters">
        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">Barcha rayonlar</option>
          {TASHKENT_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Barcha statuslar</option>
          <option value="tasdiqlangan">Tasdiqlangan</option>
          <option value="tasdiqlanmagan">Tasdiqlanmagan</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">Saralashsiz</option>
          <option value="price">Narx</option>
          <option value="capacity">Sig'im</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value)} disabled={!sortBy}>
          <option value="asc">O'sish</option>
          <option value="desc">Kamayish</option>
        </select>
      </div>

      {loading && <Spinner />}
      {error && <p className="error">{error}</p>}
      {!loading && !error && venues.length === 0 && <p className="muted">To'yxona topilmadi.</p>}

      {venues.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Rayon</th>
                <th>Sig'im</th>
                <th>Narx</th>
                <th>Status</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.name}</td>
                  <td>{v.district}</td>
                  <td>{v.capacity}</td>
                  <td>{fmt(v.price_per_seat)}</td>
                  <td><VenueStatus status={v.status} /></td>
                  <td>
                    <div className="row-actions">
                      {v.status !== 'tasdiqlangan' && (
                        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => approve(v)}>
                          Tasdiqlash
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => openAssign(v)}>
                        Ega
                      </button>
                      <Link to={`/admin/venues/${v.id}/edit`} className="btn btn-ghost btn-sm">Tahrirlash</Link>
                      <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => setDeleting(v)}>
                        O'chirish
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* O'chirishni tasdiqlash */}
      <ConfirmDialog
        open={!!deleting}
        title="To'yxonani o'chirish"
        message={deleting ? `"${deleting.name}" to'yxonasi va unga bog'liq barcha ma'lumot o'chiriladi. Davom etasizmi?` : ''}
        confirmText="Ha, o'chirish"
        cancelText="Yo'q"
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {/* Egani biriktirish modali */}
      {assignVenue && (
        <div className="modal-overlay" onClick={() => setAssignVenue(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>Egani biriktirish</h3>
            <p className="muted">{assignVenue.name}</p>
            <select
              className="assign-select"
              value={assignOwnerId}
              onChange={(e) => setAssignOwnerId(e.target.value)}
            >
              <option value="">Egani tanlang...</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.surname} ({o.username})
                </option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setAssignVenue(null)} disabled={busy}>
                Bekor qilish
              </button>
              <button className="btn btn-primary btn-sm" onClick={confirmAssign} disabled={busy}>
                {busy ? '...' : 'Biriktirish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
