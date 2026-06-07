const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// ---------------------------------------------------------------------------
//  validate — express-validator natijasini tekshiradi.
//  Validator zanjirlaridan KEYIN qo'yiladi. Xato bo'lsa, barcha xabarlarni
//  yig'ib, global error handler'ga 400 ApiError sifatida uzatadi.
//
//  Foydalanish:
//    router.post('/login', loginRules, validate, login);
// ---------------------------------------------------------------------------
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const message = result
    .array()
    .map((e) => e.msg)
    .join('; ');

  return next(new ApiError(400, 'Validatsiya xatosi: ' + message));
};

module.exports = validate;
