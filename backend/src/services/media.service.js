/**
 * Media Service
 * Handles file upload validation and database records for challenge media.
 */

const { query } = require('../config/db');
const { getFileType, MAX_SIZES } = require('../config/multer');
const fs = require('fs');
const path = require('path');

/**
 * Save uploaded file metadata to database
 * @param {string} challengeId - Challenge UUID
 * @param {Object} file - Multer file object
 * @returns {Object} Saved media record
 */
async function saveMedia(challengeId, file) {
  const fileType = getFileType(file.mimetype);

  // Validate file size against type-specific limits
  if (file.size > MAX_SIZES[fileType]) {
    // Delete the uploaded file
    try { fs.unlinkSync(file.path); } catch {}
    const maxMB = Math.round(MAX_SIZES[fileType] / (1024 * 1024));
    throw new Error(`${fileType} files must be under ${maxMB}MB. Uploaded: ${Math.round(file.size / (1024 * 1024))}MB.`);
  }

  // Check media count limits per challenge
  const countResult = await query(
    'SELECT COUNT(*) FROM challenge_media WHERE challenge_id = $1 AND file_type = $2',
    [challengeId, fileType]
  );
  const count = parseInt(countResult.rows[0].count, 10);

  const limits = { photo: 10, video: 3, document: 5 };
  if (count >= limits[fileType]) {
    try { fs.unlinkSync(file.path); } catch {}
    throw new Error(`Maximum ${limits[fileType]} ${fileType} files allowed per challenge.`);
  }

  const result = await query(
    `INSERT INTO challenge_media
      (challenge_id, file_name, file_path, file_type, mime_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      challengeId,
      file.originalname,
      file.path.replace(/\\/g, '/'),
      fileType,
      file.mimetype,
      file.size,
    ]
  );

  return result.rows[0];
}

/**
 * Delete a media file and its record
 * @param {string} challengeId - Challenge UUID
 * @param {string} mediaId - Media UUID
 * @param {string} userId - User ID for ownership verification
 * @returns {boolean}
 */
async function deleteMedia(challengeId, mediaId, userId) {
  // Verify ownership through challenge
  const ownerCheck = await query(
    'SELECT c.id FROM challenges c WHERE c.id = $1 AND c.user_id = $2',
    [challengeId, userId]
  );

  if (ownerCheck.rows.length === 0) {
    throw new Error('Challenge not found or not owned by user.');
  }

  // Get media record
  const mediaResult = await query(
    'SELECT * FROM challenge_media WHERE id = $1 AND challenge_id = $2',
    [mediaId, challengeId]
  );

  if (mediaResult.rows.length === 0) {
    throw new Error('Media file not found.');
  }

  const media = mediaResult.rows[0];

  // Delete file from disk
  try {
    const filePath = path.resolve(media.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error('Error deleting file from disk:', err.message);
  }

  // Delete database record
  await query('DELETE FROM challenge_media WHERE id = $1', [mediaId]);

  return true;
}

/**
 * Get all media for a challenge
 * @param {string} challengeId - Challenge UUID
 * @returns {Array} Media records
 */
async function getMediaForChallenge(challengeId) {
  const result = await query(
    'SELECT * FROM challenge_media WHERE challenge_id = $1 ORDER BY uploaded_at ASC',
    [challengeId]
  );
  return result.rows;
}

module.exports = { saveMedia, deleteMedia, getMediaForChallenge };
