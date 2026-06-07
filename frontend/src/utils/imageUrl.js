// ---------------------------------------------------------------------------
//  imageUrl — rasm manzilini to'g'ri shaklga keltiradi.
//   - to'liq URL (http/https, masalan picsum) -> o'zgarmaydi
//   - '/uploads/...' nisbiy yo'l -> backend manziliga bog'lanadi
//
//  Backend manzili VITE_API_URL dan '/api' ni olib tashlash orqali olinadi.
//  Masalan: VITE_API_URL=https://toyxona.onrender.com/api
//           -> FILE_BASE=https://toyxona.onrender.com
//  VITE_API_URL bo'sh ('/api') bo'lsa -> FILE_BASE='' (Vite proxy ishlaydi)
// ---------------------------------------------------------------------------
const API = import.meta.env.VITE_API_URL || '/api';
const FILE_BASE = API.replace(/\/api\/?$/, '');

export const imageUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url; // allaqachon to'liq URL
  return `${FILE_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};
