const { body } = require('express-validator');

// ---------------------------------------------------------------------------
//  Auth endpointlari uchun express-validator zanjirlari
// ---------------------------------------------------------------------------

const registerRules = [
  body('name').trim().notEmpty().withMessage('Ism majburiy'),
  body('surname').trim().notEmpty().withMessage('Familiya majburiy'),
  body('email').trim().isEmail().withMessage('Email formati noto\'g\'ri'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username kamida 3 ta belgi bo\'lishi kerak'),
  body('password').isLength({ min: 6 }).withMessage('Parol kamida 6 ta belgi bo\'lishi kerak'),
];

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username majburiy'),
  body('password').notEmpty().withMessage('Parol majburiy'),
];

const verifyOtpRules = [
  body('email').trim().isEmail().withMessage('Email formati noto\'g\'ri'),
  body('code').trim().matches(/^\d{6}$/).withMessage('Kod 6 xonali raqam bo\'lishi kerak'),
];

module.exports = { registerRules, loginRules, verifyOtpRules };
