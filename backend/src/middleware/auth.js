const { verifyAccessToken } = require('../utils/jwt');
const { query } = require('../config/db');

/**
 * Authentication Middleware
 * Verifies JWT from Authorization header and attaches user to request
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
    }

    // Verify the token
    const decoded = verifyAccessToken(token);

    // Verify user still exists and is active
    const result = await query(
      'SELECT id, full_name, email, role, organization, phone, district, state, is_active, university_id FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Contact administrator.',
      });
    }

    // Auto-resolve university_id for university users if not explicitly set
    if (user.role === 'university' && !user.university_id) {
      const uRes = await query(
        "SELECT id FROM universities WHERE name ILIKE '%' || $1 || '%' OR code ILIKE '%' || $1 || '%' LIMIT 1",
        [user.organization || 'BIT']
      );
      if (uRes.rows.length > 0) {
        user.university_id = uRes.rows[0].id;
        query('UPDATE users SET university_id = $1 WHERE id = $2', [user.university_id, user.id]).catch(() => {});
      } else {
        // Default to first active university
        const firstUni = await query('SELECT id FROM universities WHERE is_active = true ORDER BY name LIMIT 1');
        if (firstUni.rows.length > 0) {
          user.university_id = firstUni.rows[0].id;
          query('UPDATE users SET university_id = $1 WHERE id = $2', [user.university_id, user.id]).catch(() => {});
        }
      }
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please refresh or login again.',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
}

/**
 * Role-Based Authorization Middleware
 * Checks if the authenticated user has one of the allowed roles
 * @param  {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
