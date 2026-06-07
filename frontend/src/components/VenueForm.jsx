import { useEffect, useState } from 'react';
import { toast } from '../store/toastStore';
import { TASHKENT_DISTRICTS } from '../utils/districts';
import { imageUrl } from '../utils/imageUrl';

const isNonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const phoneOk = (v) => /^\+?[0-9\s\-()]{7,20}$/.test(String(v || '').trim());
const nonNegNum = (v) => v !== '' && !Number.isNaN(Number(v)) && Number(v) >= 0;

// ---------------------------------------------------------------------------
//  VenueForm — qayta ishlatiladigan to'yxona formasi (Owner va Admin uchun).
//   - rasm yuklash (create), mavjud rasmlar (edit, read-only)
//   - dinamik honanda/mashina/menyu (qo'shish/o'chirish)
//   - karnay-surnay checkbox + narx
//   - to'liq validatsiya
//
//  props:
//   isEdit, initial (prefill uchun venue), submitting, submitLabel,
//   onValidSubmit({ form, singers, cars, menu, karnay, images })
// ---------------------------------------------------------------------------
export default function VenueForm({ isEdit, initial, submitting, submitLabel, onValidSubmit }) {
  const [form, setForm] = useState({
    name: '', district: '', address: '', capacity: '', price_per_seat: '', phone: '', description: '',
  });
  const [singers, setSingers] = useState([]);
  const [cars, setCars] = useState([]);
  const [menu, setMenu] = useState([]);
  const [karnay, setKarnay] = useState({ enabled: false, price: '' });
  const [images, setImages] = useState([]); // File[] (create)
  const [existingImages, setExistingImages] = useState([]); // edit ko'rsatish
  const [errors, setErrors] = useState({});

  // Edit: prefill
  useEffect(() => {
    if (!initial) return;
    const v = initial;
    setForm({
      name: v.name,
      district: v.district,
      address: v.address,
      capacity: String(v.capacity),
      price_per_seat: String(v.price_per_seat),
      phone: v.phone,
      description: v.description || '',
    });
    setSingers((v.singers || []).map((s) => ({ name: s.name, price: String(s.price), image_url: s.image_url })));
    setCars((v.cars || []).map((c) => ({ brand: c.brand, price: String(c.price), image_url: c.image_url })));
    setMenu((v.menu_items || []).map((m) => ({ name: m.name })));
    setKarnay(
      v.karnay_surnay
        ? { enabled: !!v.karnay_surnay.available, price: String(v.karnay_surnay.price) }
        : { enabled: false, price: '' }
    );
    setExistingImages(v.images || []);
  }, [initial]);

  const setField = (k, val) => {
    setForm((f) => ({ ...f, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const addSinger = () => setSingers([...singers, { name: '', price: '' }]);
  const updSinger = (i, k, val) => setSingers(singers.map((s, idx) => (idx === i ? { ...s, [k]: val } : s)));
  const rmSinger = (i) => setSingers(singers.filter((_, idx) => idx !== i));

  const addCar = () => setCars([...cars, { brand: '', price: '' }]);
  const updCar = (i, k, val) => setCars(cars.map((c, idx) => (idx === i ? { ...c, [k]: val } : c)));
  const rmCar = (i) => setCars(cars.filter((_, idx) => idx !== i));

  const addMenu = () => setMenu([...menu, { name: '' }]);
  const updMenu = (i, val) => setMenu(menu.map((m, idx) => (idx === i ? { name: val } : m)));
  const rmMenu = (i) => setMenu(menu.filter((_, idx) => idx !== i));

  const validate = () => {
    const e = {};
    if (!isNonEmpty(form.name)) e.name = 'Nom majburiy';
    if (!isNonEmpty(form.district)) e.district = 'Rayon majburiy';
    if (!isNonEmpty(form.address)) e.address = 'Manzil majburiy';
    if (!phoneOk(form.phone)) e.phone = 'Telefon formati noto\'g\'ri';

    const cap = Number(form.capacity);
    if (!Number.isInteger(cap) || cap <= 0) e.capacity = 'Sig\'im musbat butun son bo\'lishi kerak';
    const pps = Number(form.price_per_seat);
    if (Number.isNaN(pps) || pps <= 0) e.price_per_seat = 'Narx musbat son bo\'lishi kerak';

    singers.forEach((s, i) => {
      if (!isNonEmpty(s.name)) e[`singer_${i}_n`] = 'Nomi majburiy';
      if (!nonNegNum(s.price)) e[`singer_${i}_p`] = 'Narx >= 0';
    });
    cars.forEach((c, i) => {
      if (!isNonEmpty(c.brand)) e[`car_${i}_n`] = 'Nomi majburiy';
      if (!nonNegNum(c.price)) e[`car_${i}_p`] = 'Narx >= 0';
    });
    menu.forEach((m, i) => {
      if (!isNonEmpty(m.name)) e[`menu_${i}`] = 'Taom nomi majburiy';
    });
    if (karnay.enabled && !nonNegNum(karnay.price)) e.karnay = 'Karnay narxi >= 0 bo\'lishi kerak';
    if (!isEdit && images.length === 0) e.images = 'Kamida 1 ta surat yuklang';

    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Formada xatolar bor, tekshiring');
      return;
    }
    onValidSubmit({ form, singers, cars, menu, karnay, images });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* --- Asosiy ma'lumot --- */}
      <div className="form">
        <label>
          Nom
          <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={errors.name ? 'input-error' : ''} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>

        <label>
          Rayon
          <select value={form.district} onChange={(e) => setField('district', e.target.value)} className={errors.district ? 'input-error' : ''}>
            <option value="">Tanlang...</option>
            {TASHKENT_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.district && <span className="field-error">{errors.district}</span>}
        </label>

        <label>
          Manzil
          <input value={form.address} onChange={(e) => setField('address', e.target.value)} className={errors.address ? 'input-error' : ''} />
          {errors.address && <span className="field-error">{errors.address}</span>}
        </label>

        <label>
          Sig'im (kishi)
          <input type="number" min="1" value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} className={errors.capacity ? 'input-error' : ''} />
          {errors.capacity && <span className="field-error">{errors.capacity}</span>}
        </label>

        <label>
          Narx (1 o'rindiq)
          <input type="number" min="0" value={form.price_per_seat} onChange={(e) => setField('price_per_seat', e.target.value)} className={errors.price_per_seat ? 'input-error' : ''} />
          {errors.price_per_seat && <span className="field-error">{errors.price_per_seat}</span>}
        </label>

        <label>
          Telefon
          <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+998901234567" className={errors.phone ? 'input-error' : ''} />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </label>

        <label>
          Tavsif (ixtiyoriy)
          <textarea rows="3" value={form.description} onChange={(e) => setField('description', e.target.value)} />
        </label>
      </div>

      {/* --- Suratlar --- */}
      <div className="form-section">
        <h3>Suratlar</h3>
        {isEdit ? (
          <>
            <div className="existing-images">
              {existingImages.length > 0 ? (
                existingImages.map((img) => <img key={img.id} src={imageUrl(img.image_url)} alt="surat" />)
              ) : (
                <span className="muted">Surat yo'q</span>
              )}
            </div>
            <p className="file-hint">Tahrirlashda suratlar o'zgartirilmaydi.</p>
          </>
        ) : (
          <>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                setImages([...e.target.files]);
                setErrors((er) => ({ ...er, images: undefined }));
              }}
            />
            <p className="file-hint">{images.length > 0 ? `${images.length} ta fayl tanlandi` : 'Bir nechta rasm tanlashingiz mumkin'}</p>
            {errors.images && <span className="field-error">{errors.images}</span>}
          </>
        )}
      </div>

      {/* --- Honandalar --- */}
      <div className="form-section">
        <h3>Honandalar</h3>
        {singers.map((s, i) => (
          <div className="array-row" key={i}>
            <input placeholder="Nomi" value={s.name} onChange={(e) => updSinger(i, 'name', e.target.value)} className={errors[`singer_${i}_n`] ? 'input-error' : ''} />
            <input className={`price-input ${errors[`singer_${i}_p`] ? 'input-error' : ''}`} type="number" min="0" placeholder="Narx" value={s.price} onChange={(e) => updSinger(i, 'price', e.target.value)} />
            <button type="button" className="row-remove" onClick={() => rmSinger(i)}>×</button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addSinger}>+ Honanda</button>
      </div>

      {/* --- Mashinalar --- */}
      <div className="form-section">
        <h3>Mashinalar</h3>
        {cars.map((c, i) => (
          <div className="array-row" key={i}>
            <input placeholder="Marka" value={c.brand} onChange={(e) => updCar(i, 'brand', e.target.value)} className={errors[`car_${i}_n`] ? 'input-error' : ''} />
            <input className={`price-input ${errors[`car_${i}_p`] ? 'input-error' : ''}`} type="number" min="0" placeholder="Narx" value={c.price} onChange={(e) => updCar(i, 'price', e.target.value)} />
            <button type="button" className="row-remove" onClick={() => rmCar(i)}>×</button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addCar}>+ Mashina</button>
      </div>

      {/* --- Menyu --- */}
      <div className="form-section">
        <h3>Menyu</h3>
        {menu.map((m, i) => (
          <div className="array-row" key={i}>
            <input placeholder="Taom nomi" value={m.name} onChange={(e) => updMenu(i, e.target.value)} className={errors[`menu_${i}`] ? 'input-error' : ''} />
            <button type="button" className="row-remove" onClick={() => rmMenu(i)}>×</button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addMenu}>+ Taom</button>
      </div>

      {/* --- Karnay-surnay --- */}
      <div className="form-section">
        <h3>Karnay-surnay</h3>
        <label className="check-item">
          <input type="checkbox" checked={karnay.enabled} onChange={(e) => setKarnay({ ...karnay, enabled: e.target.checked })} />
          Mavjud
        </label>
        {karnay.enabled && (
          <div style={{ marginTop: 8 }}>
            <input
              type="number"
              min="0"
              placeholder="Karnay narxi"
              value={karnay.price}
              onChange={(e) => {
                setKarnay({ ...karnay, price: e.target.value });
                setErrors((er) => ({ ...er, karnay: undefined }));
              }}
              className={errors.karnay ? 'input-error' : ''}
            />
            {errors.karnay && <span className="field-error" style={{ display: 'block' }}>{errors.karnay}</span>}
          </div>
        )}
      </div>

      <button className="btn btn-primary" disabled={submitting} style={{ marginTop: '1.25rem' }}>
        {submitting ? 'Saqlanmoqda...' : submitLabel}
      </button>
    </form>
  );
}
