import axios from 'axios';

// ---------------------------------------------------------------------------
//  Axios instance — barcha API so'rovlari shu orqali ketadi.
//  baseURL: .env dagi VITE_API_URL, bo'lmasa '/api' (Vite proxy backendga
//  yo'naltiradi — dev'da CORS muammosi bo'lmaydi).
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// --- Request interceptor: JWT tokenni avtomatik header'ga qo'shadi ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: 401 da tokenni tozalab login'ga yo'naltiradi ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
