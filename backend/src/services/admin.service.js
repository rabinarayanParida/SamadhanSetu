/**
 * Admin Challenge Review Service
 * Business logic for administrative challenge moderation, validation,
 * status transitions, review notes, duplicate linking, and audit logging.
 */

const { query, pool } = require('../config/db');

// Allowed status transitions state machine
const ALLOWED_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['VALIDATED', 'REJECTED', 'NEEDS_INFORMATION', 'POTENTIAL_DUPLICATE'],
  NEEDS_INFORMATION: ['UNDER_REVIEW', 'SUBMITTED', 'REJECTED'],
  POTENTIAL_DUPLICATE: ['UNDER_REVIEW', 'VALIDATED', 'REJECTED'],
  REJECTED: ['UNDER_REVIEW'], // explicit re-evaluation
  VALIDATED: ['UNDER_REVIEW', 'ASSIGNED'], // Phase 5: can assign to university
  ASSIGNED: ['VALIDATED', 'IN_PROGRESS'], // Phase 5: can revert or progress
  IN_PROGRESS: ['ASSIGNED'], // Phase 6: can revert to assigned
};

// Statuses that strictly require a reviewer comment/reason
const STATUSES_REQUIRING_COMMENT = ['REJECTED', 'NEEDS_INFORMATION', 'POTENTIAL_DUPLICATE'];

/**
 * Get review queue with search, filtering, and pagination
 */
async function getReviewQueue(filters = {}) {
  const {
    page = 1,
    limit = 10,
    status = null,
    district = null,
    category_id = null,
    severity = null,
    search = null,
    sortBy = 'submitted_at',
    sortOrder = 'DESC',
  } = filters;

  const offset = (page - 1) * limit;
  const conditions = ["c.status != 'DRAFT'"]; // Reviewers do not review citizens' private working drafts
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`c.status = $${params.length}`);
  }

  if (district) {
    params.push(district);
    conditions.push(`cl.district = $${params.length}`);
  }

  if (category_id) {
    params.push(parseInt(category_id, 10));
    conditions.push(`c.category_id = $${params.length}`);
  }

  if (severity) {
    params.push(severity);
    conditions.push(`c.severity = $${params.length}`);
  }

  if (search) {
    params.push(`%${search.trim()}%`);
    const sIdx = params.length;
    conditions.push(`(c.title ILIKE $${sIdx} OR c.challenge_id ILIKE $${sIdx} OR c.description ILIKE $${sIdx})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Safe sorting
  const validSortFields = {
    submitted_at: 'c.submitted_at',
    created_at: 'c.created_at',
    title: 'c.title',
    severity: 'c.severity',
    status: 'c.status',
  };
  const sortColumn = validSortFields[sortBy] || 'c.submitted_at';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Count total matching
  const countQuery = `
    SELECT COUNT(*) as count
    FROM challenges c
    LEFT JOIN challenge_locations cl ON cl.challenge_id = c.id
    ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  // Fetch page items
  const dataParams = [...params, limit, offset];
  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;

  const dataQuery = `
    SELECT c.id, c.challenge_id, c.title, c.description, c.severity, c.status,
           c.submitted_at, c.created_at, c.duplicate_of_id,
           cc.name AS category_name, cc.slug AS category_slug, cc.icon AS category_icon,
           cl.district AS loc_district, cl.block AS loc_block,
           u.full_name AS citizen_name, u.email AS citizen_email,
           (SELECT COUNT(*) FROM challenge_media WHERE challenge_id = c.id) AS media_count,
           dup.challenge_id AS duplicate_of_code
    FROM challenges c
    LEFT JOIN challenge_categories cc ON cc.id = c.category_id
    LEFT JOIN challenge_locations cl ON cl.challenge_id = c.id
    LEFT JOIN users u ON u.id = c.user_id
    LEFT JOIN challenges dup ON dup.id = c.duplicate_of_id
    ${whereClause}
    ORDER BY ${sortColumn} ${order} NULLS LAST
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const dataResult = await query(dataQuery, dataParams);

  return {
    challenges: dataResult.rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get complete challenge details for administrative review
 */
async function getChallengeForReview(challengeId) {
  const result = await query(
    `SELECT c.*,
            cc.name AS category_name, cc.slug AS category_slug, cc.icon AS category_icon,
            u.full_name AS submitter_name, u.email AS submitter_email,
            u.phone AS submitter_phone, u.district AS submitter_district,
            dup.challenge_id AS duplicate_of_code, dup.title AS duplicate_of_title
     FROM challenges c
     LEFT JOIN challenge_categories cc ON cc.id = c.category_id
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN challenges dup ON dup.id = c.duplicate_of_id
     WHERE c.id = $1`,
    [challengeId]
  );

  if (result.rows.length === 0) return null;

  const challenge = result.rows[0];

  // Location
  const locResult = await query(
    'SELECT * FROM challenge_locations WHERE challenge_id = $1',
    [challengeId]
  );
  challenge.location = locResult.rows[0] || null;

  // Media attachments
  const mediaResult = await query(
    'SELECT * FROM challenge_media WHERE challenge_id = $1 ORDER BY uploaded_at ASC',
    [challengeId]
  );
  challenge.media = mediaResult.rows;

  // Public status history
  const historyResult = await query(
    `SELECT csh.*, u.full_name AS changed_by_name, u.role AS changed_by_role
     FROM challenge_status_history csh
     LEFT JOIN users u ON u.id = csh.changed_by
     WHERE csh.challenge_id = $1
     ORDER BY csh.changed_at DESC`,
    [challengeId]
  );
  challenge.status_history = historyResult.rows;

  // Internal reviewer notes
  const notesResult = await query(
    `SELECT crn.*, u.full_name AS author_name, u.role AS author_role
     FROM challenge_review_notes crn
     LEFT JOIN users u ON u.id = crn.author_id
     WHERE crn.challenge_id = $1
     ORDER BY crn.created_at DESC`,
    [challengeId]
  );
  challenge.review_notes = notesResult.rows;

  // AI Problem Intelligence (Phase 4)
  try {
    const aiService = require('./ai.service');
    challenge.ai_intelligence = await aiService.getChallengeAI(challengeId);
  } catch (aiErr) {
    challenge.ai_intelligence = null;
  }

  // Phase 5: University Matching data
  try {
    const matchingService = require('./matching.service');
    challenge.matching = await matchingService.getMatchResults(challengeId);
  } catch (matchErr) {
    challenge.matching = null;
  }

  // Phase 5: Current assignment
  try {
    const assignmentService = require('./assignment.service');
    challenge.assignment = await assignmentService.getAssignment(challengeId);
    challenge.assignment_history = await assignmentService.getAssignmentHistory(challengeId);
  } catch (assignErr) {
    challenge.assignment = null;
    challenge.assignment_history = [];
  }

  return challenge;
}

/**
 * Execute controlled status transition with validation, history logging, and audit tracking
 */
async function updateChallengeStatus(challengeId, reviewerId, { to_status, comment, duplicate_of_id }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch current challenge
    const currentRes = await client.query(
      'SELECT id, challenge_id, status FROM challenges WHERE id = $1 FOR UPDATE',
      [challengeId]
    );

    if (currentRes.rows.length === 0) {
      throw new Error('Challenge not found.');
    }

    const current = currentRes.rows[0];
    const from_status = current.status;

    // 2. Validate transition
    if (from_status === 'DRAFT') {
      throw new Error('Cannot review a challenge that is still in DRAFT status.');
    }

    const allowedNext = ALLOWED_TRANSITIONS[from_status] || [];
    if (!allowedNext.includes(to_status)) {
      throw new Error(
        `Invalid status transition from "${from_status}" to "${to_status}". Permitted transitions: ${allowedNext.join(', ') || 'None'}.`
      );
    }

    // 3. Validate required comment
    if (STATUSES_REQUIRING_COMMENT.includes(to_status)) {
      if (!comment || comment.trim().length < 5) {
        throw new Error(`A detailed reason/comment (minimum 5 characters) is required when setting status to "${to_status}".`);
      }
    }

    // 4. Validate duplicate_of_id if supplied
    let validDuplicateId = null;
    if (to_status === 'POTENTIAL_DUPLICATE' && duplicate_of_id) {
      const dupCheck = await client.query(
        'SELECT id FROM challenges WHERE id = $1 AND id != $2',
        [duplicate_of_id, challengeId]
      );
      if (dupCheck.rows.length === 0) {
        throw new Error('Invalid duplicate challenge target specified.');
      }
      validDuplicateId = duplicate_of_id;
    }

    // 5. Update challenge
    await client.query(
      `UPDATE challenges
       SET status = $1,
           duplicate_of_id = CASE WHEN $2::uuid IS NOT NULL THEN $2::uuid ELSE duplicate_of_id END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [to_status, validDuplicateId, challengeId]
    );

    // 6. Record status history
    await client.query(
      `INSERT INTO challenge_status_history (challenge_id, from_status, to_status, changed_by, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [challengeId, from_status, to_status, reviewerId, comment ? comment.trim() : `Status changed to ${to_status}.`]
    );

    // 7. Record administrative audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        reviewerId,
        `STATUS_CHANGE_${to_status}`,
        challengeId,
        JSON.stringify({
          from_status,
          to_status,
          comment: comment ? comment.trim() : null,
          duplicate_of_id: validDuplicateId,
        }),
      ]
    );

    await client.query('COMMIT');

    return await getChallengeForReview(challengeId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add an internal review note (visible only to reviewers)
 */
async function addReviewNote(challengeId, authorId, noteText) {
  if (!noteText || !noteText.trim()) {
    throw new Error('Review note cannot be empty.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertResult = await client.query(
      `INSERT INTO challenge_review_notes (challenge_id, author_id, note)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [challengeId, authorId, noteText.trim()]
    );

    const newNote = insertResult.rows[0];

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata)
       VALUES ($1, 'ADD_REVIEW_NOTE', $2, $3)`,
      [authorId, challengeId, JSON.stringify({ note_id: newNote.id })]
    );

    await client.query('COMMIT');

    // Fetch with author name
    const authorRes = await query(
      'SELECT full_name, role FROM users WHERE id = $1',
      [authorId]
    );
    const author = authorRes.rows[0] || {};

    return {
      ...newNote,
      author_name: author.full_name,
      author_role: author.role,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update administrative metadata (e.g. correct category)
 */
async function updateMetadata(challengeId, reviewerId, { category_id }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (category_id) {
      const catCheck = await client.query('SELECT id FROM challenge_categories WHERE id = $1', [category_id]);
      if (catCheck.rows.length === 0) {
        throw new Error('Invalid category ID.');
      }

      await client.query(
        'UPDATE challenges SET category_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [category_id, challengeId]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata)
       VALUES ($1, 'UPDATE_METADATA', $2, $3)`,
      [reviewerId, challengeId, JSON.stringify({ category_id })]
    );

    await client.query('COMMIT');
    return await getChallengeForReview(challengeId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get comprehensive dashboard statistics for Admin/Government portal
 */
async function getAdminDashboardStats() {
  const statsQuery = `
    SELECT
      COUNT(*) FILTER (WHERE status != 'DRAFT') AS total_challenges,
      COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS submitted,
      COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') AS under_review,
      COUNT(*) FILTER (WHERE status = 'VALIDATED') AS validated,
      COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
      COUNT(*) FILTER (WHERE status = 'NEEDS_INFORMATION') AS needs_information,
      COUNT(*) FILTER (WHERE status = 'POTENTIAL_DUPLICATE') AS potential_duplicates,
      COUNT(*) FILTER (WHERE status = 'DRAFT') AS drafts
    FROM challenges
  `;
  const statsRes = await query(statsQuery);

  // Category distribution
  const catQuery = `
    SELECT cc.name, cc.icon, COUNT(c.id) AS count
    FROM challenge_categories cc
    LEFT JOIN challenges c ON c.category_id = cc.id AND c.status != 'DRAFT'
    GROUP BY cc.id, cc.name, cc.icon
    ORDER BY count DESC
  `;
  const catRes = await query(catQuery);

  // District distribution
  const distQuery = `
    SELECT cl.district, COUNT(c.id) AS count
    FROM challenge_locations cl
    JOIN challenges c ON c.id = cl.challenge_id AND c.status != 'DRAFT'
    WHERE cl.district IS NOT NULL AND cl.district != ''
    GROUP BY cl.district
    ORDER BY count DESC
    LIMIT 10
  `;
  const distRes = await query(distQuery);

  // Recent review activity
  const activityQuery = `
    SELECT csh.*, c.challenge_id AS challenge_code, c.title AS challenge_title,
           u.full_name AS changed_by_name, u.role AS changed_by_role
    FROM challenge_status_history csh
    JOIN challenges c ON c.id = csh.challenge_id
    JOIN users u ON u.id = csh.changed_by
    ORDER BY csh.changed_at DESC
    LIMIT 6
  `;
  const activityRes = await query(activityQuery);

  return {
    overview: statsRes.rows[0] || {},
    categories: catRes.rows,
    districts: distRes.rows,
    recent_activity: activityRes.rows,
  };
}

module.exports = {
  ALLOWED_TRANSITIONS,
  STATUSES_REQUIRING_COMMENT,
  getReviewQueue,
  getChallengeForReview,
  updateChallengeStatus,
  addReviewNote,
  updateMetadata,
  getAdminDashboardStats,
};
