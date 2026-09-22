const { query } = require('../config/db');

/**
 * Generate a unique human-readable challenge ID
 * Format: SICP-YYYY-XXXXX (e.g., SICP-2026-00001)
 * @returns {Promise<string>} Unique challenge ID
 */
async function generateChallengeId() {
  const year = new Date().getFullYear();
  const result = await query("SELECT nextval('challenge_id_seq') AS seq");
  const seq = result.rows[0].seq;
  const padded = String(seq).padStart(5, '0');
  return `SICP-${year}-${padded}`;
}

module.exports = { generateChallengeId };
