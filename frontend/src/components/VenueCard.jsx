import { Link } from 'react-router-dom';
import { imageUrl } from '../utils/imageUrl';

// ---------------------------------------------------------------------------
//  VenueCard — bitta to'yxona kartochkasi (ro'yxatda qayta ishlatiladi)
// ---------------------------------------------------------------------------
export default function VenueCard({ venue }) {
  const price = Number(venue.price_per_seat || 0).toLocaleString('uz-UZ');

  return (
    <Link to={`/venues/${venue.id}`} className="card venue-card">
      <div className="venue-thumb">
        {venue.thumbnail ? (
          <img src={imageUrl(venue.thumbnail)} alt={venue.name} loading="lazy" />
        ) : (
          <div className="no-img">Rasm yo'q</div>
        )}
      </div>
      <div className="venue-body">
        <h3>{venue.name}</h3>
        <p className="muted">{venue.district}</p>
        <p className="price">{price} so'm / o'rindiq</p>
        <p className="muted">Sig'im: {venue.capacity} kishi</p>
      </div>
    </Link>
  );
}
