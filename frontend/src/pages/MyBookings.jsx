import { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from '../store/toastStore';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';

const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');
const ACTIVE = 'endi bo\'ladigan';

// Status uchun rangli yorliq
function StatusBadge({ status }) {
  const cls =
    status === ACTIVE ? 'status-active' : status === 'bekor qilingan' ? 'status-cancelled' : 'status-past';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
//  MyBookings — joriy foydalanuvchining bronlari + bekor qilish
// ---------------------------------------------------------------------------
export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pending, setPending] = useState(null); // bekor qilinadigan bron
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api
      .get('/bookings/my')
      .then((res) => setBookings(res.data.bookings || []))
      .catch((err) => setError(err.response?.data?.message || 'Yuklab bo\'lmadi'))
      .finally(() => setLoading(false));
  }, []);

  const confirmCancel = async () => {
    if (!pending) return;
    setCancelling(true);
    try {
      const res = await api.delete(`/bookings/${pending.id}`);
      const newStatus = res.data?.booking?.status || 'bekor qilingan';
      setBookings((prev) =>
        prev.map((b) => (b.id === pending.id ? { ...b, status: newStatus } : b))
      );
      toast.success('Bron bekor qilindi');
      setPending(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bekor qilishda xatolik');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1>Mening bronlarim</h1>
      {error && <p className="error">{error}</p>}

      {!error && bookings.length === 0 && (
        <div className="empty-state">
          <p>Sizda hali bron yo'q.</p>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>To'yxona</th>
                <th>Sana</th>
                <th>Odam soni</th>
                <th>Status</th>
                <th>Avans</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.venue_name}</td>
                  <td>{b.booking_date}</td>
                  <td>{b.guest_count}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>{fmt(b.advance_paid)} so'm</td>
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
        message={pending ? `"${pending.venue_name}" — ${pending.booking_date} bronini bekor qilasizmi?` : ''}
        confirmText="Ha, bekor qilish"
        cancelText="Yo'q"
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
