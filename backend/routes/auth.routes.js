const express = require('express');
const router = express.Router();

const { register, login, verifyOtp } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { registerRules, loginRules, verifyOtpRules } = require('../validators/auth.validator');

// ---------------------------------------------------------------------------
//  /api/auth  route'lari (express-validator bilan)
// ---------------------------------------------------------------------------

// Oddiy user ro'yxatdan o'tishi
router.post('/register', registerRules, validate, register);

// username + password bilan kirish -> JWT token (yoki owner uchun OTP yuboriladi)
router.post('/login', loginRules, validate, login);

// owner email OTP ni tasdiqlaydi -> is_verified=true va JWT token
router.post('/verify-otp', verifyOtpRules, validate, verifyOtp);

module.exports = router;
