// ---------------------------------------------------------------------------
//  asyncHandler — async controller'larni o'rab oluvchi (wrapper)
//
//  Har bir async route'da try/catch yozish o'rniga, funksiyani shu wrapper'ga
//  o'rab qo'yamiz. Ichidagi Promise rad etilsa (reject), xato avtomatik
//  next() orqali global error handler'ga uzatiladi.
//
//  Foydalanish:
//    router.get('/', asyncHandler(async (req, res) => {
//      const data = await SomeModel.findAll(); // xato bo'lsa avtomatik ushlanadi
//      res.json(data);
//    }));
// ---------------------------------------------------------------------------
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
