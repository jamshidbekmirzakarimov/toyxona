import { create } from 'zustand';
import api from '../utils/api';

// ---------------------------------------------------------------------------
//  Auth store (Zustand) — joriy user, token va rolni saqlaydi.
//  Token va user localStorage'da saqlanadi (sahifa yangilanganda tiklanadi).
//  api.js interceptor'i tokenni localStorage'dan o'qiydi.
// ---------------------------------------------------------------------------

// localStorage'ga yozib, set uchun obyekt qaytaradi
const persistAuth = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  return { token, user };
};

// Boshlang'ich holatni localStorage'dan tiklash
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

const useAuthStore = create((set) => ({
  token: storedToken || null,
  user: storedUser ? JSON.parse(storedUser) : null,

  // Kirish: token qaytsa saqlaymiz; owner birinchi marta kirsa OTP talab qilinadi
  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    if (data.requireOtp) {
      return { requireOtp: true, email: data.email };
    }
    set(persistAuth(data.token, data.user));
    return { requireOtp: false, user: data.user };
  },

  // Owner email OTP ni tasdiqlaydi -> token
  verifyOtp: async (email, code) => {
    const { data } = await api.post('/auth/verify-otp', { email, code });
    set(persistAuth(data.token, data.user));
    return data.user;
  },

  // Oddiy user ro'yxatdan o'tishi (token bermaydi, keyin login qiladi)
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data.user;
  },

  // Chiqish
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
