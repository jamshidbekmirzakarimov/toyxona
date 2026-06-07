const ApiError = require('../utils/ApiError');

// ---------------------------------------------------------------------------
//  authorize(...roles) — rol bo'yicha ruxsatni tekshiruvchi middleware.
//
//  protect middleware'idan KEYIN ishlatiladi (chunki req.user shu yerda kerak).
//  Bir yoki bir nechta rol berish mumkin.
//
//  Foydalanish:
//    router.delete('/venues/:id', protect, authorize('admin'), deleteVenue);
//    router.post('/venues', protect, authorize('owner', 'admin'), createVenue);
// ---------------------------------------------------------------------------
const authorize = (...roles) => {
  return (req, res, next) => {
    // protect ishlamagan bo'lsa (req.user yo'q) — himoyalanmagan route
    if (!req.user) {
      return next(new ApiError(401, 'Avtorizatsiya talab qilinadi'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Bu amalni bajarishga ruxsatingiz yo\'q'));
    }

    next();
  };
};

module.exports = authorize;
