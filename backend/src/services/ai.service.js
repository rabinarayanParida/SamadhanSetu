const crypto = require('crypto');
const { pool } = require('../config/db');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || 'dev_sicp_ai_internal_token_2026';

/**
 * Executes AI Problem Intelligence Pipeline for a challenge
 */
async function processChallenge(challengeId, reviewerId, options = {}) {
  const client = await pool.connect();
  try {
    // 1. Fetch challenge and metadata
    const challengeQuery = `
      SELECT 
        c.id, c.challenge_id, c.title, c.description, c.affected_population,
        c.severity, c.existing_attempts, c.expected_outcome, c.status,
        cat.name AS citizen_category,
        loc.district, loc.block, loc.village_city, loc.address, loc.latitude, loc.longitude,
        (SELECT COUNT(*)::int FROM challenge_media m WHERE m.challenge_id = c.id) AS media_count
      FROM challenges c
      LEFT JOIN challenge_categories cat ON cat.id = c.category_id
      LEFT JOIN challenge_locations loc ON loc.challenge_id = c.id
      WHERE c.id = $1
    `;
    const res = await client.query(challengeQuery, [challengeId]);
    if (res.rows.length === 0) {
      throw new Error('Challenge not found.');
    }
    const challenge = res.rows[0];

    // 2. Fetch existing candidates pool (excluding the current challenge)
    const candidateQuery = `
      SELECT 
        c.id AS challenge_id, 
        c.challenge_id AS challenge_code, 
        c.title, 
        c.description,
        cat.name AS category,
        e.embedding
      FROM challenges c
      LEFT JOIN challenge_categories cat ON cat.id = c.category_id
      LEFT JOIN challenge_embeddings e ON e.challenge_id = c.id
      WHERE c.id != $1 AND c.status != 'DRAFT'
      ORDER BY c.created_at DESC
      LIMIT 60
    `;
    const candidateRes = await client.query(candidateQuery, [challengeId]);
    const candidatePool = candidateRes.rows.map(cand => ({
      challenge_id: cand.challenge_id,
      challenge_code: cand.challenge_code,
      title: cand.title,
      description: cand.description,
      category: cand.category,
      embedding: cand.embedding ? (typeof cand.embedding === 'string' ? JSON.parse(cand.embedding) : cand.embedding) : null,
    }));

    // 3. Mark or create processing record as PROCESSING
    await client.query(
      `INSERT INTO challenge_ai_results (challenge_id, processing_status, updated_at)
       VALUES ($1, 'PROCESSING', CURRENT_TIMESTAMP)
       ON CONFLICT (challenge_id) DO UPDATE
       SET processing_status = 'PROCESSING',
           error_message = NULL,
           updated_at = CURRENT_TIMESTAMP`,
      [challengeId]
    );

    // 4. Construct payload for Python AI service
    const payload = {
      challenge_id: challenge.id,
      challenge_code: challenge.challenge_id,
      title: challenge.title,
      description: challenge.description,
      citizen_category: challenge.citizen_category,
      severity: challenge.severity,
      affected_population: challenge.affected_population,
      existing_attempts: challenge.existing_attempts,
      expected_outcome: challenge.expected_outcome,
      location_context: {
        district: challenge.district,
        block: challenge.block,
        village_city: challenge.village_city,
        address: challenge.address,
        latitude: challenge.latitude ? parseFloat(challenge.latitude) : null,
        longitude: challenge.longitude ? parseFloat(challenge.longitude) : null,
      },
      media_count: challenge.media_count || 0,
      candidate_pool: candidatePool,
    };

    // 5. Call Python microservice
    let aiResponse;
    try {
      const response = await fetch(`${AI_SERVICE_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': AI_SERVICE_SECRET,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI microservice returned HTTP ${response.status}: ${errorText}`);
      }

      aiResponse = await response.json();
    } catch (fetchErr) {
      // Record failure in challenge_ai_results
      await client.query(
        `UPDATE challenge_ai_results
         SET processing_status = 'FAILED',
             error_message = $1,
             retry_count = retry_count + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE challenge_id = $2`,
        [fetchErr.message, challengeId]
      );

      // Record in audit log
      if (reviewerId) {
        await client.query(
          `INSERT INTO audit_logs (user_id, action, challenge_id, metadata)
           VALUES ($1, 'AI_ANALYSIS_FAILED', $2, $3)`,
          [reviewerId, challengeId, JSON.stringify({ error: fetchErr.message })]
        );
      }

      throw fetchErr;
    }

    // 6. Validate contract from AI service
    if (aiResponse.status !== 'COMPLETED') {
      const errMsg = aiResponse.error_message || 'AI processing pipeline failed to complete.';
      await client.query(
        `UPDATE challenge_ai_results
         SET processing_status = 'FAILED',
             error_message = $1,
             retry_count = retry_count + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE challenge_id = $2`,
        [errMsg, challengeId]
      );
      throw new Error(errMsg);
    }

    // 7. Persist AI Results into PostgreSQL
    const { classification, validation, priority, routing, duplicate_candidates, embedding } = aiResponse;

    await client.query(
      `UPDATE challenge_ai_results
       SET processing_status = 'COMPLETED',
           ai_category = $1,
           ai_subcategory = $2,
           classification_confidence = $3,
           is_valid = $4,
           validation_confidence = $5,
           quality_score = $6,
           missing_information = $7::jsonb,
           validation_warnings = $8::jsonb,
           priority_score = $9,
           priority_level = $10,
           priority_factors = $11::jsonb,
           priority_confidence = $12,
           priority_explanation = $13,
           routing_domain = $14,
           routing_confidence = $15,
           routing_explanation = $16,
           model_name = $17,
           prompt_version = $18,
           pipeline_version = $19,
           error_message = NULL,
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE challenge_id = $20`,
      [
        classification.category,
        classification.subcategory,
        classification.confidence,
        validation.is_valid,
        validation.confidence,
        validation.quality_score,
        JSON.stringify(validation.missing_information || []),
        JSON.stringify(validation.warnings || []),
        priority.score,
        priority.level,
        JSON.stringify(priority.factors || {}),
        priority.confidence,
        priority.explanation,
        routing.domain,
        routing.confidence,
        routing.explanation,
        aiResponse.model_name,
        aiResponse.prompt_version,
        aiResponse.pipeline_version,
        challengeId,
      ]
    );

    // 8. Persist vector embedding
    if (embedding && Array.isArray(embedding)) {
      const textHash = crypto
        .createHash('sha256')
        .update(`${challenge.title} ${challenge.description}`)
        .digest('hex');

      await client.query(
        `INSERT INTO challenge_embeddings (challenge_id, embedding, embedding_model, embedding_text_hash, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (challenge_id) DO UPDATE
         SET embedding = $2::jsonb,
             embedding_model = $3,
             embedding_text_hash = $4,
             updated_at = CURRENT_TIMESTAMP`,
        [challengeId, JSON.stringify(embedding), aiResponse.model_name, textHash]
      );
    }

    // 9. Persist duplicate candidates (threshold >= 0.40)
    if (duplicate_candidates && duplicate_candidates.length > 0) {
      for (const dup of duplicate_candidates) {
        if (!dup.candidate_id || dup.candidate_id === challengeId) continue;
        await client.query(
          `INSERT INTO challenge_ai_duplicates (challenge_id, candidate_id, similarity_score, review_status)
           VALUES ($1, $2, $3, 'PENDING')
           ON CONFLICT (challenge_id, candidate_id) DO UPDATE
           SET similarity_score = $3`,
          [challengeId, dup.candidate_id, dup.similarity_score]
        );
      }
    }

    // 10. Audit log
    if (reviewerId) {
      await client.query(
        `INSERT INTO audit_logs (user_id, action, challenge_id, metadata)
         VALUES ($1, 'AI_ANALYSIS_COMPLETED', $2, $3)`,
        [
          reviewerId,
          challengeId,
          JSON.stringify({
            model: aiResponse.model_name,
            quality_score: validation.quality_score,
            priority_score: priority.score,
            priority_level: priority.level,
            duplicates_found: duplicate_candidates ? duplicate_candidates.length : 0,
          }),
        ]
      );
    }

    return await getChallengeAI(challengeId);
  } finally {
    client.release();
  }
}

/**
 * Retrieves AI Analysis results, duplicate candidates, and overrides for a challenge
 */
async function getChallengeAI(challengeId) {
  const client = await pool.connect();
  try {
    // AI Results
    const aiRes = await client.query(
      `SELECT * FROM challenge_ai_results WHERE challenge_id = $1`,
      [challengeId]
    );

    const results = aiRes.rows.length > 0 ? aiRes.rows[0] : null;

    // Duplicate Candidates
    const dupRes = await client.query(
      `SELECT 
         d.id, d.challenge_id, d.candidate_id, d.similarity_score,
         d.review_status, d.reviewed_at, d.review_comment, d.created_at,
         c.challenge_id AS candidate_code,
         c.title AS candidate_title,
         c.status AS candidate_status,
         cat.name AS candidate_category,
         u.full_name AS reviewed_by_name
       FROM challenge_ai_duplicates d
       JOIN challenges c ON c.id = d.candidate_id
       LEFT JOIN challenge_categories cat ON cat.id = c.category_id
       LEFT JOIN users u ON u.id = d.reviewed_by
       WHERE d.challenge_id = $1
       ORDER BY d.similarity_score DESC`,
      [challengeId]
    );

    // Reviewer Overrides
    const overridesRes = await client.query(
      `SELECT 
         o.id, o.challenge_id, o.field_name, o.ai_value, o.human_value,
         o.reason, o.created_at,
         u.full_name AS reviewer_name,
         u.role AS reviewer_role
       FROM challenge_ai_overrides o
       JOIN users u ON u.id = o.reviewer_id
       WHERE o.challenge_id = $1
       ORDER BY o.created_at DESC`,
      [challengeId]
    );

    return {
      ai_results: results,
      duplicate_candidates: dupRes.rows,
      overrides: overridesRes.rows,
    };
  } finally {
    client.release();
  }
}

/**
 * Retries AI processing on a challenge
 */
async function retryAIProcessing(challengeId, reviewerId) {
  return await processChallenge(challengeId, reviewerId, { isRetry: true });
}

/**
 * Records a human reviewer override for an AI recommendation
 */
async function overrideAIRecommendation(challengeId, reviewerId, { field_name, human_value, reason }) {
  const client = await pool.connect();
  try {
    // 1. Fetch current AI value
    const aiRes = await client.query(
      `SELECT ai_category, ai_subcategory, priority_level, priority_score, routing_domain
       FROM challenge_ai_results WHERE challenge_id = $1`,
      [challengeId]
    );

    let aiValue = null;
    if (aiRes.rows.length > 0) {
      const row = aiRes.rows[0];
      if (field_name === 'category') aiValue = row.ai_category;
      else if (field_name === 'subcategory') aiValue = row.ai_subcategory;
      else if (field_name === 'priority_level') aiValue = row.priority_level;
      else if (field_name === 'priority_score') aiValue = String(row.priority_score);
      else if (field_name === 'routing_domain') aiValue = row.routing_domain;
    }

    // 2. Insert override record
    const insertRes = await client.query(
      `INSERT INTO challenge_ai_overrides (challenge_id, reviewer_id, field_name, ai_value, human_value, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [challengeId, reviewerId, field_name, aiValue, human_value, reason.trim()]
    );

    // 3. Log audit event
    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata)
       VALUES ($1, 'AI_RECOMMENDATION_OVERRIDDEN', $2, $3)`,
      [
        reviewerId,
        challengeId,
        JSON.stringify({
          field_name,
          ai_value: aiValue,
          human_value,
          reason: reason.trim(),
        }),
      ]
    );

    return insertRes.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Updates review status for a duplicate candidate (Confirm Duplicate / Not a Duplicate)
 */
async function updateDuplicateStatus(challengeId, candidateId, reviewerId, { review_status, comment }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update duplicate record
    const updateRes = await client.query(
      `UPDATE challenge_ai_duplicates
       SET review_status = $1,
           reviewed_by = $2,
           reviewed_at = CURRENT_TIMESTAMP,
           review_comment = $3
       WHERE challenge_id = $4 AND candidate_id = $5
       RETURNING *`,
      [review_status, reviewerId, comment ? comment.trim() : null, challengeId, candidateId]
    );

    if (updateRes.rows.length === 0) {
      throw new Error('Duplicate candidate record not found.');
    }

    // 2. If reviewer confirms it as duplicate, update challenge status & parent reference if not already set
    if (review_status === 'CONFIRMED_DUPLICATE') {
      await client.query(
        `UPDATE challenges
         SET duplicate_of_id = COALESCE(duplicate_of_id, $1::uuid),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [candidateId, challengeId]
      );
    }

    // 3. Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, challenge_id, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        reviewerId,
        `AI_DUPLICATE_DECISION_${review_status}`,
        challengeId,
        JSON.stringify({
          candidate_id: candidateId,
          review_status,
          comment: comment ? comment.trim() : null,
        }),
      ]
    );

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  processChallenge,
  getChallengeAI,
  retryAIProcessing,
  overrideAIRecommendation,
  updateDuplicateStatus,
};
