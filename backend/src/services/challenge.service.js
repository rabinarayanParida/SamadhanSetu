/**
 * Challenge Service
 * Modular business logic layer for challenge CRUD operations.
 *
 * ARCHITECTURE NOTE: This service encapsulates all challenge data access
 * and business rules. Future AI phases (classification, prioritization,
 * deduplication) should consume the structured challenge objects returned
 * by these methods — NOT rewrite database queries.
 */

const { query, pool } = require('../config/db');
const { generateChallengeId } = require('../utils/challengeId');

/**
 * Create a new challenge (DRAFT status)
 * @param {string} userId - Creator's user ID
 * @param {Object} data - Challenge form data
 * @returns {Object} Created challenge with location
 */
async function createChallenge(userId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const challengeId = await generateChallengeId();

    // Insert challenge
    const challengeResult = await client.query(
      `INSERT INTO challenges
        (challenge_id, user_id, title, description, category_id, affected_population,
         severity, existing_attempts, expected_outcome, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DRAFT')
       RETURNING *`,
      [
        challengeId,
        userId,
        data.title,
        data.description,
        data.category_id || null,
        data.affected_population || null,
        data.severity || null,
        data.existing_attempts || null,
        data.expected_outcome || null,
      ]
    );

    const challenge = challengeResult.rows[0];

    // Insert location if provided
    let location = null;
    if (data.location && (data.location.latitude || data.location.address || data.location.district || data.location.block)) {
      const locResult = await client.query(
        `INSERT INTO challenge_locations
          (challenge_id, latitude, longitude, address, state, district, block, village_city, pincode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          challenge.id,
          data.location.latitude || null,
          data.location.longitude || null,
          data.location.address || null,
          data.location.state || 'Jharkhand',
          data.location.district || null,
          data.location.block || null,
          data.location.village_city || null,
          data.location.pincode || null,
        ]
      );
      location = locResult.rows[0];
    }

    // Record status history: initial creation
    await client.query(
      `INSERT INTO challenge_status_history
        (challenge_id, from_status, to_status, changed_by, comment)
       VALUES ($1, NULL, 'DRAFT', $2, 'Challenge created as draft.')`,
      [challenge.id, userId]
    );

    await client.query('COMMIT');

    return { ...challenge, location };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update an existing challenge (must be in DRAFT status)
 * @param {string} challengeDbId - Challenge UUID
 * @param {string} userId - User ID
 * @param {Object} data - Updated challenge fields
 * @returns {Object} Updated challenge
 */
async function updateChallenge(challengeDbId, userId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update challenge fields
    const result = await client.query(
      `UPDATE challenges SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category_id = $3,
        affected_population = $4,
        severity = $5,
        existing_attempts = $6,
        expected_outcome = $7,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9 AND (status = 'DRAFT' OR status = 'NEEDS_INFORMATION')
       RETURNING *`,
      [
        data.title,
        data.description,
        data.category_id || null,
        data.affected_population || null,
        data.severity || null,
        data.existing_attempts || null,
        data.expected_outcome || null,
        challengeDbId,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Challenge not found, not owned by user, or cannot be edited (only DRAFT and NEEDS_INFORMATION challenges can be edited).');
    }

    const challenge = result.rows[0];

    // Upsert location
    if (data.location) {
      await client.query(
        `INSERT INTO challenge_locations
          (challenge_id, latitude, longitude, address, state, district, block, village_city, pincode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (challenge_id) DO UPDATE SET
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          address = EXCLUDED.address,
          state = EXCLUDED.state,
          district = EXCLUDED.district,
          block = EXCLUDED.block,
          village_city = EXCLUDED.village_city,
          pincode = EXCLUDED.pincode,
          updated_at = CURRENT_TIMESTAMP`,
        [
          challenge.id,
          data.location.latitude || null,
          data.location.longitude || null,
          data.location.address || null,
          data.location.state || 'Jharkhand',
          data.location.district || null,
          data.location.block || null,
          data.location.village_city || null,
          data.location.pincode || null,
        ]
      );
    }

    await client.query('COMMIT');

    return await getChallengeById(challengeDbId, userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Submit a challenge (DRAFT → SUBMITTED)
 * @param {string} challengeDbId - Challenge UUID
 * @param {string} userId - User ID
 * @returns {Object} Submitted challenge
 */
async function submitChallenge(challengeDbId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify challenge exists, belongs to user, and is in DRAFT
    const existing = await client.query(
      'SELECT * FROM challenges WHERE id = $1 AND user_id = $2',
      [challengeDbId, userId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Challenge not found or not owned by user.');
    }

    const challenge = existing.rows[0];

    if (challenge.status !== 'DRAFT' && challenge.status !== 'NEEDS_INFORMATION') {
      throw new Error(`Challenge cannot be submitted. Current status: ${challenge.status}.`);
    }

    // Validate required fields for submission
    if (!challenge.title || !challenge.description) {
      throw new Error('Title and description are required for submission.');
    }

    // Update status
    const result = await client.query(
      `UPDATE challenges SET
        status = 'SUBMITTED',
        submitted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [challengeDbId]
    );

    // Record status history
    const historyComment = challenge.status === 'NEEDS_INFORMATION'
      ? 'Citizen provided additional requested information.'
      : 'Challenge submitted for review.';

    await client.query(
      `INSERT INTO challenge_status_history
        (challenge_id, from_status, to_status, changed_by, comment)
       VALUES ($1, $2, 'SUBMITTED', $3, $4)`,
      [challengeDbId, challenge.status, userId, historyComment]
    );

    await client.query('COMMIT');

    return await getChallengeById(challengeDbId, userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get a single challenge by ID with all related data
 * @param {string} challengeDbId - Challenge UUID
 * @param {string|Object} userOrId - User object or User ID string
 * @returns {Object|null} Challenge with location, media, and category
 */
async function getChallengeById(challengeDbId, userOrId) {
  const userId = typeof userOrId === 'object' ? userOrId?.id : userOrId;
  const role = typeof userOrId === 'object' ? userOrId?.role : 'citizen';
  const universityId = typeof userOrId === 'object' ? userOrId?.university_id : null;

  const isElevated = role === 'admin' || role === 'government' || role === 'university';

  // Get challenge with location and category
  const queryStr = isElevated
    ? `SELECT c.*,
              cc.name AS category_name, cc.slug AS category_slug, cc.icon AS category_icon,
              u.full_name AS submitted_by_name
       FROM challenges c
       LEFT JOIN challenge_categories cc ON cc.id = c.category_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`
    : `SELECT c.*,
              cc.name AS category_name, cc.slug AS category_slug, cc.icon AS category_icon,
              u.full_name AS submitted_by_name
       FROM challenges c
       LEFT JOIN challenge_categories cc ON cc.id = c.category_id
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 AND c.user_id = $2`;

  const queryParams = isElevated ? [challengeDbId] : [challengeDbId, userId];
  const result = await query(queryStr, queryParams);

  if (result.rows.length === 0) return null;

  const challenge = result.rows[0];

  // Get location
  const locResult = await query(
    'SELECT * FROM challenge_locations WHERE challenge_id = $1',
    [challengeDbId]
  );
  challenge.location = locResult.rows[0] || null;

  // Get media
  const mediaResult = await query(
    'SELECT * FROM challenge_media WHERE challenge_id = $1 ORDER BY uploaded_at ASC',
    [challengeDbId]
  );
  challenge.media = mediaResult.rows;

  // Get status history
  const historyResult = await query(
    `SELECT csh.*, u.full_name AS changed_by_name
     FROM challenge_status_history csh
     LEFT JOIN users u ON u.id = csh.changed_by
     WHERE csh.challenge_id = $1
     ORDER BY csh.changed_at DESC`,
    [challengeDbId]
  );
  challenge.status_history = historyResult.rows;

  // For university / elevated roles, attach active assignment details if present
  if (isElevated) {
    try {
      const assignResult = await query(
        `SELECT ca.*, u.name AS university_name, u.code AS university_code
         FROM challenge_assignments ca
         JOIN universities u ON u.id = ca.university_id
         WHERE ca.challenge_id = $1 ${role === 'university' && universityId ? 'AND ca.university_id = $2' : ''}
         ORDER BY ca.assigned_at DESC
         LIMIT 1`,
        role === 'university' && universityId ? [challengeDbId, universityId] : [challengeDbId]
      );
      challenge.assignment = assignResult.rows[0] || null;
    } catch {
      challenge.assignment = null;
    }
  }

  return challenge;
}

/**
 * Get all challenges for a user with pagination
 * @param {string} userId - User ID
 * @param {Object} options - Query options (page, limit, status)
 * @returns {Object} { challenges, total, page, totalPages }
 */
async function getUserChallenges(userId, { page = 1, limit = 10, status = null } = {}) {
  const offset = (page - 1) * limit;

  let countQuery = 'SELECT COUNT(*) FROM challenges WHERE user_id = $1';
  let dataQuery = `
    SELECT c.*,
           cc.name AS category_name, cc.slug AS category_slug, cc.icon AS category_icon,
           cl.district AS loc_district, cl.village_city
    FROM challenges c
    LEFT JOIN challenge_categories cc ON cc.id = c.category_id
    LEFT JOIN challenge_locations cl ON cl.challenge_id = c.id
    WHERE c.user_id = $1`;

  const params = [userId];

  if (status) {
    countQuery += ' AND status = $2';
    dataQuery += ' AND c.status = $2';
    params.push(status);
  }

  dataQuery += ' ORDER BY c.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);

  const countResult = await query(countQuery, status ? [userId, status] : [userId]);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await query(dataQuery, params);

  // Get media counts for each challenge
  const challengeIds = dataResult.rows.map((c) => c.id);
  let mediaCounts = {};
  if (challengeIds.length > 0) {
    const mediaResult = await query(
      `SELECT challenge_id, COUNT(*) as count FROM challenge_media
       WHERE challenge_id = ANY($1) GROUP BY challenge_id`,
      [challengeIds]
    );
    mediaResult.rows.forEach((r) => {
      mediaCounts[r.challenge_id] = parseInt(r.count, 10);
    });
  }

  const challenges = dataResult.rows.map((c) => ({
    ...c,
    media_count: mediaCounts[c.id] || 0,
  }));

  return {
    challenges,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Delete a challenge (DRAFT only)
 * @param {string} challengeDbId - Challenge UUID
 * @param {string} userId - User ID
 * @returns {boolean} Success
 */
async function deleteChallenge(challengeDbId, userId) {
  const result = await query(
    "DELETE FROM challenges WHERE id = $1 AND user_id = $2 AND status = 'DRAFT' RETURNING id",
    [challengeDbId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Challenge not found, not owned by user, or cannot be deleted (only DRAFT challenges can be deleted).');
  }

  return true;
}

/**
 * Get challenge categories
 * @returns {Array} Active categories
 */
async function getCategories() {
  const result = await query(
    'SELECT id, name, slug, description, icon FROM challenge_categories WHERE is_active = true ORDER BY name ASC'
  );
  return result.rows;
}

/**
 * Get citizen's challenge statistics
 * @param {string} userId
 * @returns {Object} Stats counts
 */
async function getCitizenStats(userId) {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status != 'DRAFT') AS total_submitted,
       COUNT(*) FILTER (WHERE status = 'DRAFT') AS drafts,
       COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS submitted,
       COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') AS under_review,
       COUNT(*) FILTER (WHERE status IN ('RESOLVED', 'CLOSED')) AS resolved,
       COUNT(*) AS total
     FROM challenges WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

module.exports = {
  createChallenge,
  updateChallenge,
  submitChallenge,
  getChallengeById,
  getUserChallenges,
  deleteChallenge,
  getCategories,
  getCitizenStats,
};
