// ---------------------------------------------------------------------------
//  Qayta ishlatiladigan forma validatorlari
// ---------------------------------------------------------------------------
export const isRequired = (v) => typeof v === 'string' && v.trim().length > 0;

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

export const minLen = (v, n) => typeof v === 'string' && v.trim().length >= n;

// 6 xonali OTP kod
export const isOtpCode = (v) => /^\d{6}$/.test(String(v || '').trim());
