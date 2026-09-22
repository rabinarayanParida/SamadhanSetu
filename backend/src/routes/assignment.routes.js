const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const assignCtrl = require('../controllers/assignment.controller');
const { uuidParamValidation } = require('../validators/challenge.validator');
const { body } = require('express-validator');

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const assignValidation = [
  ...uuidParamValidation,
  body('university_id')
    .matches(UUID_REGEX)
    .withMessage('Valid university_id is required.'),
  body('department_id')
    .optional()
    .matches(UUID_REGEX)
    .withMessage('department_id must be a valid UUID.'),
  body('reason').optional().isString().trim(),
];

// Admin/Government assignment endpoints
router.post(
  '/challenges/:id/assign',
  authenticate, authorize('admin', 'government'),
  assignValidation,
  assignCtrl.assignChallenge
);

router.get(
  '/challenges/:id/assignment',
  authenticate, authorize('admin', 'government'),
  uuidParamValidation,
  assignCtrl.getAssignment
);

router.get(
  '/challenges/:id/assignment/history',
  authenticate, authorize('admin', 'government'),
  uuidParamValidation,
  assignCtrl.getAssignmentHistory
);

// University-facing endpoints
router.get(
  '/university/challenges',
  authenticate, authorize('university'),
  assignCtrl.getUniversityChallenges
);

router.post(
  '/university/challenges/:assignmentId/accept',
  authenticate, authorize('university'),
  assignCtrl.acceptAssignment
);

router.post(
  '/university/challenges/:assignmentId/decline',
  authenticate, authorize('university'),
  body('reason').optional().isString().trim(),
  assignCtrl.declineAssignment
);

module.exports = router;
