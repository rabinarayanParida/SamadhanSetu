const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const aiCtrl = require('../controllers/ai.controller');
const { uuidParamValidation } = require('../validators/challenge.validator');
const { overrideValidation, duplicateReviewValidation } = require('../validators/ai.validator');

// All AI endpoints require authentication and either 'admin' or 'government' role
router.use(authenticate, authorize('admin', 'government'));

// Trigger AI Problem Intelligence Pipeline
router.post('/challenges/:id/process', uuidParamValidation, aiCtrl.processChallenge);

// Get AI results, duplicates, and overrides
router.get('/challenges/:id', uuidParamValidation, aiCtrl.getChallengeAI);

// Retry AI processing
router.post('/challenges/:id/retry', uuidParamValidation, aiCtrl.retryAIProcessing);

// Record reviewer override for an AI recommendation
router.patch('/challenges/:id/override', uuidParamValidation, overrideValidation, aiCtrl.overrideAIRecommendation);

// Review duplicate candidate (CONFIRMED_DUPLICATE / NOT_DUPLICATE)
router.patch('/challenges/:id/duplicates/:candidateId', uuidParamValidation, duplicateReviewValidation, aiCtrl.updateDuplicateStatus);

module.exports = router;
