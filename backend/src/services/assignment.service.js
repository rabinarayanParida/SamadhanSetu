/**
 * Assignment Service — Phase 5
 * Handles human-decided challenge-to-university assignments,
 * university accept/decline workflow, and assignment history.
 */

const { pool, query } = require('../config/db');

/**
 * Assign a challenge to a university (admin/government action)
 */
async function assignChallenge(challengeId, { university_id, department_id, reason }, assignedBy) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify challenge exists and is eligible
    const challengeRes = await client.query(
      'SELECT id, status FROM challenges WHERE id = $1 FOR UPDATE',
      [challengeId]
    );
    if (challengeRes.rows.length === 0) throw new Error('Challenge not found.');

    const challenge = challengeRes.rows[0];
    if (!['VALIDATED', 'UNDER_REVIEW'].includes(challenge.status)) {
      throw new Error(`Challenge must be VALIDATED to assign. Current: ${challenge.status}`);
    }

    // 2. Verify university exists and is active
    const uniRes = await client.query(
      'SELECT id, name FROM universities WHERE id = $1 AND is_active = true',
      [university_id]
    );
    if (uniRes.rows.length === 0) throw new Error('University not found or inactive.');

    // 3. Supersede any existing PENDING assignments for this challenge
    await client.query(
      `UPDATE challenge_assignments SET assignment_status = 'SUPERSEDED', updated_at = CURRENT_TIMESTAMP
       WHERE challenge_id = $1 AND assignment_status = 'PENDING'`,
      [challengeId]
    );

    // 4. Get top AI recommendation for comparison
    const aiMatchRes = await client.query(
      `SELECT university_id, match_score FROM challenge_matches
       WHERE challenge_id = $1 AND rank = 1
       ORDER BY generated_at DESC LIMIT 1`,
      [challengeId]
    );
    const aiRecommended = aiMatchRes.rows.length > 0 ? aiMatchRes.rows[0] : null;

    // 5. Create assignment record
    const assignRes = await client.query(
      `INSERT INTO challenge_assignments 
       (challenge_id, university_id, department_id, assigned_by, assignment_status,
        assignment_reason, ai_recommended_university_id, ai_match_score)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7)
       RETURNING *`,
      [
        challengeId, university_id, department_id || null, assignedBy,
        reason || null,
        aiRecommended ? aiRecommended.university_id : null,
        aiRecommended ? aiRecommended.match_score : null,
      ]
    );

    // 6. Update challenge status to ASSIGNED
    await client.query(
      `UPDATE challenges SET status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [challengeId]
    );

    // 7. Record status history
    await client.query(
      `INSERT INTO challenge_status_history (challenge_id, from_status, to_status, changed_by, comment)
       VALUES ($1, $2, 'ASSIGNED', $3, $4)`,
      [challengeId, challenge.status, assignedBy, `Assigned to university: ${uniRes.rows[0].name}. ${reason || ''}`]
    );

    // 8. Mark the selected match as SELECTED (if it exists)
    await client.query(
      `UPDATE challenge_matches SET match_status = 'SELECTED', updated_at = CURRENT_TIMESTAMP
       WHERE challenge_id = $1 AND university_id = $2 AND match_status IN ('RECOMMENDED', 'SHORTLISTED')`,
      [challengeId, university_id]
    );

    // 9. Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata)
       VALUES ($1, 'CHALLENGE_ASSIGNED', $2, $3)`,
      [
        assignedBy, challengeId,
        JSON.stringify({
          university_id, department_id: department_id || null,
          reason,
          ai_recommended: aiRecommended ? aiRecommended.university_id : null,
          is_ai_recommendation: aiRecommended ? aiRecommended.university_id === university_id : false,
        }),
      ]
    );

    await client.query('COMMIT');
    return assignRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get current active assignment for a challenge
 */
async function getAssignment(challengeId) {
  const res = await query(
    `SELECT ca.*, u.name AS university_name, u.code AS university_code,
            u.type AS university_type, u.district AS university_district,
            d.name AS department_name,
            assigned_user.full_name AS assigned_by_name,
            ai_uni.name AS ai_recommended_name
     FROM challenge_assignments ca
     JOIN universities u ON u.id = ca.university_id
     LEFT JOIN departments d ON d.id = ca.department_id
     LEFT JOIN users assigned_user ON assigned_user.id = ca.assigned_by
     LEFT JOIN universities ai_uni ON ai_uni.id = ca.ai_recommended_university_id
     WHERE ca.challenge_id = $1
     ORDER BY ca.assigned_at DESC
     LIMIT 1`,
    [challengeId]
  );
  return res.rows.length > 0 ? res.rows[0] : null;
}

/**
 * Get assignment history for a challenge
 */
async function getAssignmentHistory(challengeId) {
  const res = await query(
    `SELECT ca.*, u.name AS university_name, u.code AS university_code,
            assigned_user.full_name AS assigned_by_name
     FROM challenge_assignments ca
     JOIN universities u ON u.id = ca.university_id
     LEFT JOIN users assigned_user ON assigned_user.id = ca.assigned_by
     WHERE ca.challenge_id = $1
     ORDER BY ca.assigned_at DESC`,
    [challengeId]
  );
  return res.rows;
}

/**
 * Get incoming challenges for a university (based on user's university_id)
 */
async function getUniversityChallenges(universityId, filters = {}) {
  const { status, page = 1, limit = 10 } = filters;
  const conditions = ['ca.university_id = $1'];
  const params = [universityId];

  if (status) {
    params.push(status);
    conditions.push(`ca.assignment_status = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const countRes = await query(
    `SELECT COUNT(*) as count FROM challenge_assignments ca ${whereClause}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const dataParams = [...params, limit, offset];
  const dataQuery = `
    SELECT ca.*, c.title AS challenge_title, c.description AS challenge_description,
           c.challenge_id AS challenge_code, c.severity, c.status AS challenge_status,
           cat.name AS category_name, cat.icon AS category_icon,
           loc.district AS challenge_district,
           cm.match_score, cm.explanation AS match_explanation,
           assigned_user.full_name AS assigned_by_name
    FROM challenge_assignments ca
    JOIN challenges c ON c.id = ca.challenge_id
    LEFT JOIN challenge_categories cat ON cat.id = c.category_id
    LEFT JOIN challenge_locations loc ON loc.challenge_id = c.id
    LEFT JOIN challenge_matches cm ON cm.challenge_id = ca.challenge_id 
      AND cm.university_id = ca.university_id AND cm.rank = (
        SELECT MIN(rank) FROM challenge_matches 
        WHERE challenge_id = ca.challenge_id AND university_id = ca.university_id
      )
    LEFT JOIN users assigned_user ON assigned_user.id = ca.assigned_by
    ${whereClause}
    ORDER BY ca.assigned_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const dataRes = await query(dataQuery, dataParams);
  return {
    assignments: dataRes.rows,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * University accepts assignment
 */
async function acceptAssignment(assignmentId, universityUserId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const res = await client.query(
      `SELECT ca.*, u.name AS university_name
       FROM challenge_assignments ca
       JOIN universities u ON u.id = ca.university_id
       WHERE ca.id = $1 FOR UPDATE`,
      [assignmentId]
    );
    if (res.rows.length === 0) throw new Error('Assignment not found.');

    const assignment = res.rows[0];
    if (assignment.assignment_status !== 'PENDING') {
      throw new Error(`Cannot accept — current status: ${assignment.assignment_status}`);
    }

    // Verify user belongs to this university
    const userRes = await client.query(
      'SELECT university_id FROM users WHERE id = $1',
      [universityUserId]
    );
    if (userRes.rows.length === 0 || userRes.rows[0].university_id !== assignment.university_id) {
      throw new Error('You are not authorized to act on behalf of this university.');
    }

    await client.query(
      `UPDATE challenge_assignments 
       SET assignment_status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [assignmentId]
    );

    // Update challenge status
    await client.query(
      `UPDATE challenges SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [assignment.challenge_id]
    );

    await client.query(
      `INSERT INTO challenge_status_history (challenge_id, from_status, to_status, changed_by, comment)
       VALUES ($1, 'ASSIGNED', 'IN_PROGRESS', $2, $3)`,
      [assignment.challenge_id, universityUserId, `Accepted by ${assignment.university_name}.`]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata) VALUES ($1, 'ASSIGNMENT_ACCEPTED', $2, $3)`,
      [universityUserId, assignment.challenge_id, JSON.stringify({ assignment_id: assignmentId, university_id: assignment.university_id })]
    );

    await client.query('COMMIT');
    return { success: true, status: 'ACCEPTED' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * University declines assignment
 */
async function declineAssignment(assignmentId, universityUserId, reason) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const res = await client.query(
      `SELECT ca.*, u.name AS university_name
       FROM challenge_assignments ca
       JOIN universities u ON u.id = ca.university_id
       WHERE ca.id = $1 FOR UPDATE`,
      [assignmentId]
    );
    if (res.rows.length === 0) throw new Error('Assignment not found.');

    const assignment = res.rows[0];
    if (assignment.assignment_status !== 'PENDING') {
      throw new Error(`Cannot decline — current status: ${assignment.assignment_status}`);
    }

    // Verify user belongs to this university
    const userRes = await client.query(
      'SELECT university_id FROM users WHERE id = $1',
      [universityUserId]
    );
    if (userRes.rows.length === 0 || userRes.rows[0].university_id !== assignment.university_id) {
      throw new Error('You are not authorized to act on behalf of this university.');
    }

    await client.query(
      `UPDATE challenge_assignments 
       SET assignment_status = 'DECLINED', responded_at = CURRENT_TIMESTAMP, 
           response_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason || null, assignmentId]
    );

    // Revert challenge status to VALIDATED
    await client.query(
      `UPDATE challenges SET status = 'VALIDATED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [assignment.challenge_id]
    );

    await client.query(
      `INSERT INTO challenge_status_history (challenge_id, from_status, to_status, changed_by, comment)
       VALUES ($1, 'ASSIGNED', 'VALIDATED', $2, $3)`,
      [assignment.challenge_id, universityUserId, `Declined by ${assignment.university_name}. Reason: ${reason || 'No reason provided'}`]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata) VALUES ($1, 'ASSIGNMENT_DECLINED', $2, $3)`,
      [universityUserId, assignment.challenge_id, JSON.stringify({ assignment_id: assignmentId, university_id: assignment.university_id, reason })]
    );

    await client.query('COMMIT');
    return { success: true, status: 'DECLINED' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  assignChallenge,
  getAssignment,
  getAssignmentHistory,
  getUniversityChallenges,
  acceptAssignment,
  declineAssignment,
};
