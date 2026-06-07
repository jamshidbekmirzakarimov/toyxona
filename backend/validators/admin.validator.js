const { body } = require('express-validator');

// ---------------------------------------------------------------------------
//  Admin: yangi ega yaratish uchun express-validator zanjiri
// ---------------------------------------------------------------------------
const createOwnerRules = [
  body('name').trim().notEmpty().withMessage('Ism majburiy'),
  body('surname').trim().notEmpty().withMessage('Familiya majburiy'),
  body('email').trim().isEmail().withMessage('Email formati noto\'g\'ri'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username kamida 3 ta belgi bo\'lishi kerak'),
  body('password').isLength({ min: 6 }).withMessage('Parol kamida 6 ta belgi bo\'lishi kerak'),
];

module.exports = { createOwnerRules };
