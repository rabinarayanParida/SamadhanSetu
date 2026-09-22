const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Generate an access token (short-lived)
 * @param {Object} user - User object with id, email, role
 * @returns {string} JWT access token
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
}

/**
 * Generate a refresh token (long-lived)
 * @param {Object} user - User object with id
 * @returns {string} JWT refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, jti: uuidv4() },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRY }
  );
}

/**
 * Verify an access token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/**
 * Verify a refresh token
 * @param {string} token - JWT refresh token string
 * @returns {Object} Decoded payload
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

/**
 * Calculate refresh token expiry date
 * @returns {Date} Expiry date (7 days from now by default)
 */
function getRefreshTokenExpiry() {
  const match = REFRESH_EXPIRY.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return new Date(Date.now() + value * (multipliers[unit] || 86400000));
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
};
