const bcrypt = require('bcryptjs');

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const generateOtp = require('../utils/generateOtp');
const { sendOtpEmail } = require('../config/email');
const UserModel = require('../models/user.model');
const OtpModel = require('../models/otp.model');

// OTP amal qilish muddati (millisekundlarda) — 5 daqiqa
const OTP_TTL_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
//  Yordamchi: owner uchun OTP generatsiya qilib, bazaga yozadi va emailga yuboradi
// ---------------------------------------------------------------------------
async function issueAndSendOtp(user) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await OtpModel.deleteByUserId(user.id); // eski kodlarni tozalaymiz
  await OtpModel.create({ userId: user.id, code, expiresAt });

  try {
    await sendOtpEmail(user.email, code);
  } catch (err) {
    // Kod bazaga yozildi, lekin email ketmadi — aniq xato qaytaramiz
    throw new ApiError(502, 'Tasdiqlash kodini emailga yuborib bo\'lmadi. Keyinroq urinib ko\'ring');
  }
}

// ---------------------------------------------------------------------------
//  POST /api/auth/register
//  Oddiy user ro'yxatdan o'tadi. Parol bcrypt bilan hashlanadi.
// ---------------------------------------------------------------------------
const register = asyncHandler(async (req, res) => {
  const { name, surname, email, username, password } = req.body;

  // --- Oddiy validatsiya ---
  if (!name || !surname || !email || !username || !password) {
    throw new ApiError(400, 'Barcha maydonlar to\'ldirilishi shart');
  }
  if (password.length < 6) {
    throw new ApiError(400, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
  }

  // --- Takrorlanishni oldindan tekshirish (chiroyli xabar uchun) ---
  // Asosiy kafolat baza darajasidagi UNIQUE constraint (23505 -> 409).
  if (await UserModel.findByEmail(email)) {
    throw new ApiError(409, 'Bu email allaqachon ro\'yxatdan o\'tgan');
  }
  if (await UserModel.findByUsername(username)) {
    throw new ApiError(409, 'Bu username band');
  }

  // --- Parolni hashlash ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // --- Foydalanuvchini yaratish (role default 'user') ---
  const user = await UserModel.create({
    name,
    surname,
    email,
    username,
    password: hashedPassword,
  });

  res.status(201).json({
    success: true,
    message: 'Ro\'yxatdan muvaffaqiyatli o\'tildi',
    user, // parolsiz (model SAFE_COLUMNS qaytaradi)
  });
});

// ---------------------------------------------------------------------------
//  POST /api/auth/login
//  username + password bilan kirish.
//  Agar owner birinchi marta kirsa (is_verified = false) -> OTP emailga yuboriladi,
//  token BERILMAYDI. Aks holda JWT token qaytariladi.
// ---------------------------------------------------------------------------
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, 'Username va parol kiritilishi shart');
  }

  const user = await UserModel.findByUsername(username);

  // Xavfsizlik uchun: foydalanuvchi topilmasa ham, parol noto'g'ri bo'lsa ham
  // BIR XIL xabar beramiz (qaysi biri xato ekanini oshkor qilmaymiz).
  if (!user) {
    throw new ApiError(401, 'Username yoki parol noto\'g\'ri');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Username yoki parol noto\'g\'ri');
  }

  // --- Owner birinchi marta kirmoqda -> email OTP verifikatsiya talab qilinadi ---
  if (user.role === 'owner' && user.is_verified === false) {
    await issueAndSendOtp(user);

    return res.status(200).json({
      success: true,
      requireOtp: true, // frontend OTP kiritish sahifasiga o'tkazadi
      message: 'Emailingizga 6 xonali tasdiqlash kodi yuborildi',
      email: user.email,
    });
  }

  // --- Oddiy holat: token beriladi ---
  const token = generateToken(user.id, user.role);
  const { password: _pw, ...safeUser } = user;

  res.json({
    success: true,
    message: 'Tizimga muvaffaqiyatli kirildi',
    token,
    user: safeUser,
  });
});

// ---------------------------------------------------------------------------
//  POST /api/auth/verify-otp
//  { email, code } qabul qiladi. To'g'ri bo'lsa is_verified = true qiladi va
//  JWT token qaytaradi. Eskirgan yoki noto'g'ri kodda tegishli xato beradi.
// ---------------------------------------------------------------------------
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new ApiError(400, 'Email va kod kiritilishi shart');
  }

  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new ApiError(404, 'Bunday foydalanuvchi topilmadi');
  }

  if (user.is_verified) {
    throw new ApiError(400, 'Foydalanuvchi allaqachon tasdiqlangan. Iltimos, login qiling');
  }

  const otp = await OtpModel.findLatestByUserId(user.id);
  if (!otp) {
    throw new ApiError(400, 'Tasdiqlash kodi topilmadi. Iltimos, qaytadan login qiling');
  }

  // --- Kod noto'g'ri ---
  if (otp.code !== String(code)) {
    throw new ApiError(400, 'Tasdiqlash kodi noto\'g\'ri');
  }

  // --- Kod eskirgan (5 daqiqa o'tgan) ---
  if (new Date(otp.expires_at) < new Date()) {
    throw new ApiError(400, 'Tasdiqlash kodi muddati tugagan. Qaytadan login qiling');
  }

  // --- Hammasi to'g'ri: tasdiqlaymiz va kodlarni tozalaymiz ---
  const verifiedUser = await UserModel.setVerified(user.id);
  await OtpModel.deleteByUserId(user.id);

  const token = generateToken(verifiedUser.id, verifiedUser.role);

  res.json({
    success: true,
    message: 'Email muvaffaqiyatli tasdiqlandi',
    token,
    user: verifiedUser,
  });
});

module.exports = { register, login, verifyOtp };
