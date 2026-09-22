const { validationResult } = require('express-validator');
const challengeService = require('../services/challenge.service');

/**
 * GET /api/challenges/categories
 * List all challenge categories
 */
async function getCategories(req, res) {
  try {
    const categories = await challengeService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
}

/**
 * POST /api/challenges
 * Create a new challenge draft
 */
async function createChallenge(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const challenge = await challengeService.createChallenge(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Challenge draft created successfully.',
      data: challenge,
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ success: false, message: 'Failed to create challenge.' });
  }
}

/**
 * GET /api/challenges/my
 * List the current user's challenges with pagination
 */
async function getMyChallenges(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const result = await challengeService.getUserChallenges(req.user.id, {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10) || 10, 50),
      status: status || null,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get my challenges error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch challenges.' });
  }
}

/**
 * GET /api/challenges/stats
 * Get citizen's challenge statistics
 */
async function getMyStats(req, res) {
  try {
    const stats = await challengeService.getCitizenStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics.' });
  }
}

/**
 * GET /api/challenges/:id
 * Get a single challenge (ownership verified by middleware)
 */
async function getChallenge(req, res) {
  try {
    const challenge = await challengeService.getChallengeById(req.params.id, req.user);

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found.' });
    }

    res.json({ success: true, data: challenge });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch challenge.' });
  }
}

/**
 * PUT /api/challenges/:id
 * Update a challenge draft
 */
async function updateChallenge(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    // Verify it's in DRAFT or NEEDS_INFORMATION status
    if (req.challenge && req.challenge.status !== 'DRAFT' && req.challenge.status !== 'NEEDS_INFORMATION') {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT and NEEDS_INFORMATION challenges can be edited.',
      });
    }

    const challenge = await challengeService.updateChallenge(req.params.id, req.user.id, req.body);

    res.json({
      success: true,
      message: 'Challenge updated successfully.',
      data: challenge,
    });
  } catch (error) {
    console.error('Update challenge error:', error);
    const msg = error.message.includes('not found') || error.message.includes('DRAFT')
      ? error.message
      : 'Failed to update challenge.';
    res.status(400).json({ success: false, message: msg });
  }
}

/**
 * PUT /api/challenges/:id/submit
 * Submit a draft challenge
 */
async function submitChallenge(req, res) {
  try {
    const challenge = await challengeService.submitChallenge(req.params.id, req.user.id);

    res.json({
      success: true,
      message: `Challenge ${challenge.challenge_id} submitted successfully!`,
      data: challenge,
    });
  } catch (error) {
    console.error('Submit challenge error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/challenges/:id
 * Delete a draft challenge
 */
async function deleteChallenge(req, res) {
  try {
    await challengeService.deleteChallenge(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Challenge deleted successfully.',
    });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

module.exports = {
  getCategories,
  createChallenge,
  getMyChallenges,
  getMyStats,
  getChallenge,
  updateChallenge,
  submitChallenge,
  deleteChallenge,
};
