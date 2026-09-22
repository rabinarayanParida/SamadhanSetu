const { validationResult } = require('express-validator');
const adminService = require('../services/admin.service');

/**
 * GET /api/admin/challenges
 * Retrieve challenge review queue with search & filters
 */
async function getChallenges(req, res) {
  try {
    const queue = await adminService.getReviewQueue(req.query);
    res.json({ success: true, data: queue });
  } catch (error) {
    console.error('Admin getChallenges error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch review queue.' });
  }
}

/**
 * GET /api/admin/challenges/:id
 * Retrieve single challenge full details for review
 */
async function getChallengeById(req, res) {
  try {
    const challenge = await adminService.getChallengeForReview(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found.' });
    }
    res.json({ success: true, data: challenge });
  } catch (error) {
    console.error('Admin getChallengeById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch challenge details.' });
  }
}

/**
 * PATCH /api/admin/challenges/:id/status
 * Execute validated status transition with mandatory reason checking
 */
async function updateStatus(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const updated = await adminService.updateChallengeStatus(
      req.params.id,
      req.user.id,
      req.body
    );

    res.json({
      success: true,
      message: `Challenge status successfully updated to ${req.body.to_status}.`,
      data: updated,
    });
  } catch (error) {
    console.error('Admin updateStatus error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/admin/challenges/:id/review-notes
 * Add internal reviewer note
 */
async function addReviewNote(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const note = await adminService.addReviewNote(
      req.params.id,
      req.user.id,
      req.body.note
    );

    res.status(201).json({
      success: true,
      message: 'Review note added successfully.',
      data: note,
    });
  } catch (error) {
    console.error('Admin addReviewNote error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/admin/challenges/:id/metadata
 * Correct metadata (e.g. category)
 */
async function updateMetadata(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const updated = await adminService.updateMetadata(
      req.params.id,
      req.user.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Challenge metadata updated.',
      data: updated,
    });
  } catch (error) {
    console.error('Admin updateMetadata error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/admin/dashboard/stats
 * Aggregate metrics across all challenges, categories, and districts
 */
async function getDashboardStats(req, res) {
  try {
    const stats = await adminService.getAdminDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Admin getDashboardStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
}

module.exports = {
  getChallenges,
  getChallengeById,
  updateStatus,
  addReviewNote,
  updateMetadata,
  getDashboardStats,
};
