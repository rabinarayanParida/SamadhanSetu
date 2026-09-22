const { query } = require('../config/db');

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Ownership Middleware
 * Verifies the authenticated user owns the challenge before allowing access.
 * Attaches the challenge to req.challenge if found.
 */
async function verifyOwnership(req, res, next) {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;

    if (!challengeId || !UUID_REGEX.test(challengeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid challenge ID format.',
      });
    }

    const result = await query(
      `SELECT c.*, cl.latitude, cl.longitude, cl.address, cl.district AS loc_district,
              cl.block, cl.village_city, cl.pincode,
              cc.name AS category_name, cc.slug AS category_slug, cc.icon AS category_icon
       FROM challenges c
       LEFT JOIN challenge_locations cl ON cl.challenge_id = c.id
       LEFT JOIN challenge_categories cc ON cc.id = c.category_id
       WHERE c.id = $1`,
      [challengeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found.',
      });
    }

    const challenge = result.rows[0];

    if (challenge.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this challenge.',
      });
    }

    req.challenge = challenge;
    next();
  } catch (error) {
    console.error('Ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying challenge ownership.',
    });
  }
}

/**
 * Challenge Access Control Middleware
 * Supports citizen owners, assigned/matched universities, and administrators.
 * Prevents unauthorized cross-role or cross-university access.
 */
async function verifyChallengeAccess(req, res, next) {
  try {
    const challengeId = req.params.id;
    const user = req.user;

    if (!challengeId || !UUID_REGEX.test(challengeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid challenge ID format.',
      });
    }

    const result = await query(
      `SELECT c.*, cl.latitude, cl.longitude, cl.address, cl.district AS loc_district,
              cl.block, cl.village_city, cl.pincode,
              cc.name AS category_name, cc.slug AS category_slug, cc.icon AS category_icon
       FROM challenges c
       LEFT JOIN challenge_locations cl ON cl.challenge_id = c.id
       LEFT JOIN challenge_categories cc ON cc.id = c.category_id
       WHERE c.id = $1`,
      [challengeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found.',
      });
    }

    const challenge = result.rows[0];

    // 1. Admin and Government have universal review oversight
    if (user.role === 'admin' || user.role === 'government') {
      req.challenge = challenge;
      return next();
    }

    // 2. Citizen: only allowed if they are the challenge owner
    if (user.role === 'citizen') {
      if (challenge.user_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this challenge.',
        });
      }
      req.challenge = challenge;
      return next();
    }

    // 3. University: allowed only if assigned or matched to this university
    if (user.role === 'university') {
      let universityId = user.university_id;
      if (!universityId) {
        const uCheck = await query('SELECT university_id FROM users WHERE id = $1', [user.id]);
        universityId = uCheck.rows[0]?.university_id;
      }

      if (!universityId) {
        return res.status(403).json({
          success: false,
          message: 'Your account is not linked to a university.',
        });
      }

      // Check legitimate Phase 5 assignment
      const assignCheck = await query(
        'SELECT id FROM challenge_assignments WHERE challenge_id = $1 AND university_id = $2 LIMIT 1',
        [challengeId, universityId]
      );

      // Check legitimate Phase 5 AI match
      const matchCheck = await query(
        'SELECT id FROM challenge_matches WHERE challenge_id = $1 AND university_id = $2 LIMIT 1',
        [challengeId, universityId]
      );

      if (assignCheck.rows.length === 0 && matchCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this challenge. It is not assigned or matched to your institution.',
        });
      }

      req.challenge = challenge;
      return next();
    }

    // 4. Industry or any other unauthorized role
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this challenge.',
    });
  } catch (error) {
    console.error('Challenge access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying challenge access.',
    });
  }
}

module.exports = { verifyOwnership, verifyChallengeAccess };
