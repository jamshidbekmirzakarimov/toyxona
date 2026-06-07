import { create } from 'zustand';

// ---------------------------------------------------------------------------
//  Toast store (Zustand) — oddiy, tashqi kutubxonasiz toast tizimi.
//  Toaster komponenti shu store'ni o'qib ekranga chiqaradi.
//
//  Foydalanish (istalgan joyda):
//    import { toast } from '../store/toastStore';
//    toast.success('Bajarildi');
//    toast.error('Xatolik');
// ---------------------------------------------------------------------------
let counter = 0;

const useToastStore = create((set, get) => ({
  toasts: [],

  add: (type, message, duration = 3000) => {
    counter += 1;
    const id = counter;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => get().remove(id), duration);
  },

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Qulay yordamchi (komponent ichida hook chaqirmasdan ishlatish uchun)
export const toast = {
  success: (m) => useToastStore.getState().add('success', m),
  error: (m) => useToastStore.getState().add('error', m),
  info: (m) => useToastStore.getState().add('info', m),
};

export default useToastStore;
