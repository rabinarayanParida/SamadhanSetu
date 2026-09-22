const mediaService = require('../services/media.service');

/**
 * POST /api/challenges/:id/media
 * Upload a file to a challenge
 */
async function uploadMedia(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a file.',
      });
    }

    // Verify challenge is in DRAFT status
    if (req.challenge && req.challenge.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Media can only be uploaded to DRAFT challenges.',
      });
    }

    const media = await mediaService.saveMedia(req.params.id, req.file);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully.',
      data: media,
    });
  } catch (error) {
    console.error('Upload media error:', error);
    const status = error.message.includes('Maximum') || error.message.includes('must be under') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/challenges/:id/media/:mediaId
 * Delete a media file from a challenge
 */
async function deleteMedia(req, res) {
  try {
    await mediaService.deleteMedia(req.params.id, req.params.mediaId, req.user.id);

    res.json({
      success: true,
      message: 'File deleted successfully.',
    });
  } catch (error) {
    console.error('Delete media error:', error);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
}

module.exports = { uploadMedia, deleteMedia };
