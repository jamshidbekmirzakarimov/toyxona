import { useState } from 'react';
import { imageUrl } from '../utils/imageUrl';

// ---------------------------------------------------------------------------
//  ImageGallery — asosiy rasm + thumbnail'lar
//  images: [{ image_url }, ...]
// ---------------------------------------------------------------------------
export default function ImageGallery({ images = [] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return <div className="gallery-empty">Rasm yo'q</div>;
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={imageUrl(images[active]?.image_url)} alt="To'yxona surati" />
      </div>

      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              className={`gallery-thumb ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              <img src={imageUrl(img.image_url)} alt={`surat ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
