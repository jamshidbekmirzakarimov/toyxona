import { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import { toast } from '../../store/toastStore';
import AdminNav from '../../components/AdminNav';
import ConfirmDialog from '../../components/ConfirmDialog';
import Spinner from '../../components/Spinner';
import { TASHKENT_DISTRICTS } from '../../utils/districts';

const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');
const ACTIVE = 'endi bo\'ladigan';

function StatusBadge({ status }) {
  const cls =
    status === ACTIVE ? 'status-active' : status === 'bekor qilingan' ? 'status-cancelled' : 'status-past';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
//  AdminBookingsPage — barcha bronlar: filtr/sort + bekor qilish
// ---------------------------------------------------------------------------
export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // filtr/sort (default: sana o'sish bo'yicha)
  const [district, setDistrict] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('asc');

  const [pending, setPending] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { sortBy, order };
    if (district) params.district = district;
    if (status) params.status = status;
    return api
      .get('/admin/bookings', { params })
      .then((res) => setBookings(res.data.bookings || []))
      .catch((err) => setError(err.response?.data?.message || 'Yuklab bo\'lmadi'))
      .finally(() => setLoading(false));
  }, [district, status, sortBy, order]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const confirmCancel = async () => {
    if (!pending) return;
    setCancelling(true);
    try {
      await api.delete(`/admin/bookings/${pending.id}`);
      toast.success('Bron bekor qilindi');
      setPending(null);
      await fetchBookings(); // refetch
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bekor qilishda xatolik');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <AdminNav />
      <h1>Barcha bronlar</h1>

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
          <option value="endi bo'ladigan">endi bo'ladigan</option>
          <option value="bo'lib o'tgan">bo'lib o'tgan</option>
          <option value="bekor qilingan">bekor qilingan</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">Sana bo'yicha</option>
          <option value="venue">To'yxona bo'yicha</option>
          <option value="district">Rayon bo'yicha</option>
          <option value="status">Status bo'yicha</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="asc">O'sish</option>
          <option value="desc">Kamayish</option>
        </select>
      </div>

      {loading && <Spinner />}
      {error && <p className="error">{error}</p>}
      {!loading && !error && bookings.length === 0 && <p className="muted">Bron topilmadi.</p>}

      {bookings.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>To'yxona</th>
                <th>Rayon</th>
                <th>Sana</th>
                <th>Odam</th>
                <th>Mijoz</th>
                <th>Summa</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.venue_name}</td>
                  <td>{b.venue_district}</td>
                  <td>{b.booking_date}</td>
                  <td>{b.guest_count}</td>
                  <td>{b.customer_name} {b.customer_surname}</td>
                  <td>{fmt(b.total_price)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    {b.status === ACTIVE && (
                      <button className="btn btn-danger btn-sm" onClick={() => setPending(b)}>
                        Bekor qilish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pending}
        title="Bronni bekor qilish"
        message={pending ? `${pending.venue_name} — ${pending.booking_date} bronini bekor qilasizmi?` : ''}
        confirmText="Ha, bekor qilish"
        cancelText="Yo'q"
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
