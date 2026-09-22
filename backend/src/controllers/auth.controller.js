const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { query } = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} = require('../utils/jwt');

const BCRYPT_SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Register a new user
 */
async function register(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { full_name, email, password, role, organization, phone, district } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Disallow public registration of admin accounts in production
    if (role === 'admin' && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Administrator registration is not permitted.',
      });
    }

    // Check if email already exists (case-insensitive)
    const existingUser = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Auto-resolve university_id if university role
    let resolvedUniId = null;
    if (role === 'university') {
      const uRes = await query(
        "SELECT id FROM universities WHERE name ILIKE '%' || $1 || '%' OR code ILIKE '%' || $1 || '%' LIMIT 1",
        [organization || 'BIT']
      );
      if (uRes.rows.length > 0) {
        resolvedUniId = uRes.rows[0].id;
      }
    }

    // Insert user
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, organization, phone, district, university_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, full_name, email, role, organization, phone, district, state, is_active, university_id, created_at`,
      [full_name, normalizedEmail, password_hash, role, organization || null, phone || null, district || null, resolvedUniId]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
      [user.id, refreshToken, getRefreshTokenExpiry()]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          organization: user.organization,
          phone: user.phone,
          district: user.district,
          state: user.state,
          university_id: user.university_id || null,
        },
        access_token: accessToken,
        accessToken: accessToken,
        token: accessToken,
        refresh_token: refreshToken,
        refreshToken: refreshToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.',
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
async function login(req, res) {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Find user by email (case-insensitive)
    const result = await query(
      'SELECT id, full_name, email, password_hash, role, organization, phone, district, state, is_active, university_id FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact administrator.',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify user-type/role compatibility if login_type context is provided
    const { login_type } = req.body;
    if (login_type) {
      const type = String(login_type).toLowerCase().trim();
      const roleMap = {
        people: ['citizen'],
        university: ['university'],
        admin: ['admin', 'government'],
        industry: ['industry'],
      };

      const allowedRoles = roleMap[type];
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'This account does not belong to the selected user type.',
        });
      }
    }

    // Auto-resolve university_id for university users if not set
    if (user.role === 'university' && !user.university_id) {
      const uRes = await query(
        "SELECT id FROM universities WHERE name ILIKE '%' || $1 || '%' OR code ILIKE '%' || $1 || '%' LIMIT 1",
        [user.organization || 'BIT']
      );
      if (uRes.rows.length > 0) {
        user.university_id = uRes.rows[0].id;
        await query('UPDATE users SET university_id = $1 WHERE id = $2', [user.university_id, user.id]);
      } else {
        const firstUni = await query('SELECT id FROM universities WHERE is_active = true ORDER BY name LIMIT 1');
        if (firstUni.rows.length > 0) {
          user.university_id = firstUni.rows[0].id;
          await query('UPDATE users SET university_id = $1 WHERE id = $2', [user.university_id, user.id]);
        }
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token (remove old ones for this user first — limit to 5 sessions)
    const existingTokens = await query(
      'SELECT id FROM refresh_tokens WHERE user_id = $1 ORDER BY created_at ASC',
      [user.id]
    );
    if (existingTokens.rows.length >= 5) {
      const oldest = existingTokens.rows[0];
      await query('DELETE FROM refresh_tokens WHERE id = $1', [oldest.id]);
    }

    await query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
      [user.id, refreshToken, getRefreshTokenExpiry()]
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          organization: user.organization,
          phone: user.phone,
          district: user.district,
          state: user.state,
          university_id: user.university_id || null,
        },
        access_token: accessToken,
        accessToken: accessToken,
        token: accessToken,
        refresh_token: refreshToken,
        refreshToken: refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
    });
  }
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
async function refresh(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { refresh_token } = req.body;

    // Verify the refresh token JWT
    let decoded;
    try {
      decoded = verifyRefreshToken(refresh_token);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    // Check if token exists in DB and is not expired
    const tokenResult = await query(
      'SELECT id, user_id, expires_at FROM refresh_tokens WHERE token = $1',
      [refresh_token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found. Please login again.',
      });
    }

    const storedToken = tokenResult.rows[0];

    if (new Date(storedToken.expires_at) < new Date()) {
      // Delete expired token
      await query('DELETE FROM refresh_tokens WHERE id = $1', [storedToken.id]);
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please login again.',
      });
    }

    // Get user
    const userResult = await query(
      'SELECT id, full_name, email, role, organization, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.id]);
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
      });
    }

    const user = userResult.rows[0];

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        access_token: newAccessToken,
        accessToken: newAccessToken,
        token: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during token refresh.',
    });
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
async function getMe(req, res) {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching profile.',
    });
  }
}

/**
 * POST /api/auth/logout
 * Invalidate refresh token
 */
async function logout(req, res) {
  try {
    const { refresh_token } = req.body;

    if (refresh_token) {
      // Delete specific refresh token
      await query('DELETE FROM refresh_tokens WHERE token = $1 AND user_id = $2', [
        refresh_token,
        req.user.id,
      ]);
    } else {
      // Delete all refresh tokens for this user (logout from all devices)
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout.',
    });
  }
}

module.exports = { register, login, refresh, getMe, logout };
