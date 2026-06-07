import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from '../../store/toastStore';
import ConfirmDialog from '../../components/ConfirmDialog';
import Spinner from '../../components/Spinner';

const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');
const ACTIVE = 'endi bo\'ladigan';

function StatusBadge({ status }) {
  const cls =
    status === ACTIVE ? 'status-active' : status === 'bekor qilingan' ? 'status-cancelled' : 'status-past';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
//  OwnerBookingsPage — owner to'yxonalaridagi bronlar + bekor qilish
// ---------------------------------------------------------------------------
export default function OwnerBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pending, setPending] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api
      .get('/owner/bookings')
      .then((res) => setBookings(res.data.bookings || []))
      .catch((err) => setError(err.response?.data?.message || 'Yuklab bo\'lmadi'))
      .finally(() => setLoading(false));
  }, []);

  const confirmCancel = async () => {
    if (!pending) return;
    setCancelling(true);
    try {
      const res = await api.delete(`/owner/bookings/${pending.id}`);
      const newStatus = res.data?.booking?.status || 'bekor qilingan';
      setBookings((prev) => prev.map((b) => (b.id === pending.id ? { ...b, status: newStatus } : b)));
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
      <div className="page-head">
        <h1>To'yxonalarim bronlari</h1>
        <Link to="/owner" className="btn btn-ghost btn-sm">← To'yxonalarim</Link>
      </div>

      {error && <p className="error">{error}</p>}

      {!error && bookings.length === 0 && (
        <div className="empty-state">
          <p>Hozircha bron yo'q.</p>
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
                <th>Mijoz</th>
                <th>Telefon</th>
                <th>Status</th>
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
                  <td>{b.customer_name} {b.customer_surname}</td>
                  <td>{b.customer_phone}</td>
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
        message={
          pending
            ? `${pending.customer_name} ${pending.customer_surname} — ${pending.booking_date} bronini bekor qilasizmi?`
            : ''
        }
        confirmText="Ha, bekor qilish"
        cancelText="Yo'q"
        loading={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
