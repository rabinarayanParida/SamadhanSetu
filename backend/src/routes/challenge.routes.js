const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { verifyOwnership, verifyChallengeAccess } = require('../middleware/ownership');
const { challengeSubmitLimiter, mediaUploadLimiter } = require('../middleware/rateLimiter');
const { challengeValidation, uuidParamValidation } = require('../validators/challenge.validator');
const challengeCtrl = require('../controllers/challenge.controller');
const mediaCtrl = require('../controllers/media.controller');
const { upload } = require('../config/multer');

// ============================================
// Category Routes (Accessible by authenticated users across roles)
// ============================================
router.get('/categories', authenticate, challengeCtrl.getCategories);

// ============================================
// Citizen-Only Challenge Queries & Creation
// ============================================

// Create challenge
router.post('/', authenticate, authorize('citizen'), challengeSubmitLimiter, challengeValidation, challengeCtrl.createChallenge);

// Get citizen's challenge stats
router.get('/stats', authenticate, authorize('citizen'), challengeCtrl.getMyStats);

// Get citizen's challenges (with pagination/filter)
router.get('/my', authenticate, authorize('citizen'), challengeCtrl.getMyChallenges);

// ============================================
// Single Challenge Access (Citizen owner, matched/assigned University, Admin/Gov)
// ============================================
router.get('/:id', authenticate, uuidParamValidation, verifyChallengeAccess, challengeCtrl.getChallenge);

// Update challenge (DRAFT only)
router.put('/:id', authenticate, authorize('citizen'), uuidParamValidation, verifyOwnership, challengeValidation, challengeCtrl.updateChallenge);

// Submit challenge (DRAFT → SUBMITTED) - supports both PUT and PATCH
router.put('/:id/submit', authenticate, authorize('citizen'), uuidParamValidation, verifyOwnership, challengeCtrl.submitChallenge);
router.patch('/:id/submit', authenticate, authorize('citizen'), uuidParamValidation, verifyOwnership, challengeCtrl.submitChallenge);

// Delete challenge (DRAFT only)
router.delete('/:id', authenticate, authorize('citizen'), uuidParamValidation, verifyOwnership, challengeCtrl.deleteChallenge);

// ============================================
// Media Routes (Citizen Owner only)
// ============================================

// Upload media to challenge
router.post(
  '/:id/media',
  authenticate,
  authorize('citizen'),
  uuidParamValidation,
  verifyOwnership,
  mediaUploadLimiter,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File is too large. Maximum size is 50MB.',
          });
        }
        if (err.code === 'INVALID_FILE_TYPE') {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }
        return res.status(500).json({
          success: false,
          message: 'File upload failed.',
        });
      }
      next();
    });
  },
  mediaCtrl.uploadMedia
);

// Delete media from challenge
router.delete(
  '/:id/media/:mediaId',
  uuidParamValidation,
  verifyOwnership,
  mediaCtrl.deleteMedia
);

module.exports = router;
