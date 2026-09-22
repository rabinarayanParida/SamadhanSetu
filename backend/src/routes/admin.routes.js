const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const adminCtrl = require('../controllers/admin.controller');
const {
  updateStatusValidation,
  reviewNoteValidation,
  updateMetadataValidation,
} = require('../validators/admin.validator');
const { uuidParamValidation } = require('../validators/challenge.validator');

// All administrative review routes require authentication and either 'admin' or 'government' role
router.use(authenticate, authorize('admin', 'government'));

// Dashboard aggregated statistics
router.get('/dashboard/stats', adminCtrl.getDashboardStats);

// Review Queue
router.get('/challenges', adminCtrl.getChallenges);

// Single challenge review details
router.get('/challenges/:id', uuidParamValidation, adminCtrl.getChallengeById);

// Update challenge status
router.patch('/challenges/:id/status', updateStatusValidation, adminCtrl.updateStatus);

// Add internal review note
router.post('/challenges/:id/review-notes', reviewNoteValidation, adminCtrl.addReviewNote);

// Correct challenge metadata
router.patch('/challenges/:id/metadata', updateMetadataValidation, adminCtrl.updateMetadata);

module.exports = router;
