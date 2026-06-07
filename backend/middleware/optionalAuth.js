const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
//  optionalAuth — token MAJBURIY EMAS bo'lgan route'lar uchun.
//
//  Token bo'lsa va to'g'ri bo'lsa -> req.user o'rnatiladi (masalan admin
//  qo'shimcha filtrlardan foydalanishi uchun). Token bo'lmasa yoki yaroqsiz
//  bo'lsa -> mehmon (guest) sifatida davom etadi, XATO QAYTARMAYDI.
//
//  Solishtirish uchun: protect (auth.js) token bo'lmasa 401 qaytaradi.
// ---------------------------------------------------------------------------
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { userId: decoded.userId, role: decoded.role };
    } catch {
      // Yaroqsiz/eskirgan token — bloklamaymiz, mehmon sifatida davom etamiz
    }
  }

  next();
};

module.exports = optionalAuth;
