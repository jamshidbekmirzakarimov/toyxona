// ---------------------------------------------------------------------------
//  ApiError — boshqariladigan (operatsion) xatolar uchun maxsus klass.
//
//  Controller ichida bilib turib xato qaytarmoqchi bo'lsak:
//    throw new ApiError(404, 'To'yxona topilmadi');
//    throw new ApiError(401, 'Avtorizatsiya talab qilinadi');
//
//  Global error handler statusCode ni o'qib, to'g'ri javob qaytaradi.
// ---------------------------------------------------------------------------
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // dasturchi kutgan xato (server crash emas)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
