const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

// ---------------------------------------------------------------------------
//  protect — JWT tokenni tekshiruvchi middleware.
//
//  Foydalanuvchi "Authorization: Bearer <token>" header'i bilan so'rov yuboradi.
//  Token to'g'ri bo'lsa, payload (userId, role) req.user ga yoziladi va keyingi
//  handler'ga o'tiladi. Aks holda 401 qaytadi.
//
//  Foydalanish:
//    router.get('/profile', protect, getProfile);
// ---------------------------------------------------------------------------
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Avtorizatsiya talab qilinadi (token yo\'q)');
    }

    const token = authHeader.split(' ')[1];

    // jwt.verify muddati o'tgan yoki yaroqsiz tokenda xato (throw) qiladi
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Keyingi handler'lar uchun foydalanuvchi ma'lumotini biriktiramiz
    req.user = { userId: decoded.userId, role: decoded.role };

    next();
  } catch (err) {
    // Bizning ApiError bo'lsa, uni o'zini uzatamiz; aks holda umumiy 401
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, 'Token yaroqsiz yoki muddati tugagan'));
  }
};

module.exports = protect;
