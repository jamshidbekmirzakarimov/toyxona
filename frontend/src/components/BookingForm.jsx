import { useState } from 'react';
import api from '../utils/api';
import { toast } from '../store/toastStore';

const fmt = (n) => Number(n || 0).toLocaleString('uz-UZ');
const ADVANCE_PERCENT = 20;

// ---------------------------------------------------------------------------
//  BookingForm — bo'sh kun tanlanganda chiqadi.
//  Odam soni + xizmatlar (honanda/mashina/karnay) + mijoz ma'lumoti.
//  Tanlovga qarab umumiy narx va 20% avans realtime hisoblanadi.
// ---------------------------------------------------------------------------
export default function BookingForm({ venue, date, onBooked }) {
  const [guestCount, setGuestCount] = useState('');
  const [singerIds, setSingerIds] = useState([]);
  const [carIds, setCarIds] = useState([]);
  const [karnay, setKarnay] = useState(false);
  const [customer, setCustomer] = useState({ name: '', surname: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const toggle = (list, setList, id) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const karnayAvailable = venue.karnay_surnay && venue.karnay_surnay.available;

  // --- Realtime narx hisoblash ---
  const guests = Number(guestCount) || 0;
  const seatTotal = Number(venue.price_per_seat) * guests;
  const singersSum = (venue.singers || [])
    .filter((s) => singerIds.includes(s.id))
    .reduce((a, s) => a + Number(s.price), 0);
  const carsSum = (venue.cars || [])
    .filter((c) => carIds.includes(c.id))
    .reduce((a, c) => a + Number(c.price), 0);
  const karnaySum = karnay && karnayAvailable ? Number(venue.karnay_surnay.price) : 0;

  const total = seatTotal + singersSum + carsSum + karnaySum;
  const advance = (total * ADVANCE_PERCENT) / 100;

  const validate = () => {
    const e = {};
    if (!guests || guests <= 0) e.guestCount = 'Odam soni musbat son bo\'lishi kerak';
    else if (guests > venue.capacity) e.guestCount = `Sig'im ${venue.capacity} kishidan oshmasin`;
    if (!customer.name.trim()) e.name = 'Ism majburiy';
    if (!customer.surname.trim()) e.surname = 'Familiya majburiy';
    if (!customer.phone.trim()) e.phone = 'Telefon majburiy';
    else if (!/^\+?[0-9\s\-()]{7,20}$/.test(customer.phone)) e.phone = 'Telefon formati noto\'g\'ri';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await api.post('/bookings', {
        venue_id: venue.id,
        booking_date: date,
        guest_count: guests,
        selected_services: { singers: singerIds, cars: carIds },
        karnay_surnay: karnay,
        customer_name: customer.name.trim(),
        customer_surname: customer.surname.trim(),
        customer_phone: customer.phone.trim(),
      });
      toast.success('Muvaffaqiyatli to\'landi');
      onBooked();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bron qilishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card vd-info">
      <h3>Bron qilish — {date}</h3>

      <form className="form" onSubmit={submit} noValidate>
        <label>
          Odam soni (sig'im: {venue.capacity})
          <input
            type="number"
            min="1"
            max={venue.capacity}
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            className={errors.guestCount ? 'input-error' : ''}
          />
          {errors.guestCount && <span className="field-error">{errors.guestCount}</span>}
        </label>

        {/* Honandalar */}
        {venue.singers?.length > 0 && (
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Honandalar</div>
            <div className="check-list">
              {venue.singers.map((s) => (
                <label key={s.id} className="check-item">
                  <input
                    type="checkbox"
                    checked={singerIds.includes(s.id)}
                    onChange={() => toggle(singerIds, setSingerIds, s.id)}
                  />
                  {s.name} — {fmt(s.price)} so'm
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Mashinalar */}
        {venue.cars?.length > 0 && (
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Mashinalar</div>
            <div className="check-list">
              {venue.cars.map((c) => (
                <label key={c.id} className="check-item">
                  <input
                    type="checkbox"
                    checked={carIds.includes(c.id)}
                    onChange={() => toggle(carIds, setCarIds, c.id)}
                  />
                  {c.brand} — {fmt(c.price)} so'm
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Karnay-surnay */}
        {karnayAvailable && (
          <label className="check-item">
            <input type="checkbox" checked={karnay} onChange={(e) => setKarnay(e.target.checked)} />
            Karnay-surnay — {fmt(venue.karnay_surnay.price)} so'm
          </label>
        )}

        {/* Mijoz ma'lumoti */}
        <label>
          Ism
          <input
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            className={errors.name ? 'input-error' : ''}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label>
          Familiya
          <input
            value={customer.surname}
            onChange={(e) => setCustomer({ ...customer, surname: e.target.value })}
            className={errors.surname ? 'input-error' : ''}
          />
          {errors.surname && <span className="field-error">{errors.surname}</span>}
        </label>
        <label>
          Telefon
          <input
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            placeholder="+998901234567"
            className={errors.phone ? 'input-error' : ''}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </label>

        {/* Narx xulosasi (realtime) */}
        <div className="price-box">
          <div className="price-row">
            <span>O'rindiq ({guests} × {fmt(venue.price_per_seat)})</span>
            <span>{fmt(seatTotal)}</span>
          </div>
          {singersSum > 0 && (
            <div className="price-row"><span>Honandalar</span><span>{fmt(singersSum)}</span></div>
          )}
          {carsSum > 0 && (
            <div className="price-row"><span>Mashinalar</span><span>{fmt(carsSum)}</span></div>
          )}
          {karnaySum > 0 && (
            <div className="price-row"><span>Karnay-surnay</span><span>{fmt(karnaySum)}</span></div>
          )}
          <div className="price-row price-total">
            <span>Umumiy</span><span>{fmt(total)} so'm</span>
          </div>
          <div className="price-row price-advance">
            <span>Avans ({ADVANCE_PERCENT}%)</span><span>{fmt(advance)} so'm</span>
          </div>
        </div>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Yuborilmoqda...' : 'Bron qilish'}
        </button>
      </form>
    </div>
  );
}
