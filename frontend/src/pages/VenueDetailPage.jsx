import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import ImageGallery from '../components/ImageGallery';
import Calendar from '../components/Calendar';
import BookingForm from '../components/BookingForm';
import Spinner from '../components/Spinner';

const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');

// ---------------------------------------------------------------------------
//  VenueDetailPage — to'yxonaning to'liq ma'lumoti + kalendar + bron qilish
// ---------------------------------------------------------------------------
export default function VenueDetailPage() {
  const { id } = useParams();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [venue, setVenue] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // tanlangan kun {date, status}

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [vRes, cRes] = await Promise.all([
        api.get(`/venues/${id}`),
        api.get(`/venues/${id}/calendar`),
      ]);
      setVenue(vRes.data.venue);
      setCalendar(cRes.data.calendar || []);
    } catch (err) {
      setError(err.response?.data?.message || 'To\'yxona topilmadi');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="center-box">
        <p className="error">{error}</p>
        <Link to="/" className="btn btn-primary">Bosh sahifaga</Link>
      </div>
    );
  }
  if (!venue) return null;

  // Band kun ma'lumotini faqat admin yoki egasi ko'radi
  const isAdmin = user?.role === 'admin';
  const isOwner = user && venue.owner && venue.owner.id === user.userId;
  const canSeeBookingInfo = isAdmin || isOwner;

  const bookedBooking =
    selected?.status === 'booked'
      ? (venue.bookings || []).find(
          (b) => b.booking_date === selected.date && b.status === 'endi bo\'ladigan'
        )
      : null;

  const onBooked = async () => {
    setSelected(null);
    await load(); // kalendar va bronlar yangilanadi
  };

  return (
    <div className="venue-detail">
      <div className="vd-header">
        <h1>{venue.name}</h1>
        <span className="badge">{venue.district}</span>
        {venue.status !== 'tasdiqlangan' && (
          <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
            {venue.status}
          </span>
        )}
      </div>

      <div className="vd-grid">
        {/* --- Chap: ma'lumot --- */}
        <div className="vd-main">
          <ImageGallery images={venue.images} />

          <div className="vd-info card">
            <h3>Ma'lumot</h3>
            <div className="info-rows">
              <div><span className="muted">Narx:</span> <b>{fmt(venue.price_per_seat)} so'm / o'rindiq</b></div>
              <div><span className="muted">Sig'im:</span> {venue.capacity} kishi</div>
              <div><span className="muted">Telefon:</span> {venue.phone}</div>
              <div><span className="muted">Manzil:</span> {venue.address}</div>
            </div>
            {venue.description && <p style={{ marginBottom: 0 }}>{venue.description}</p>}
          </div>

          {venue.singers?.length > 0 && (
            <div className="vd-info card">
              <h3>Honandalar</h3>
              <div className="service-list">
                {venue.singers.map((s) => (
                  <div key={s.id} className="service-item">
                    {s.image_url && <img src={s.image_url} alt={s.name} />}
                    <div>
                      <b>{s.name}</b>
                      <div className="muted">{fmt(s.price)} so'm</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {venue.cars?.length > 0 && (
            <div className="vd-info card">
              <h3>Mashinalar</h3>
              <div className="service-list">
                {venue.cars.map((c) => (
                  <div key={c.id} className="service-item">
                    {c.image_url && <img src={c.image_url} alt={c.brand} />}
                    <div>
                      <b>{c.brand}</b>
                      <div className="muted">{fmt(c.price)} so'm</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {venue.menu_items?.length > 0 && (
            <div className="vd-info card">
              <h3>Menyu</h3>
              <ul className="menu-list">
                {venue.menu_items.map((m) => (
                  <li key={m.id}>{m.name}</li>
                ))}
              </ul>
            </div>
          )}

          {venue.karnay_surnay && (
            <div className="vd-info card">
              <h3>Karnay-surnay</h3>
              {venue.karnay_surnay.available ? (
                <p style={{ margin: 0 }}>Mavjud — {fmt(venue.karnay_surnay.price)} so'm</p>
              ) : (
                <p className="muted" style={{ margin: 0 }}>Mavjud emas</p>
              )}
            </div>
          )}
        </div>

        {/* --- O'ng: kalendar + bron --- */}
        <div className="vd-side">
          <Calendar calendar={calendar} selectedDate={selected} onSelectDate={setSelected} />

          {/* Bo'sh kun -> bron formasi (kirish kerak) */}
          {selected?.status === 'free' &&
            (token ? (
              <BookingForm venue={venue} date={selected.date} onBooked={onBooked} />
            ) : (
              <div className="card vd-info">
                <p style={{ margin: 0 }}>
                  Bron qilish uchun <Link to="/login">tizimga kiring</Link>.
                </p>
              </div>
            ))}

          {/* Band kun -> ma'lumot (faqat admin/owner) */}
          {selected?.status === 'booked' && (
            <div className="card vd-info">
              <h3>{selected.date} — Band</h3>
              {canSeeBookingInfo && bookedBooking ? (
                <div className="info-rows">
                  <div>
                    <span className="muted">Kim:</span> {bookedBooking.customer_name}{' '}
                    {bookedBooking.customer_surname}
                  </div>
                  <div><span className="muted">Telefon:</span> {bookedBooking.customer_phone}</div>
                  <div><span className="muted">Odam soni:</span> {bookedBooking.guest_count}</div>
                </div>
              ) : (
                <p className="muted" style={{ margin: 0 }}>Bu kun band.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
