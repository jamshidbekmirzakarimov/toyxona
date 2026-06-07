import { useEffect, useState } from 'react';
import api from '../utils/api';
import VenueCard from '../components/VenueCard';
import { SkeletonGrid } from '../components/Skeleton';
import { TASHKENT_DISTRICTS } from '../utils/districts';

// ---------------------------------------------------------------------------
//  HomePage — tasdiqlangan to'yxonalar (foydalanuvchi uchun).
//  Qidiruv (debounce) + rayon filtri + narx/sig'im saralash (asc/desc).
//  Har o'zgarishda API'ga query bilan qayta so'rov yuboriladi.
// ---------------------------------------------------------------------------
export default function HomePage() {
  // filtr/sort holatlari
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [order, setOrder] = useState('asc');

  // ma'lumot holatlari
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Qidiruvni debounce qilamiz (har harfda emas, 400ms dan keyin so'rov)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Filtr/sort o'zgarganda API'ga so'rov. `ignore` — eskirgan javobni e'tiborsiz qoldiradi.
  useEffect(() => {
    let ignore = false;

    const params = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (district) params.district = district;
    if (sortBy) {
      params.sortBy = sortBy;
      params.order = order;
    }

    setLoading(true);
    setError('');

    api
      .get('/venues', { params })
      .then((res) => {
        if (!ignore) setVenues(res.data.venues || []);
      })
      .catch(() => {
        if (!ignore) setError('To\'yxonalarni yuklab bo\'lmadi (backend ishlayaptimi?)');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, district, sortBy, order]);

  const hasFilters = Boolean(search || district || sortBy);

  const resetFilters = () => {
    setSearch('');
    setDistrict('');
    setSortBy('');
    setOrder('asc');
  };

  return (
    <div>
      {/* --- Hero banner --- */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Orzuingizdagi to'yni biz bilan rejalashtiring</h1>
          <p className="hero-sub">
            Toshkentdagi eng zo'r to'yxonalarni toping, bo'sh kunlarni kalendardan ko'ring
            va bir necha daqiqada online bron qiling.
          </p>
        </div>
      </section>

      <h1>To'yxonalar</h1>

      {/* --- Qidiruv / filtr / saralash paneli --- */}
      <div className="filters">
        <input
          type="text"
          placeholder="Nom bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">Barcha rayonlar</option>
          {TASHKENT_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">Saralashsiz</option>
          <option value="price">Narx bo'yicha</option>
          <option value="capacity">Sig'im bo'yicha</option>
        </select>

        <select
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          disabled={!sortBy}
          title={sortBy ? '' : 'Avval saralash turini tanlang'}
        >
          <option value="asc">O'sish (asc)</option>
          <option value="desc">Kamayish (desc)</option>
        </select>

        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
            Tozalash
          </button>
        )}
      </div>

      {/* --- Holatlar --- */}
      {loading && <SkeletonGrid />}
      {error && <p className="error">{error}</p>}

      {!loading && !error && venues.length === 0 && (
        <div className="empty-state">
          <p>Natija topilmadi.</p>
          {hasFilters && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
              Filtrlarni tozalash
            </button>
          )}
        </div>
      )}

      {!loading && !error && venues.length > 0 && (
        <>
          <p className="muted">{venues.length} ta to'yxona topildi</p>
          <div className="grid">
            {venues.map((v) => (
              <VenueCard key={v.id} venue={v} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
