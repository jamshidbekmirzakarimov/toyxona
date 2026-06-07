const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
//  generateToken — JWT yaratadi.
//  Payload ichida: userId va role (talab qilingani kabi).
//  Maxfiy kalit (JWT_SECRET) va muddat (JWT_EXPIRES_IN) .env dan olinadi.
// ---------------------------------------------------------------------------
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // standart: 7 kun
  );
};

module.exports = generateToken;
